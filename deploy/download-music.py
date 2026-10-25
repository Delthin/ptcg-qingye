#!/usr/bin/env python3
"""Prepare optional local BGM from public-data/music.json (Python 3.10+, ffmpeg).

Public access is NOT permission to redistribute. Respect each source's terms and
copyright; this only prepares optional personal/local assets. No music is shipped
by this repository. --list and --check work offline without ffmpeg or consent.
Unknown existing files are conflicts, never overwritten (no --force).
"""
from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ASSETS = Path('ptcg-play-react/src/assets/bgm')
STATE = Path('.cache/music-state.json')
MIN_MP3 = 32 * 1024
MAX_SOURCE = 256 * 1024 * 1024
NOTICE = ('公开可访问不等于再分发许可；请遵守来源条款及版权要求。'
          '脚本仅准备本机可选个人素材，仓库不分发音乐。'
          '下载须显式传入 --accept-source-terms。')
# Only the public source pages used by the 39-track manifest, not arbitrary URLs.
ARCHIVE_ITEMS = frozenset('''mezase-pokemon-master-20th-anniversary
pokemon-theme-song-collection pkmn-oras-ost
pok-mon-brilliant-diamond-shining-pearl-2021-ost
pokemon-legends-arceus-original-soundtrack pkmn-sun-moon-ost
pokemon-sword-and-shield-original-soundtrack
pokemon-scarlet-and-violet-original-soundtrack'''.split())
BVIDS = frozenset('''BV1wfyyY7E2x BV1h14y1t7bZ BV1va411z7HY BV1jt4y1G7sG
BV1CG4y1e7mY BV11r4y1W7rG BV13P4y1w7Xr BV1f44y1n7T2 BV1oT4y1y7hQ
BV1t94y1Z7FY BV17U421o7L8 BV1Pr4y1G7Jk BV1Wc411m73A BV1fa411p7qt'''.split())
HEADERS = {'User-Agent': 'ptcg-optional-music/1.0',
           'Referer': 'https://www.bilibili.com/'}


class MusicError(Exception):
    """Only static, safe messages: never wrap raw transport/subprocess errors."""


class TransientError(MusicError):
    """Only temporary transport/content failures are eligible for retry."""


def clean(value: str) -> bool:
    return isinstance(value, str) and not any(ord(c) < 32 or 127 <= ord(c) <= 159
                                             for c in value) and '\\' not in value


def safe_path(path: Path) -> Path:
    """Reject symlinks in every existing component, including ancestors of root."""
    if not clean(str(path)) or '..' in path.parts:
        raise MusicError('路径不安全（软链、父目录或非法字符）。')
    path = Path(os.path.abspath(path))
    for part in reversed((path, *path.parents)):
        if part.is_symlink():
            raise MusicError('路径不安全（软链、父目录或非法字符）。')
    return path


def trim_args(label: str) -> list[str]:
    if not label:
        return []
    match = re.fullmatch(r'\[(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?|end)\]', label)
    if not match:
        raise MusicError('manifest 裁剪区间无效。')
    start = float(match[1])
    end = None if match[2] == 'end' else float(match[2])
    if not math.isfinite(start) or (end is not None and
            (not math.isfinite(end) or end <= start)):
        raise MusicError('manifest 裁剪区间无效。')
    return ['-ss', str(start)] + ([] if end is None else ['-t', str(end - start)])


def source_info(track: dict) -> tuple[str, str, int]:
    source, name = track['source'], track['sourceFile']
    archive = re.fullmatch(r'https://archive\.org/details/([a-zA-Z0-9_-]+)', source)
    if archive and archive[1] in ARCHIVE_ITEMS:
        if (not name or name.startswith('/') or '%' in name or
                any(p in ('', '.', '..') for p in name.split('/')) or
                not name.lower().endswith('.mp3') or ':' in name or '?' in name or '#' in name):
            raise MusicError('manifest 归档文件名无效。')
        return 'archive', archive[1], 0
    bili = re.fullmatch(r'https://www\.bilibili\.com/video/(BV[a-zA-Z0-9]{10})', source)
    page = re.fullmatch(r'bilibili (BV[a-zA-Z0-9]{10}) p([1-9][0-9]{0,2})', name)
    if bili and bili[1] in BVIDS and page and page[1] == bili[1]:
        return 'bili', bili[1], int(page[2])
    raise MusicError('manifest 来源不是预定的公开来源页面。')


def load_manifest(path: Path) -> list[dict]:
    with safe_path(path).open(encoding='utf-8') as stream:
        data = json.load(stream)
    if (not isinstance(data, dict) or data.get('schema') != 1 or
            not isinstance(data.get('tracks'), list) or not 1 <= len(data['tracks']) <= 39):
        raise MusicError('manifest 必须是 schema=1 的曲目清单（最多 39 首）。')
    seen = set()
    for track in data['tracks']:
        if not isinstance(track, dict) or not all(clean(track.get(k)) for k in
                ('file', 'title', 'game', 'source', 'sourceFile', 'trim', 'credit')):
            raise MusicError('manifest 缺少字段或含非法字符。')
        if (not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*/[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.mp3',
                             track['file']) or track['file'] in seen):
            raise MusicError('manifest 目标路径无效或重复。')
        seen.add(track['file'])
        source_info(track)
        trim_args(track['trim'])
    return data['tracks']


def fingerprint(track: dict) -> str:
    stable = {k: track[k] for k in ('source', 'sourceFile', 'trim')}
    return hashlib.sha256(json.dumps(stable, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def valid_mp3(path: Path) -> bool:
    safe_path(path)
    if not path.is_file() or path.stat().st_size < MIN_MP3:
        return False
    with path.open('rb') as stream:
        head = stream.read(3)
    return head == b'ID3' or (len(head) >= 2 and head[0] == 255 and head[1] & 0xE0 == 0xE0)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with safe_path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(256 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def allowed_url(url: str, kind: str) -> None:
    if not clean(url):
        raise MusicError('来源返回了不安全地址；请从公开来源页面手动准备音频。')
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname or ''
    suffixes = {'archive': ('archive.org',), 'api': ('api.bilibili.com',),
                'cdn': ('bilivideo.com', 'bilivideo.cn', 'akamaized.net')}[kind]
    allowed = any(host == s or (kind != 'api' and host.endswith('.' + s)) for s in suffixes)
    if (parsed.scheme != 'https' or not allowed or parsed.username or parsed.password or
            parsed.port not in (None, 443) or parsed.fragment):
        raise MusicError('来源返回了不支持的地址；请从公开来源页面手动准备音频。')


class Redirects(urllib.request.HTTPRedirectHandler):
    def __init__(self, kind: str, deadline: float | None = None):
        self.kind = kind
        self.deadline = deadline

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        allowed_url(newurl, self.kind)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

    def http_error_302(self, req, fp, code, msg, headers):
        # urllib's default handler drains the entire redirect body, bypassing
        # transfer bounds. Close it instead, validate, and cap redirect count.
        fp.close()
        location = headers.get('location') or headers.get('uri')
        if not isinstance(location, str):
            raise MusicError('来源重定向无效。')
        url = urllib.parse.urljoin(req.full_url, location)
        request = self.redirect_request(req, fp, code, msg, headers, url)
        count = getattr(req, '_music_redirects', 0) + 1
        left = 30 if self.deadline is None else self.deadline - time.monotonic()
        if request is None or count > 5 or left <= 0:
            raise MusicError('来源重定向过多或网络总时限已到。')
        request._music_redirects = count
        return self.parent.open(request, timeout=min(30, left))

    http_error_301 = http_error_303 = http_error_307 = http_error_308 = http_error_302


class Network:
    """One per track: total transfer budget and wall-clock network deadline."""
    def __init__(self):
        self.deadline = time.monotonic() + 300
        self.remaining = MAX_SOURCE

    def transfer(self, url: str, kind: str, out, limit: int) -> None:
        allowed_url(url, kind)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), Redirects(kind, self.deadline))
        left = self.deadline - time.monotonic()
        if left <= 0:
            raise MusicError('网络总时限已到。')
        request = urllib.request.Request(url, headers=HEADERS)
        try:
            with opener.open(request, timeout=min(30, left)) as response:
                allowed_url(response.geturl(), kind)
                count = 0
                while True:
                    left = self.deadline - time.monotonic()
                    if left <= 0:
                        raise MusicError('网络总时限已到。')
                    # read1 may return the final bytes and set fp=None. In that
                    # case the next read1 returns EOF without any socket access.
                    if response.fp is not None:
                        response.fp.raw._sock.settimeout(min(30, left))
                    chunk = response.read1(64 * 1024)
                    if not chunk:
                        break
                    count += len(chunk)
                    self.remaining -= len(chunk)
                    if count > limit or self.remaining < 0:
                        raise MusicError('下载超出大小上限。')
                    out.write(chunk)
        except urllib.error.HTTPError as error:
            if error.code in (404, 408) or 500 <= error.code <= 599:
                raise TransientError('公开来源暂不可用。') from None
            raise MusicError('站点未公开提供文件；请从公开来源页面手动准备。') from None
        except (urllib.error.URLError, OSError, http.client.HTTPException):
            raise TransientError('公开来源请求失败或超时。') from None
        except (ValueError, UnicodeError):
            raise MusicError('公开来源地址或响应无效。') from None

    def json(self, url: str, kind: str) -> dict:
        import io
        out = io.BytesIO()
        self.transfer(url, kind, out, 4 * 1024 * 1024)
        try:
            data = json.loads(out.getvalue())
            if not isinstance(data, dict):
                raise ValueError
            return data
        except (ValueError, UnicodeError):
            raise MusicError('公开 API 未提供有效数据。') from None


def bili_url(net: Network, bvid: str, page: int) -> str:
    try:
        return _bili_url(net, bvid, page)
    except (ValueError, TypeError, KeyError, IndexError, AttributeError):
        raise MusicError('公开 API 未提供有效音轨；请手动准备。') from None


def _bili_url(net: Network, bvid: str, page: int) -> str:
    base = 'https://api.bilibili.com'
    view = net.json(f'{base}/x/web-interface/view?bvid={bvid}', 'api')
    pages = (view.get('data') or {}).get('pages') or []
    if view.get('code') != 0 or not 1 <= page <= len(pages):
        raise MusicError('公开 API 未提供视频分 P；请手动准备。')
    cid = pages[page - 1].get('cid')
    if type(cid) is not int or cid <= 0:
        raise MusicError('公开 API 未提供音轨；请手动准备。')
    play = net.json(f'{base}/x/player/playurl?bvid={bvid}&cid={cid}'
                    '&platform=html5&high_quality=1&fnval=1', 'api')
    data = play.get('data') or {}
    if play.get('code') != 0:
        raise MusicError('站点未公开提供音轨（可能需要登录）；请手动准备。')
    audio = (data.get('dash') or {}).get('audio') or []
    durl = data.get('durl') or []
    url = ((audio[0].get('baseUrl') or audio[0].get('base_url')) if audio else
           durl[0].get('url') if len(durl) == 1 else None)
    if not isinstance(url, str):
        raise MusicError('站点未公开提供完整音轨；请手动准备。')
    allowed_url(url, 'cdn')
    return url


def download(track: dict, destination: Path, metadata: dict) -> None:
    kind, identifier, page = source_info(track)
    net = Network()
    for attempt in range(3):  # initial attempt plus at most two retries
        try:
            if kind == 'bili':
                url = bili_url(net, identifier, page)
                domain = 'cdn'
            else:
                suffix = urllib.parse.quote(track['sourceFile'], safe='/')
                url = f'https://archive.org/download/{identifier}/{suffix}'
                if attempt:
                    if identifier not in metadata:
                        # Remember even failed metadata requests: one lookup per item.
                        metadata[identifier] = None
                        meta = net.json(f'https://archive.org/metadata/{identifier}', 'archive')
                        server, directory = meta.get('server'), meta.get('dir')
                        if (isinstance(server, str) and re.fullmatch(r'[a-zA-Z0-9.-]+', server)
                                and isinstance(directory, str) and
                                re.fullmatch(r'/[a-zA-Z0-9_/-]+', directory) and
                                '..' not in directory.split('/')):
                            direct = f'https://{server}{directory}/{suffix}'
                            allowed_url(direct, 'archive')
                            metadata[identifier] = f'https://{server}{directory}'
                    if metadata[identifier]:
                        url = f'{metadata[identifier]}/{suffix}'
                domain = 'archive'
            with destination.open('wb') as out:
                net.transfer(url, domain, out, MAX_SOURCE)
            if destination.stat().st_size < MIN_MP3:
                raise TransientError('来源未提供完整音频。')
            return
        except TransientError:
            if attempt == 2 or net.remaining <= 0 or time.monotonic() >= net.deadline:
                raise
    raise MusicError('公开来源下载失败。')


def encode(source: Path, destination: Path, track: dict) -> None:
    args = ['ffmpeg', '-hide_banner', '-nostdin', '-nostats',
            '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mp3,mov,flv,aac',
            *trim_args(track['trim']), '-i', str(source)]
    try:
        measured = subprocess.run([*args, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                                  capture_output=True, text=True, timeout=120)
        levels = re.findall(r'I:\s*(-?\d+\.\d+)\s*LUFS', measured.stderr)
        if measured.returncode or not levels:
            raise MusicError('ffmpeg 无法测量响度；请手动准备音频。')
        gain = max(-12.0, min(12.0, -18.0 - float(levels[-1])))
        result = subprocess.run([*args, '-y', '-vn', '-af', f'volume={gain:.2f}dB',
                                 '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k',
                                 '-map_metadata', '-1', '-id3v2_version', '3', str(destination)],
                                capture_output=True, text=True, timeout=120)
        if result.returncode or not valid_mp3(destination):
            raise MusicError('ffmpeg 转码失败或输出不是有效 MP3。')
    except (OSError, subprocess.SubprocessError):
        raise MusicError('ffmpeg 执行失败或超时。') from None


def read_state(path: Path) -> dict:
    if not safe_path(path).exists():
        return {}
    with path.open(encoding='utf-8') as stream:
        data = json.load(stream)
    tracks = data.get('tracks') if isinstance(data, dict) else None
    if not isinstance(data, dict) or data.get('schema') != 1 or not isinstance(tracks, dict):
        raise MusicError('音乐状态文件无效；为保护已有文件已停止。')
    for key, entry in tracks.items():
        if (not re.fullmatch(r'[a-z0-9-]+/[0-9]{2}-[a-z0-9-]+\.mp3', key) or
                not isinstance(entry, dict) or set(entry) != {'fingerprint', 'sha256'} or
                not all(isinstance(v, str) and re.fullmatch(r'[a-f0-9]{64}', v)
                        for v in entry.values())):
            raise MusicError('音乐状态文件无效；为保护已有文件已停止。')
    return tracks


def write_state(path: Path, tracks: dict) -> None:
    safe_path(path)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent,
                                     prefix='.music-state-', delete=False) as stream:
        temporary = Path(stream.name)
        try:
            json.dump({'schema': 1, 'tracks': tracks}, stream, sort_keys=True, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
            safe_path(path)
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)


def restore(root: Path, tracks: list[dict]) -> int:
    path = safe_path(root / STATE)
    path.parent.mkdir(parents=True, exist_ok=True)
    lock = safe_path(path.with_suffix('.lock'))
    # Separate from other optional asset downloaders; fail rather than steal locks.
    try:
        fd = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        raise MusicError('另一个音乐恢复进程正在运行；若已退出，请手动检查音乐锁。') from None
    try:
        os.close(fd)
        state = read_state(path)
        metadata = {}
        for track in tracks:
            target = safe_path(root / ASSETS / track['file'])
            if target.exists():
                previous = state.get(track['file'], {})
                if (valid_mp3(target) and previous.get('fingerprint') == fingerprint(track)
                        and previous.get('sha256') == sha256(target)):
                    print(f"[reused] {track['file']}")
                    continue
                raise MusicError('已有文件与音乐状态不匹配；保留原文件，请手动检查或移走冲突文件。')
            if shutil.which('ffmpeg') is None:
                raise MusicError('缺少 ffmpeg，请自行安装后重试。')
            target.parent.mkdir(parents=True, exist_ok=True)
            safe_path(target)
            # Source/output temps share target's filesystem. Hard-link install is
            # atomic and no-clobber, including when another writer wins the race.
            with tempfile.TemporaryDirectory(prefix='.music-', dir=target.parent) as tmp:
                source, output = Path(tmp) / 'source.media', Path(tmp) / 'output.mp3'
                try:
                    download(track, source, metadata)
                    encode(source, output, track)
                except MusicError as error:
                    print(f"来源：{track['source']}；可按 manifest 的 sourceFile/trim 手动准备到 {track['file']}。",
                          file=sys.stderr)
                    raise error
                if not valid_mp3(output):
                    raise MusicError('临时输出不是有效 MP3。')
                entry = {'fingerprint': fingerprint(track), 'sha256': sha256(output)}
                safe_path(target)
                try:
                    os.link(output, target)
                except FileExistsError:
                    raise MusicError('目标文件已由其他进程创建；保留原文件。') from None
                state[track['file']] = entry
                write_state(path, state)
            print(f"[installed] {track['file']}")
        return 0
    finally:
        lock.unlink()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).absolute().parent.parent)
    parser.add_argument('--manifest', type=Path, help='默认 ROOT/public-data/music.json')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--list', action='store_true', help='仅列出已有/缺失')
    mode.add_argument('--check', action='store_true', help='离线检查 MP3 头和至少 32 KiB')
    parser.add_argument('--theme', action='append', default=[], help='按 file 首段过滤，可重复')
    parser.add_argument('--accept-source-terms', action='store_true')
    args = parser.parse_args(argv)
    try:
        root = safe_path(args.root)
        tracks = load_manifest(args.manifest or root / 'public-data/music.json')
        if set(args.theme) - {t['file'].split('/')[0] for t in tracks}:
            raise MusicError('未知主题。')
        tracks = [t for t in tracks if not args.theme or t['file'].split('/')[0] in args.theme]
        # Validate every selected target even in read-only modes.
        targets = [(t, safe_path(root / ASSETS / t['file'])) for t in tracks]
        if args.list or args.check:
            complete = True
            for track, target in targets:
                ready = valid_mp3(target) if args.check else target.exists()
                complete &= ready
                print(f"[{'ready' if ready else 'missing/invalid'}] {track['file']}")
            return int(args.check and not complete)
        print(NOTICE, file=sys.stderr)
        if not args.accept_source_terms:
            return 2
        return restore(root, tracks)
    except MusicError as error:
        print(f'错误：{error}', file=sys.stderr)
        return 1
    except (OSError, ValueError, TypeError, KeyError, IndexError, AttributeError):
        # Never expose signed URLs, remote messages, paths or environment details.
        print('错误：本地文件或公开来源数据无法处理；请检查 manifest/文件权限或手动准备素材。', file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print('已取消；临时文件已清理。', file=sys.stderr)
        return 130


if __name__ == '__main__':
    sys.exit(main())
