"""Offline tests; all responses are synthetic and all writes use temporary roots."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import URLError
from urllib.request import Request

from PIL import Image

SPEC = importlib.util.spec_from_file_location("download_assets", Path(__file__).with_name("download-assets.py"))
d = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(d)

RAW = "https://raw.githubusercontent.com/ploober/twinleafgg/" + "a" * 40 + "/asset.png"
OFFICIAL = "https://image.pokemon.com.cn/wp-content/uploads/2025/coin.png"
PAGE = "https://www.pokemon.cn/tcg/product/123.html"
CARD = "ptcg-server/scans/duo/fixture.png"
OTHER = "ptcg-server/scans/packs/fixture.png"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def png(color="red", size=(8, 6)):
    buffer = io.BytesIO()
    Image.new("RGBA", size, color).save(buffer, format="PNG")
    return buffer.getvalue()


class Response(io.BytesIO):
    def __init__(self, data, url):
        super().__init__(data)
        self.url = url

    def geturl(self):
        return self.url


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        # macOS /var is itself a symlink; fixture roots use the canonical path.
        self.root = self.root.resolve()
        self.manifest = self.root / "public-data/assets.json"
        self.manifest.parent.mkdir()
        self.payload = png()
        self.data = self.manifest_data()
        self.calls = []
        self.network = patch.object(d, "network_open", side_effect=self.fake_open)
        self.network.start()
        self.addCleanup(self.network.stop)
        self.sleep = patch.object(d.time, "sleep")
        self.sleep.start()
        self.addCleanup(self.sleep.stop)
        self.output = io.StringIO()

    def manifest_data(self, payload=None, paths=(CARD,)):
        payload = self.payload if payload is None else payload
        return {"schema": 2, "sources": {sha(payload): {"url": RAW, "bytes": len(payload)}}, "files": [{"path": path, "source": sha(payload), "group": "cards"} for path in paths]}

    def fake_open(self, url, kind="source", signed=False):
        self.calls.append((url, kind, signed))
        return Response(self.payload, url)

    def run_cli(self, *args):
        self.manifest.write_text(json.dumps(self.data))
        with contextlib.redirect_stdout(self.output), contextlib.redirect_stderr(self.output):
            return d.main(["--root", str(self.root), *args])

    def report(self):
        return json.loads((self.root / ".cache/assets-report.json").read_text())

    def assert_no_temporary(self):
        self.assertEqual(list(self.root.rglob(".asset-tmp-*.tmp")), [])

    def test_reviewed_public_root_assets_are_allowed(self):
        for name in ('ptcg-play-react/public/icons.svg', 'ptcg-play-react/public/tl-open-beta-sm.webp'):
            self.assertEqual(d.target_path(name), name)
        with self.assertRaises(d.AssetError):
            d.target_path('ptcg-play-react/public/other.svg')

    def test_raw_hash_idempotency_and_cache_reuse(self):
        self.assertEqual(self.run_cli(), 0)
        self.assertEqual((self.root / CARD).read_bytes(), self.payload)
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.run_cli(), 0)
        self.assertEqual(self.report()["counts"]["reused"], 1)
        self.assertEqual(len(self.calls), 1)
        (self.root / CARD).unlink()
        self.assertEqual(self.run_cli(), 0)
        self.assertEqual(len(self.calls), 1)
        self.assert_no_temporary()

    def test_same_source_two_targets_downloaded_once(self):
        self.data = self.manifest_data(paths=(CARD, OTHER))
        self.assertEqual(self.run_cli("--workers", "8"), 0)
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.report()["counts"]["created"], 2)
        self.assertEqual((self.root / OTHER).read_bytes(), self.payload)

    def test_sha_and_size_failures_never_install(self):
        for payload in (b"x" * len(self.payload), self.payload + b"x", self.payload[:-1]):
            with self.subTest(length=len(payload)):
                self.calls.clear()
                with patch.object(d, "network_open", side_effect=lambda url, **kw: Response(payload, url)):
                    self.assertEqual(self.run_cli(), 1)
                self.assertFalse((self.root / CARD).exists())
                self.assertFalse((self.root / ".cache/assets" / sha(self.payload)).exists())
                self.assertEqual(self.report()["failedPaths"], [CARD])
                self.assert_no_temporary()

    def test_crop_thumbnail_pixel_verification_and_png_recompression(self):
        # Solid red yields an independent known pixel expectation after crop/resize.
        item = self.data["files"][0]
        item["transform"] = {"mode": "RGB", "crop": [1, 1, 7, 5], "resize": [3, 3]}
        expected = bytes([255, 0, 0, 255]) * 6
        item["pixels"] = {"width": 3, "height": 2, "sha256": sha(expected)}
        self.assertEqual(self.run_cli(), 0)
        path = self.root / CARD
        with Image.open(path) as image:
            self.assertEqual(image.size, (3, 2))
            copy = image.copy()
        copy.save(path, format="PNG", compress_level=0)
        self.assertEqual(self.run_cli("--check"), 0)
        self.assertEqual(len(self.calls), 1)

    def test_wrong_pixel_digest_no_install(self):
        item = self.data["files"][0]
        item["transform"] = {"mode": "RGBA"}
        item["pixels"] = {"width": 8, "height": 6, "sha256": "0" * 64}
        self.assertEqual(self.run_cli(), 1)
        self.assertFalse((self.root / CARD).exists())
        self.assert_no_temporary()

    def test_official_page_fresh_signed_url_not_written_to_report(self):
        self.data["sources"][sha(self.payload)] = {"url": OFFICIAL, "bytes": len(self.payload), "page": PAGE}
        signed = OFFICIAL + "?sign=SECRET_SIGNATURE&expires=100"
        page = ('<img src="' + signed.replace("&", "&amp;") + '">').encode()

        def serve(url, kind="source", signed=False):
            self.calls.append((url, kind, signed))
            return Response(page if kind == "page" else self.payload, url)

        with patch.object(d, "network_open", side_effect=serve):
            self.assertEqual(self.run_cli(), 0)
        self.assertEqual(self.calls, [(PAGE, "page", False), (signed, "source", True)])
        self.assertNotIn("SECRET_SIGNATURE", (self.root / ".cache/assets-report.json").read_text())
        self.assertNotIn("SECRET_SIGNATURE", self.output.getvalue())
        self.assertEqual((self.root / CARD).read_bytes(), self.payload)

    def test_official_html_response_not_saved_as_png(self):
        self.data["sources"][sha(self.payload)]["url"] = OFFICIAL
        with patch.object(d, "network_open", side_effect=lambda *args, **kwargs: Response(b"<html>not image</html>", OFFICIAL)):
            self.assertEqual(self.run_cli(), 1)
        self.assertFalse((self.root / CARD).exists())

    def test_preflight_rejects_bad_paths_before_any_download_even_filtered(self):
        for path in ("../escape.png", "/tmp/escape.png", "ptcg-server/scans/duo/../../db.png", "ptcg-server/scans/duo/\\x.png", "ptcg-server/scans/duo/a\n.png", "ptcg-server/scans/duo/a\x85.png", "ptcg-server/scans/duo/a.png:stream.png", "ptcg-server/scans/duo/.git/x.png", "ptcg-server/scans/duo/./x.png", "ptcg-server/scans/duo//x.png", "ptcg-play-react/src/main.ts"):
            with self.subTest(path=path):
                self.data = self.manifest_data()
                self.data["files"].append({"path": path, "source": sha(self.payload), "group": "ui"})
                self.assertEqual(self.run_cli("--groups", "cards"), 2)
                self.assertEqual(self.calls, [])
                self.assertFalse((self.root / CARD).exists())

    def test_symlink_target_parent_cache_manifest_and_report_rejected(self):
        outside = self.root / "outside"
        outside.mkdir()
        parent = self.root / "ptcg-server"
        parent.symlink_to(outside, target_is_directory=True)
        self.assertEqual(self.run_cli(), 2)
        parent.unlink()
        path = self.root / CARD
        path.parent.mkdir(parents=True)
        original = outside / "original"
        original.write_bytes(b"preserve")
        path.symlink_to(original)
        self.assertEqual(self.run_cli(), 2)
        path.unlink()
        cache_parent = self.root / ".cache"
        cache_parent.mkdir()
        cache = cache_parent / "assets"
        cache.symlink_to(outside, target_is_directory=True)
        self.assertEqual(self.run_cli(), 2)
        cache.unlink()
        report = cache_parent / "assets-report.json"
        report.symlink_to(original)
        self.assertEqual(self.run_cli(), 2)
        report.unlink()
        self.manifest.unlink()
        self.manifest.symlink_to(original)
        with contextlib.redirect_stderr(self.output):
            self.assertEqual(d.main(["--root", str(self.root)]), 2)
        self.assertEqual(self.calls, [])
        self.assertEqual(original.read_bytes(), b"preserve")

    def test_disallowed_urls_and_page_rejected(self):
        urls = ["http://raw.githubusercontent.com/ploober/twinleafgg/" + "a" * 40 + "/x", RAW + "?token=x", RAW + "#x", RAW + "?", RAW + "#", RAW.replace("https://", "https://" + "user:pass@"), RAW.replace("raw.githubusercontent.com", "raw.githubusercontent.com.evil.test"), RAW.replace("/" + "a" * 40 + "/", "/main/"), RAW.replace("/asset.png", "/../asset.png"), "https://evil.test/x.png", OFFICIAL.replace(".png", ".jpg"), "https://pokewalls.wordpress.com/elsewhere/x.jpg"]
        for url in urls:
            with self.subTest(url=url):
                self.data = self.manifest_data()
                self.data["sources"][sha(self.payload)]["url"] = url
                self.assertEqual(self.run_cli(), 2)
        self.data = self.manifest_data()
        self.data["sources"][sha(self.payload)] = {"url": OFFICIAL, "bytes": len(self.payload), "page": "https://www.pokemon.cn/tcg/product/../secret.html"}
        self.assertEqual(self.run_cli(), 2)
        self.assertEqual(self.calls, [])

    def test_redirect_validation_each_hop(self):
        validate = d.redirect_policy(RAW, "source")
        handler = d.SafeRedirect(validate)
        request = Request(RAW)
        good = RAW.replace("asset.png", "other.png")
        self.assertEqual(handler.redirect_request(request, None, 302, "Found", {}, good).full_url, good)
        for bad in ("https://evil.test/x", OFFICIAL, RAW.replace("/ploober/twinleafgg/", "/1niceroli/ptcg-assets/"), RAW.replace("a" * 40, "b" * 40)):
            with self.subTest(url=bad), self.assertRaises(d.AssetError):
                handler.redirect_request(request, None, 302, "Found", {}, bad)
        page = d.redirect_policy(PAGE, "page")
        page(PAGE.replace("123", "456"))
        with self.assertRaises(d.AssetError):
            page(OFFICIAL)

    def test_existing_different_target_preserved(self):
        path = self.root / CARD
        path.parent.mkdir(parents=True)
        path.write_bytes(b"existing-user-content")
        self.assertEqual(self.run_cli(), 1)
        self.assertEqual(path.read_bytes(), b"existing-user-content")
        self.assertEqual(self.calls, [])
        self.assertEqual(self.report()["failures"][CARD], "target-content-conflict")

    def test_check_missing_nonzero_and_no_network(self):
        self.assertEqual(self.run_cli("--check"), 1)
        self.assertEqual(self.calls, [])
        self.assertFalse((self.root / ".cache/assets").exists())
        self.assertEqual(self.report()["failedPaths"], [CARD])

    def test_path_filter_and_unknown_path(self):
        self.data = self.manifest_data(paths=(CARD, OTHER))
        self.assertEqual(self.run_cli("--path", OTHER), 0)
        self.assertFalse((self.root / CARD).exists())
        self.assertTrue((self.root / OTHER).exists())
        self.assertEqual(self.run_cli("--path", "ptcg-server/scans/duo/missing.png"), 2)

    def test_invalid_schema_fields_source_transform_duplicate_paths(self):
        mutations = [
            lambda m: m.update(schema=3),
            lambda m: m.update(extra=True),
            lambda m: m["files"][0].update(source="0" * 64),
            lambda m: m["files"][0].update(group="other"),
            lambda m: m["sources"][sha(self.payload)].update(bytes=d.MAX_SOURCE + 1),
            lambda m: m["sources"][sha(self.payload)].update(bytes=True),
            lambda m: m["files"][0].update(transform={"mode": "CMYK"}),
            lambda m: m["files"].append(dict(m["files"][0], group="ui")),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.data = self.manifest_data()
                mutate(self.data)
                self.assertEqual(self.run_cli(), 2)
        self.assertEqual(self.calls, [])

    def test_report_cannot_replace_manifest_or_target(self):
        self.assertEqual(self.run_cli("--report", str(self.manifest)), 2)
        self.assertEqual(self.run_cli("--report", str(self.root / CARD)), 2)
        self.assertEqual(self.calls, [])

    def test_retry_bounded_and_exception_credentials_redacted(self):
        # Intentionally invalid, synthetic URL credentials; no live values.
        synthetic_url = "https://" + "user:password@proxy.test/?sign=SECRET"
        with patch.object(d, "network_open", side_effect=URLError(synthetic_url)) as network:
            self.assertEqual(self.run_cli(), 1)
            self.assertEqual(network.call_count, 3)
        text = (self.root / ".cache/assets-report.json").read_text() + self.output.getvalue()
        self.assertNotIn("password", text)
        self.assertNotIn("SECRET", text)
        self.assert_no_temporary()

    def test_interrupted_read_cleans_temporary(self):
        class Interrupted(Response):
            def read(self, size=-1):
                raise KeyboardInterrupt()
        sources = self.data["sources"]
        downloader = d.Downloader(self.root, self.root / ".cache/assets", sources, self.data["files"], 1, False)
        with patch.object(d, "network_open", return_value=Interrupted(b"", RAW)), self.assertRaises(KeyboardInterrupt):
            downloader.process(self.data["files"][0])
        self.assertFalse((self.root / CARD).exists())
        self.assert_no_temporary()

    def test_atomic_install_does_not_overwrite_and_cross_device_cache_not_linked(self):
        real_link = os.link
        links = []
        def sibling_link(source, target, **kwargs):
            self.assertEqual(Path(source).parent, Path(target).parent)
            links.append((source, target))
            return real_link(source, target, **kwargs)
        with patch.object(d.os, "link", side_effect=sibling_link):
            self.assertEqual(self.run_cli(), 0)
        self.assertEqual(len(links), 2)
        a, b = self.root / "a", self.root / "b"
        a.write_bytes(b"new")
        b.write_bytes(b"old")
        with self.assertRaises(FileExistsError):
            d.atomic_install(a, b)
        self.assertEqual(b.read_bytes(), b"old")

    def test_cache_and_report_parent_conflicts_preflight(self):
        for cache in (self.root / CARD, self.root / CARD / "cache"):
            with self.subTest(cache=cache):
                self.assertEqual(self.run_cli("--cache-dir", str(cache), "--report", str(cache.parent / "report.json")), 2)
        self.data = self.manifest_data(paths=("ptcg-play-react/public/assets/report.json/coin.png",))
        parent = self.root / "ptcg-play-react/public/assets"
        self.assertEqual(self.run_cli("--cache-dir", str(parent / "cache"), "--report", str(parent / "report.json")), 2)
        self.assertEqual(self.calls, [])
        self.assertFalse((self.root / CARD).exists())

    def test_duplicate_identical_entry_is_idempotent(self):
        self.data["files"].append(dict(self.data["files"][0]))
        self.assertEqual(self.run_cli(), 0)
        self.assertEqual(self.report()["counts"]["total"], 1)
        self.assertEqual(len(self.calls), 1)

    def test_zero_byte_raw_asset(self):
        self.payload = b""
        self.data = self.manifest_data()
        self.assertEqual(self.run_cli(), 0)
        self.assertEqual((self.root / CARD).read_bytes(), b"")

    def test_local_write_failure_is_not_retried(self):
        with patch.object(d, "temporary", side_effect=PermissionError("private detail")):
            self.assertEqual(self.run_cli(), 2)
        self.assertEqual(len(self.calls), 0)
        self.assertNotIn("private detail", self.output.getvalue())

    def test_incomplete_network_read_is_retried_and_cleaned(self):
        from http.client import IncompleteRead
        class Broken(Response):
            def read(self, size=-1):
                raise IncompleteRead(b"partial", 10)
        with patch.object(d, "network_open", side_effect=lambda *args, **kwargs: Broken(b"", RAW)) as network:
            self.assertEqual(self.run_cli(), 1)
        self.assertEqual(network.call_count, 3)
        self.assertFalse((self.root / CARD).exists())
        self.assert_no_temporary()

    def test_stale_temporaries_cleanup_skips_active_and_other_files(self):
        parent = self.root / "temporary-fixture"
        parent.mkdir()
        stale = parent / ".asset-tmp-999999-old.tmp"
        active = parent / f".asset-tmp-{os.getpid()}-active.tmp"
        other = parent / "unrelated.tmp"
        for path in (stale, active, other):
            path.write_bytes(b"fixture")
        def probe(pid, signal):
            self.assertEqual(signal, 0)
            if pid == 999999:
                raise ProcessLookupError()
        with patch.object(d.os, "kill", side_effect=probe):
            d.cleanup_stale(parent)
        self.assertFalse(stale.exists())
        self.assertTrue(active.exists())
        self.assertTrue(other.exists())

    def test_corrupt_cache_preserved_and_no_download(self):
        cache = self.root / ".cache/assets"
        cache.mkdir(parents=True)
        source = cache / sha(self.payload)
        source.write_bytes(b"bad")
        self.assertEqual(self.run_cli(), 1)
        self.assertEqual(source.read_bytes(), b"bad")
        self.assertEqual(self.calls, [])


if __name__ == "__main__":
    unittest.main()
