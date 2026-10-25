#!/usr/bin/env python3
"""Fetch the schema-2 public asset manifest using verified, immutable sources."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html
from http.client import HTTPException
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import tempfile
import threading
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_SOURCE = 64 * 1024 * 1024
MAX_PAGE = 4 * 1024 * 1024
SHA = re.compile(r"[0-9a-f]{64}\Z")
RAW = re.compile(r"/(?:ploober/twinleafgg|duanxr/PTCG-CHS-Datasets|1niceroli/ptcg-assets)/[0-9a-fA-F]{40}/.+\Z")
PAGE = re.compile(r"/tcg/product/[0-9]+\.html\Z")
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".avif"}
GROUPS = {"cards", "ui", "sfx"}
TEMP = re.compile(r"\.asset-tmp-([0-9]+)-[A-Za-z0-9_-]+\.tmp\Z")


class AssetError(Exception):
    """Only fixed, non-sensitive error codes cross the CLI boundary."""


def fail(code: str) -> None:
    raise AssetError(code)


def integer(value: object, minimum: int = 1, maximum: int | None = None) -> bool:
    return type(value) is int and value >= minimum and (maximum is None or value <= maximum)


def fields(value: object, required: set[str], optional: set[str] = frozenset()) -> None:
    if not isinstance(value, dict) or not required <= value.keys() or value.keys() - required - optional:
        fail("invalid-manifest-fields")


def clean_text(value: object) -> bool:
    return isinstance(value, str) and bool(value) and not any(unicodedata.category(c).startswith("C") for c in value)


def validate_url(value: object, kind: str = "source", signed: bool = False) -> str:
    if not clean_text(value) or "\\" in value or any(c.isspace() for c in value):
        fail("invalid-url")
    try:
        u = urlsplit(value)
        if u.scheme != "https" or u.username is not None or u.password is not None or u.port is not None:
            fail("invalid-url")
        if "#" in value or ("?" in value and not signed) or u.netloc != u.hostname:
            fail("invalid-url")
        # Encoded separators/dot segments are not needed by any allowed source.
        if "%" in u.path or any(p in {".", "..", ""} for p in u.path.split("/")[1:]):
            fail("invalid-url-path")
        if kind == "page":
            allowed = u.hostname == "www.pokemon.cn" and PAGE.fullmatch(u.path)
        elif u.hostname == "raw.githubusercontent.com":
            allowed = RAW.fullmatch(u.path) and not u.query
        elif u.hostname == "pokewalls.wordpress.com":
            allowed = u.path.startswith("/wp-content/uploads/") and u.path.lower().endswith(".jpg") and not u.query
        else:
            allowed = u.hostname == "image.pokemon.com.cn" and u.path.startswith("/wp-content/uploads/") and u.path.lower().endswith(".png")
        if not allowed:
            fail("url-not-allowed")
    except (ValueError, TypeError):
        fail("invalid-url")
    return value


def target_path(value: object) -> str:
    if not clean_text(value) or any(c in value for c in ("\\", "%", ":")):
        fail("unsafe-target-path")
    p = PurePosixPath(value)
    if p.is_absolute() or any(c in {"", ".", ".."} for c in value.split("/")) or str(p) != value:
        fail("unsafe-target-path")
    ext = p.suffix.lower()
    allowed = (
        (re.fullmatch(r"ptcg-server/scans/(?:duo|packs)/.+\.png", value) is not None)
        or (value.startswith(("ptcg-server/avatars/", "ptcg-server/sleeves/")) and ext in IMAGE_EXT)
        or (value.startswith("ptcg-play-react/public/assets/") and ext in IMAGE_EXT | {".svg"})
        or (value.startswith("ptcg-play-react/public/fonts/") and (ext in {".ttf", ".otf", ".woff", ".woff2", ".txt", ".md"} or p.name.lower() in {"license", "ofl", "copyright"}))
        or value in {"ptcg-play-react/src/assets/cardback.png",
                     "ptcg-play-react/public/icons.svg",
                     "ptcg-play-react/public/tl-open-beta-sm.webp"}
        or (value.startswith("ptcg-play-react/src/assets/sfx/") and ext == ".mp3")
    )
    if not allowed or any(c.lower() in {".git", "node_modules", ".env"} for c in p.parts):
        fail("target-not-allowed")
    return value


def safe_path(path: Path, directory: bool = False) -> None:
    """Reject links in every existing component (including root ancestors)."""
    path = Path(os.path.abspath(path))
    for node in (*reversed(path.parents), path):
        try:
            info = node.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(info.st_mode):
            fail("symlink-path")
        is_dir = node != path or directory
        if is_dir and not stat.S_ISDIR(info.st_mode):
            fail("not-a-directory")
        if not is_dir and not stat.S_ISREG(info.st_mode):
            fail("not-a-regular-file")


def mkdir(path: Path) -> None:
    safe_path(path, directory=True)
    path.mkdir(parents=True, exist_ok=True)
    safe_path(path, directory=True)


def open_read(path: Path):
    safe_path(path)
    fd = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    return os.fdopen(fd, "rb")


def read_manifest(path: Path, root: Path) -> tuple[dict, list[dict]]:
    try:
        with open_read(path) as stream:
            data = json.load(stream, object_pairs_hook=unique_object)
    except (ValueError, UnicodeError):
        fail("invalid-manifest-json")
    fields(data, {"schema", "sources", "files"})
    if type(data["schema"]) is not int or data["schema"] != 2:
        fail("unsupported-schema")
    sources = data["sources"]
    if not isinstance(sources, dict) or not isinstance(data["files"], list):
        fail("invalid-manifest")
    for digest, source in sources.items():
        if not isinstance(digest, str) or not SHA.fullmatch(digest):
            fail("invalid-source-sha")
        fields(source, {"url", "bytes"}, {"page"})
        validate_url(source["url"])
        if not integer(source["bytes"], 0, MAX_SOURCE):
            fail("invalid-source-size")
        if "page" in source:
            validate_url(source["page"], "page")
            if urlsplit(source["url"]).hostname != "image.pokemon.com.cn":
                fail("page-on-nonofficial-source")
    files = {}
    for item in data["files"]:
        fields(item, {"path", "source", "group"}, {"transform", "pixels"})
        name = target_path(item["path"])
        if not isinstance(item["source"], str) or item["source"] not in sources:
            fail("missing-source")
        if not isinstance(item["group"], str) or item["group"] not in GROUPS:
            fail("invalid-group")
        if "transform" in item:
            t = item["transform"]
            fields(t, {"mode"}, {"crop", "resize"})
            if t["mode"] not in ("RGB", "RGBA"):
                fail("invalid-transform-mode")
            if not name.endswith(".png") or "pixels" not in item:
                fail("transform-requires-png-and-pixels")
            if "crop" in t:
                c = t["crop"]
                if not isinstance(c, list) or len(c) != 4 or not all(integer(n, 0) for n in c) or c[0] >= c[2] or c[1] >= c[3]:
                    fail("invalid-crop")
            if "resize" in t:
                r = t["resize"]
                if not isinstance(r, list) or len(r) != 2 or not all(integer(n) for n in r):
                    fail("invalid-resize")
        if "pixels" in item:
            p = item["pixels"]
            fields(p, {"width", "height", "sha256"})
            if not integer(p["width"]) or not integer(p["height"]) or not isinstance(p["sha256"], str) or not SHA.fullmatch(p["sha256"]):
                fail("invalid-pixels")
        if name in files and files[name] != item:
            fail("duplicate-target-conflict")
        files[name] = item
        safe_path(root / name)
    # A file cannot also be another target's parent.
    names = set(files)
    if any(str(parent) in names for name in names for parent in PurePosixPath(name).parents):
        fail("target-parent-conflict")
    return sources, list(files.values())


def unique_object(pairs: list) -> dict:
    obj = {}
    for key, value in pairs:
        if key in obj:
            fail("duplicate-json-key")
        obj[key] = value
    return obj


def redirect_policy(original: str, kind: str, signed: bool = False):
    origin = urlsplit(original)

    def validate(url: str) -> None:
        validate_url(url, kind, signed)
        dest = urlsplit(url)
        if dest.netloc != origin.netloc:
            fail("redirect-origin-not-allowed")
        if origin.hostname == "raw.githubusercontent.com" and dest.path.split("/")[:4] != origin.path.split("/")[:4]:
            fail("redirect-namespace-not-allowed")
    return validate


class SafeRedirect(HTTPRedirectHandler):
    def __init__(self, validate):
        self.validate = validate

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.validate(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def network_open(url: str, kind: str = "source", signed: bool = False):
    validate = redirect_policy(url, kind, signed)
    validate(url)
    opener = build_opener(SafeRedirect(validate))
    try:
        response = opener.open(Request(url, headers={"User-Agent": "public-assets-downloader/2"}), timeout=15)
    except (OSError, HTTPException):
        fail("source-request-failed")
    try:
        validate(response.geturl())
    except BaseException:
        response.close()
        raise
    return response


def network_read(response, size: int) -> bytes:
    try:
        return response.read(size)
    except (OSError, HTTPException):
        fail("source-request-failed")


def temporary(parent: Path) -> tuple[int, Path]:
    mkdir(parent)
    fd, name = tempfile.mkstemp(prefix=f".asset-tmp-{os.getpid()}-", suffix=".tmp", dir=parent)
    return fd, Path(name)


def cleanup_stale(parent: Path) -> None:
    safe_path(parent, directory=True)
    if not parent.exists():
        return
    for path in parent.iterdir():
        match = TEMP.fullmatch(path.name)
        if not match:
            continue
        safe_path(path)
        try:
            os.kill(int(match[1]), 0)
        except ProcessLookupError:
            path.unlink()
        except PermissionError:
            pass


def atomic_install(temp: Path, target: Path) -> None:
    safe_path(target)
    # The link is between a copy/transform temporary and its sibling target,
    # never between the content cache and the target's filesystem.
    os.link(temp, target, follow_symlinks=False)


def sha_file(path: Path, size: int, digest: str) -> bool:
    h = hashlib.sha256()
    with open_read(path) as stream:
        if os.fstat(stream.fileno()).st_size != size:
            return False
        while block := stream.read(128 * 1024):
            h.update(block)
    return h.hexdigest() == digest


def pixels_match(path: Path, expected: dict) -> bool:
    from PIL import Image
    with open_read(path) as stream, Image.open(stream) as image:
        if image.size != (expected["width"], expected["height"]):
            return False
        return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest() == expected["sha256"]


class Downloader:
    def __init__(self, root: Path, cache: Path, sources: dict, files: list[dict], workers: int, check: bool):
        self.root, self.cache, self.sources, self.files = root, cache, sources, files
        self.workers, self.check = workers, check
        self.locks = {key: threading.Lock() for key in sources}
        self.source_errors = {}
        self.downloaded = 0
        self.count_lock = threading.Lock()

    def valid_target(self, path: Path, item: dict) -> bool:
        safe_path(path)
        if not path.exists():
            return False
        if "transform" not in item:
            source = self.sources[item["source"]]
            if not sha_file(path, source["bytes"], item["source"]):
                return False
        return "pixels" not in item or pixels_match(path, item["pixels"])

    def signed_url(self, source: dict) -> str:
        if "page" not in source:
            return source["url"]
        with network_open(source["page"], "page") as response:
            page = network_read(response, MAX_PAGE + 1)
        if len(page) > MAX_PAGE:
            fail("official-page-too-large")
        text = html.unescape(page.decode("utf-8", errors="replace"))
        target = urlsplit(source["url"])
        for candidate in re.findall(r'https://image\.pokemon\.com\.cn/[^\s<>\x22\x27]+', text):
            try:
                validate_url(candidate, signed=True)
            except AssetError:
                continue
            parsed = urlsplit(candidate)
            if parsed.path == target.path and parsed.query:
                return candidate
        fail("official-image-not-found")

    def source_file(self, digest: str) -> Path:
        source = self.sources[digest]
        path = self.cache / digest
        with self.locks[digest]:
            if digest in self.source_errors:
                fail(self.source_errors[digest])
            safe_path(path)
            if path.exists():
                if not sha_file(path, source["bytes"], digest):
                    fail("cache-content-conflict")
                return path
            for attempt in range(3):
                temp = None
                try:
                    url = self.signed_url(source)
                    fd, temp = temporary(self.cache)
                    h, length = hashlib.sha256(), 0
                    with os.fdopen(fd, "wb") as out, network_open(url, signed="page" in source) as response:
                        while block := network_read(response, 128 * 1024):
                            length += len(block)
                            if length > source["bytes"]:
                                fail("source-size-mismatch")
                            h.update(block)
                            out.write(block)
                        out.flush()
                        os.fsync(out.fileno())
                    if length != source["bytes"]:
                        fail("source-size-mismatch")
                    if h.hexdigest() != digest:
                        fail("source-sha-mismatch")
                    try:
                        atomic_install(temp, path)
                    except FileExistsError:
                        if not sha_file(path, source["bytes"], digest):
                            fail("cache-content-conflict")
                    with self.count_lock:
                        self.downloaded += 1
                    return path
                except (AssetError, HTTPError, URLError, TimeoutError, ConnectionError, HTTPException) as error:
                    code = str(error) if isinstance(error, AssetError) else "source-request-failed"
                    if attempt == 2 or code not in {"source-request-failed", "source-size-mismatch", "source-sha-mismatch"}:
                        self.source_errors[digest] = code
                        fail(code)
                    time.sleep(0.2 * (attempt + 1))
                finally:
                    if temp is not None:
                        temp.unlink(missing_ok=True)
        fail("source-request-failed")

    def process(self, item: dict) -> str:
        path = self.root / item["path"]
        if path.exists():
            if self.valid_target(path, item):
                return "reused"
            fail("target-content-conflict")
        if self.check:
            fail("missing-target")
        source = self.source_file(item["source"])
        fd, temp = temporary(path.parent)
        try:
            with os.fdopen(fd, "wb") as out:
                if "transform" in item:
                    from PIL import Image
                    t = item["transform"]
                    with open_read(source) as stream, Image.open(stream) as original:
                        image = original.convert(t["mode"])
                        if "crop" in t:
                            if t["crop"][2] > image.width or t["crop"][3] > image.height:
                                fail("crop-outside-image")
                            image = image.crop(t["crop"])
                        if "resize" in t:
                            image.thumbnail(t["resize"], Image.Resampling.LANCZOS)
                        image.save(out, format="PNG")
                else:
                    with open_read(source) as stream:
                        while block := stream.read(128 * 1024):
                            out.write(block)
                out.flush()
                os.fsync(out.fileno())
            if not self.valid_target(temp, item):
                fail("target-verification-failed")
            try:
                atomic_install(temp, path)
            except FileExistsError:
                if not self.valid_target(path, item):
                    fail("target-content-conflict")
                return "reused"
            return "created"
        finally:
            temp.unlink(missing_ok=True)

    def run(self) -> dict:
        counts = {"total": len(self.files), "complete": 0, "reused": 0, "created": 0, "failed": 0, "sourcesDownloaded": 0}
        failures = {}
        if not self.check:
            parents = {self.cache} | {(self.root / item["path"]).parent for item in self.files}
            for parent in parents:
                cleanup_stale(parent)
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            pending = {pool.submit(self.process, item): item["path"] for item in self.files}
            for index, future in enumerate(as_completed(pending), 1):
                try:
                    result = future.result()
                    counts[result] += 1
                    counts["complete"] += 1
                except Exception as error:
                    failures[pending[future]] = str(error) if isinstance(error, AssetError) else "asset-processing-failed"
                    counts["failed"] += 1
                if index % 50 == 0:
                    print(f"Assets: {index}/{counts['total']}, failed={counts['failed']}", flush=True)
        counts["sourcesDownloaded"] = self.downloaded
        return {"complete": not failures, "counts": counts, "failedPaths": sorted(failures), "failures": dict(sorted(failures.items()))}


def report_path(root: Path, cache: Path, report: Path, manifest: Path) -> None:
    safe_path(root, directory=True)
    safe_path(cache, directory=True)
    safe_path(manifest)
    safe_path(report)
    if cache == root or cache == manifest or cache in manifest.parents or report.parent != cache.parent or report.suffix.lower() != ".json" or report == manifest:
        fail("unsafe-cache-or-report-path")


def write_report(path: Path, result: dict) -> None:
    fd, temp = temporary(path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(result, stream, ensure_ascii=True, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        safe_path(path)
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def parse_args(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).absolute().parent.parent)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--groups", default="cards,ui,sfx")
    parser.add_argument("--workers", type=int, default=8, choices=range(1, 17), metavar="1..16")
    parser.add_argument("--check", action="store_true", help="Verify existing targets without network access")
    parser.add_argument("--path", action="append", default=[], help="Exact manifest target (repeatable)")
    parser.add_argument("--cache-dir", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args(argv)
    args.groups = args.groups.split(",")
    if not args.groups or any(group not in GROUPS for group in args.groups):
        parser.error("--groups must be a comma-separated subset of cards,ui,sfx")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = Path(os.path.abspath(args.root))
    manifest = Path(os.path.abspath(args.manifest or root / "public-data/assets.json"))
    cache = Path(os.path.abspath(args.cache_dir or root / ".cache/assets"))
    report = Path(os.path.abspath(args.report or root / ".cache/assets-report.json"))
    report_safe = False
    try:
        report_path(root, cache, report, manifest)
        sources, files = read_manifest(manifest, root)
        # Validate every entry before filtering or performing any network/write.
        targets = {root / item["path"] for item in files}
        if any(report == path or report in path.parents for path in targets):
            fail("report-target-conflict")
        if any(cache == path or path in cache.parents for path in targets):
            fail("cache-target-conflict")
        for digest in sources:
            safe_path(cache / digest)
        report_safe = True
        wanted = set(args.path)
        for name in wanted:
            target_path(name)
        selected = [item for item in files if item["group"] in args.groups and (not wanted or item["path"] in wanted)]
        if wanted - {item["path"] for item in selected}:
            fail("requested-path-not-selected")
        result = Downloader(root, cache, sources, selected, args.workers, args.check).run()
        write_report(report, result)
        c = result["counts"]
        print(f"Assets: complete={str(result['complete']).lower()} verified={c['complete']}/{c['total']} failed={c['failed']}")
        return 0 if result["complete"] else 1
    except (AssetError, OSError, ValueError) as error:
        code = str(error) if isinstance(error, AssetError) else "local-io-or-format-error"
        print(f"Assets: {code}", file=sys.stderr)
        if report_safe:
            try:
                write_report(report, {"complete": False, "counts": {}, "failedPaths": [], "error": code})
            except (AssetError, OSError):
                pass
        return 2
    except KeyboardInterrupt:
        print("Assets: interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
