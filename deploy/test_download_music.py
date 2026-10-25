"""Offline regression tests. Never contact sources or execute real ffmpeg."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch, Mock
import urllib.error

spec = importlib.util.spec_from_file_location('download_music', Path(__file__).with_name('download-music.py'))
music = importlib.util.module_from_spec(spec)
spec.loader.exec_module(music)
MP3 = b'ID3' + b'\0' * (32 * 1024 - 3)
TRACK = dict(file='anime-theme/01-example.mp3', title='Example', game='Example',
             source='https://archive.org/details/mezase-pokemon-master-20th-anniversary',
             sourceFile='Album/Song.mp3', trim='', credit='')
SIGNED = 'https://audio.bilivideo.com/file.m4a?deadline=secret&token=DO-NOT-LOG'


class MusicTests(unittest.TestCase):
    def setUp(self):
        # Keep test artifacts inside this isolated worktree, not a user asset root.
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.manifest = self.root / 'public-data/music.json'
        self.manifest.parent.mkdir()
        self.target = self.root / music.ASSETS / TRACK['file']
        self.save_manifest([TRACK])
        self.network = self.enterContext(patch.object(music.Network, 'transfer',
                                          side_effect=AssertionError('unexpected network')))
        self.process = self.enterContext(patch.object(music.subprocess, 'run',
                                          side_effect=AssertionError('unexpected ffmpeg')))
        self.which = self.enterContext(patch.object(music.shutil, 'which', return_value='/fake/ffmpeg'))

    def save_manifest(self, tracks):
        self.manifest.write_text(json.dumps({'schema': 1, 'tracks': tracks}))

    def cli(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            result = music.main(['--root', str(self.root), *args])
        return result, out.getvalue() + err.getvalue()

    def fake_ffmpeg(self, args, **kwargs):
        self.assertEqual(kwargs['timeout'], 120)
        if 'ebur128=peak=true' in args:
            return subprocess.CompletedProcess(args, 0, '', 'I: -40.0 LUFS')
        self.assertIn('volume=12.00dB', args)
        self.assertIn('96k', args)
        self.assertIn('44100', args)
        self.assertIn('-map_metadata', args)
        Path(args[-1]).write_bytes(MP3)
        return subprocess.CompletedProcess(args, 0, '', '')

    def fake_download(self, track, destination, metadata):
        destination.write_bytes(MP3)

    def install(self):
        self.process.side_effect = self.fake_ffmpeg
        with patch.object(music, 'download', side_effect=self.fake_download):
            self.assertEqual(self.cli('--accept-source-terms')[0], 0)

    def test_list_is_read_only_without_network_ffmpeg_or_consent(self):
        self.which.side_effect = AssertionError('ffmpeg lookup during offline mode')
        result, text = self.cli('--list')
        self.assertEqual(result, 0)
        self.assertIn('missing', text)
        self.assertFalse((self.root / '.cache').exists())
        self.target.parent.mkdir(parents=True)
        self.target.write_bytes(b'personal file')
        self.assertIn('[ready]', self.cli('--list')[1])
        self.network.assert_not_called()
        self.process.assert_not_called()

    def test_check_signature_and_size_without_state(self):
        self.assertEqual(self.cli('--check')[0], 1)
        self.target.parent.mkdir(parents=True)
        for payload, expected in [(b'ID3', 1), (b'x' * 32768, 1), (MP3, 0),
                                  (b'\xff\xfb' + b'\0' * 32766, 0)]:
            self.target.write_bytes(payload)
            self.assertEqual(self.cli('--check')[0], expected)
        self.assertFalse((self.root / '.cache').exists())

    def test_consent_required_and_no_force(self):
        self.assertNotEqual(self.cli()[0], 0)
        self.assertIn('公开可访问不等于再分发许可', self.cli()[1])
        self.assertFalse(self.target.exists())
        self.network.assert_not_called()
        self.process.assert_not_called()

    def test_path_and_source_rejection(self):
        changes = [('file', '../01-escape.mp3'), ('file', '/tmp/01-escape.mp3'),
                   ('file', 'theme/../01-escape.mp3'), ('file', 'theme\\01-escape.mp3'),
                   ('file', 'theme/01-escape\n.mp3'), ('file', 'theme/01-escape.mp3/extra'),
                   ('source', 'https://127.0.0.1/details/private'),
                   ('source', TRACK['source'] + '?token=secret'),
                   ('source', 'https://archive.org/details/unknown-item'),
                   ('sourceFile', '../private.mp3'), ('sourceFile', '/private.mp3'),
                   ('sourceFile', 'https://localhost/private.mp3'),
                   ('sourceFile', 'foo/%2e%2e/private.mp3'), ('sourceFile', 'foo\\private.mp3'),
                   ('trim', '[100-1]'), ('trim', '[NaN-end]')]
        for key, value in changes:
            with self.subTest(key=key, value=value):
                self.save_manifest([{**TRACK, key: value}])
                self.assertNotEqual(self.cli('--accept-source-terms')[0], 0)
        self.network.assert_not_called()
        self.process.assert_not_called()

    def test_symlink_target_parent_manifest_and_state_are_rejected(self):
        outside = self.root / 'outside'
        outside.mkdir()
        self.target.parent.parent.mkdir(parents=True)
        self.target.parent.symlink_to(outside, target_is_directory=True)
        self.assertNotEqual(self.cli('--list')[0], 0)
        self.target.parent.unlink()
        self.target.parent.mkdir()
        self.target.symlink_to(outside / 'absent.mp3')
        self.assertNotEqual(self.cli('--check')[0], 0)
        self.target.unlink()
        original = self.manifest.with_suffix('.original')
        self.manifest.rename(original)
        self.manifest.symlink_to(original)
        self.assertNotEqual(self.cli('--list')[0], 0)
        self.manifest.unlink()
        original.rename(self.manifest)
        (self.root / '.cache').mkdir()
        (self.root / music.STATE).symlink_to(outside / 'state.json')
        self.assertNotEqual(self.cli('--accept-source-terms')[0], 0)
        self.assertEqual(list(outside.iterdir()), [])

    def test_unknown_existing_file_never_overwritten(self):
        self.target.parent.mkdir(parents=True)
        self.target.write_bytes(MP3)
        result, text = self.cli('--accept-source-terms')
        self.assertNotEqual(result, 0)
        self.assertIn('保留原文件', text)
        self.assertEqual(self.target.read_bytes(), MP3)
        self.process.assert_not_called()
        self.network.assert_not_called()

    def test_matching_state_reused_and_hash_change_conflicts(self):
        self.install()
        self.process.reset_mock()
        self.assertEqual(self.cli('--accept-source-terms')[0], 0)
        self.assertIn('[reused]', self.cli('--accept-source-terms')[1])
        self.process.assert_not_called()
        self.target.write_bytes(MP3 + b'edited')
        self.assertNotEqual(self.cli('--accept-source-terms')[0], 0)
        self.assertEqual(self.target.read_bytes(), MP3 + b'edited')

    def test_changed_trim_conflicts(self):
        self.install()
        self.save_manifest([{**TRACK, 'trim': '[1.6-222.6]'}])
        self.process.reset_mock()
        self.assertNotEqual(self.cli('--accept-source-terms')[0], 0)
        self.assertEqual(self.target.read_bytes(), MP3)
        self.process.assert_not_called()

    def test_failed_encode_or_invalid_output_leaves_no_target(self):
        for failure in ('returncode', 'timeout', 'invalid'):
            def fail(args, **kwargs):
                if 'ebur128=peak=true' in args:
                    return subprocess.CompletedProcess(args, 0, '', 'I: -20.0 LUFS')
                Path(args[-1]).write_bytes(b'bad')
                if failure == 'timeout':
                    raise subprocess.TimeoutExpired(args, 120, stderr=SIGNED)
                return subprocess.CompletedProcess(args, int(failure == 'returncode'), '', SIGNED)
            self.process.side_effect = fail
            with patch.object(music, 'download', side_effect=self.fake_download):
                result, text = self.cli('--accept-source-terms')
            self.assertNotEqual(result, 0)
            self.assertNotIn('DO-NOT-LOG', text)
            self.assertFalse(self.target.exists())
            self.assertEqual(list(self.target.parent.iterdir()), [])

    def test_signed_runtime_url_only_in_network_never_state_or_log(self):
        bili = {**TRACK, 'source': 'https://www.bilibili.com/video/BV1h14y1t7bZ',
                'sourceFile': 'bilibili BV1h14y1t7bZ p1'}
        self.save_manifest([bili])
        self.process.side_effect = self.fake_ffmpeg
        def transfer(url, kind, out, limit):
            self.assertEqual(url, SIGNED)
            self.assertEqual(kind, 'cdn')
            out.write(MP3)
        self.network.side_effect = transfer
        with patch.object(music, 'bili_url', return_value=SIGNED):
            result, text = self.cli('--accept-source-terms')
        self.assertEqual(result, 0)
        state = (self.root / music.STATE).read_text()
        for value in (SIGNED, 'DO-NOT-LOG', 'deadline', 'token', 'bilivideo'):
            self.assertNotIn(value, state + text)
        self.assertEqual(set(json.loads(state)['tracks'][TRACK['file']]), {'fingerprint', 'sha256'})

    def test_transport_exception_is_redacted(self):
        response = Mock()
        response.open.side_effect = urllib.error.URLError(SIGNED)
        with patch.object(music.urllib.request, 'build_opener', return_value=response):
            with self.assertRaises(music.MusicError) as raised:
                # Bypass the guard mock only for this controlled fake opener.
                with patch.object(music.Network, 'transfer', ORIGINAL_TRANSFER):
                    music.Network().transfer(SIGNED, 'cdn', io.BytesIO(), 100)
        self.assertNotIn('DO-NOT-LOG', str(raised.exception))

    def test_url_and_redirect_policy(self):
        for url, kind in [('http://audio.bilivideo.com/a', 'cdn'),
                          ('https://bilivideo.com.evil.test/a', 'cdn'),
                          ('https://127.0.0.1/a', 'cdn'),
                          ('https://evil.test/a', 'archive'),
                          ('https://' + 'user:password@archive.org/a', 'archive'),
                          ('https://archive.org:444/a', 'archive'),
                          ('https://archive.org/a\nInjected', 'archive')]:
            with self.subTest(url=url):
                with self.assertRaises((music.MusicError, ValueError)):
                    music.allowed_url(url, kind)
        for host in ('audio.bilivideo.com', 'audio.bilivideo.cn', 'audio.akamaized.net'):
            music.allowed_url(f'https://{host}/a?token=secret', 'cdn')
        with self.assertRaises(music.MusicError):
            music.Redirects('archive').redirect_request(None, None, 302, '', {}, 'https://localhost/a')
        self.network.assert_not_called()

    def test_install_race_never_clobbers(self):
        self.process.side_effect = self.fake_ffmpeg
        real_link = os.link
        def race(source, target):
            Path(target).write_bytes(b'other writer')
            real_link(source, target)
        with patch.object(music, 'download', side_effect=self.fake_download), \
                patch.object(music.os, 'link', side_effect=race):
            self.assertNotEqual(self.cli('--accept-source-terms')[0], 0)
        self.assertEqual(self.target.read_bytes(), b'other writer')
        self.assertEqual([p.name for p in self.target.parent.iterdir()], [self.target.name])

    def test_trim_filter_and_no_stale_media_deletion(self):
        self.assertEqual(music.trim_args('[3.5-end]'), ['-ss', '3.5'])
        self.assertEqual(music.trim_args('[1.6-222.6]'), ['-ss', '1.6', '-t', '221.0'])
        self.save_manifest([TRACK, {**TRACK, 'file': 'pokemon-songs/02-other.mp3'}])
        result, text = self.cli('--list', '--theme', 'pokemon-songs', '--theme', 'pokemon-songs')
        self.assertEqual(result, 0)
        self.assertNotIn('01-example.mp3', text)
        self.assertIn('02-other.mp3', text)
        self.assertNotEqual(self.cli('--list', '--theme', 'unknown')[0], 0)
        stale = self.root / music.ASSETS / 'old/99-personal.mp3'
        stale.parent.mkdir(parents=True)
        stale.write_bytes(b'personal')
        self.install()
        self.assertEqual(stale.read_bytes(), b'personal')

    def test_archive_metadata_once_per_item_and_canonical_first(self):
        track = TRACK.copy()
        calls = []
        def transfer(url, kind, out, limit):
            calls.append(url)
            if '/download/' in url:
                raise music.TransientError('temporary unavailable')
            out.write(MP3)
        self.network.side_effect = transfer
        metadata = {}
        with patch.object(music.Network, 'json', return_value={
                'server': 'ia800000.us.archive.org', 'dir': '/0/items/test'}) as meta:
            music.download(track, self.root / 'download.fixture', metadata)
            music.download(track, self.root / 'download.fixture', metadata)
            self.assertEqual(meta.call_count, 1)
        self.assertTrue(calls[0].startswith('https://archive.org/download/'))
        self.assertTrue(any('ia800000.us.archive.org' in url for url in calls))

    def test_real_transfer_size_budget_and_deadline(self):
        opener, response = Mock(), Mock()
        opener.open.return_value = response
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.geturl.return_value = SIGNED
        for per_request, remaining in [(4, 100), (100, 4)]:
            response.read1.side_effect = [b'12345', b'']
            net = music.Network()
            net.remaining = remaining
            output = io.BytesIO()
            with patch.object(music.urllib.request, 'build_opener', return_value=opener), \
                    patch.object(music.Network, 'transfer', ORIGINAL_TRANSFER):
                with self.assertRaises(music.MusicError):
                    net.transfer(SIGNED, 'cdn', output, per_request)
            self.assertEqual(output.getvalue(), b'')
        with patch.object(music.time, 'monotonic', return_value=0) as clock:
            net = music.Network()
            def delayed_read(size):
                clock.return_value = 301
                return b'x'
            response.read1.side_effect = delayed_read
            with patch.object(music.urllib.request, 'build_opener', return_value=opener), \
                    patch.object(music.Network, 'transfer', ORIGINAL_TRANSFER):
                with self.assertRaises(music.MusicError):
                    net.transfer(SIGNED, 'cdn', io.BytesIO(), 100)
            response.fp.raw._sock.settimeout.assert_called_with(30)
            opener.open.assert_called_with(unittest.mock.ANY, timeout=30)

    def test_transfer_final_chunk_closes_http_response_fp(self):
        payload = MP3 * 3  # Multiple read1 calls; final nonempty read closes fp.
        for limit, succeeds in ((len(payload), True), (len(payload) - 1, False)):
            with self.subTest(limit=limit):
                wire = io.BytesIO(b'HTTP/1.1 200 OK\r\nContent-Length: ' +
                                  str(len(payload)).encode() + b'\r\n\r\n' + payload)
                socket = Mock()
                wire.raw = Mock(_sock=socket)
                socket.makefile.return_value = wire
                response = music.http.client.HTTPResponse(socket)
                response.begin()
                response.url = SIGNED
                opener = Mock()
                opener.open.return_value = response
                output = io.BytesIO()
                net = music.Network()
                with patch.object(music.urllib.request, 'build_opener', return_value=opener), \
                        patch.object(music.Network, 'transfer', ORIGINAL_TRANSFER):
                    if succeeds:
                        net.transfer(SIGNED, 'cdn', output, limit)
                        self.assertEqual(output.getvalue(), payload)
                    else:
                        with self.assertRaisesRegex(music.MusicError, '下载超出大小上限'):
                            net.transfer(SIGNED, 'cdn', output, limit)
                        self.assertLess(len(output.getvalue()), len(payload))
                self.assertIsNone(response.fp)
                self.assertEqual(net.remaining, music.MAX_SOURCE - len(payload))
                self.assertEqual(socket.settimeout.call_count, 2)

    def test_redirects_never_read_body_and_validate_each_hop(self):
        handler = music.Redirects('archive')
        handler.parent = Mock()
        request = music.urllib.request.Request('https://archive.org/download/item/file.mp3')
        response = Mock()
        handler.http_error_302(request, response, 302, '',
                               {'location': 'https://ia800000.us.archive.org/file.mp3'})
        response.close.assert_called_once()
        response.read.assert_not_called()
        redirected = handler.parent.open.call_args.args[0]
        with self.assertRaises(music.MusicError):
            handler.http_error_302(redirected, Mock(), 302, '',
                                   {'location': 'https://localhost/private'})
        self.assertEqual(handler.parent.open.call_count, 1)

    def test_no_retry_for_permission_or_unknown_cdn_and_at_most_two_retries(self):
        destination = self.root / 'download.fixture'
        self.network.side_effect = music.TransientError('temporary')
        with patch.object(music.Network, 'json', return_value={}):
            with self.assertRaises(music.MusicError):
                music.download(TRACK, destination, {})
        self.assertEqual(self.network.call_count, 3)
        self.network.reset_mock()
        self.network.side_effect = music.MusicError('permission denied')
        with self.assertRaises(music.MusicError):
            music.download(TRACK, destination, {})
        self.assertEqual(self.network.call_count, 1)
        bili = {**TRACK, 'source': 'https://www.bilibili.com/video/BV1h14y1t7bZ',
                'sourceFile': 'bilibili BV1h14y1t7bZ p1'}
        replies = [{'code': 0, 'data': {'pages': [{'cid': 123}]}},
                   {'code': 0, 'data': {'durl': [{'url': 'https://unknown.test/a?secret=yes'}]}}]
        self.network.reset_mock()
        with patch.object(music.Network, 'json', side_effect=replies) as api:
            with self.assertRaises(music.MusicError):
                music.download(bili, destination, {})
        self.assertEqual(api.call_count, 2)
        self.network.assert_not_called()

    def test_bilibili_public_apis_no_cookie_and_closed_access_message(self):
        pages = {'code': 0, 'data': {'pages': [{'cid': 123}, {'cid': 456}]}}
        for data in ({'dash': {'audio': [{'baseUrl': SIGNED}]}}, {'durl': [{'url': SIGNED}]}):
            with patch.object(music.Network, 'json', side_effect=[pages, {'code': 0, 'data': data}]) as api:
                self.assertEqual(music.bili_url(music.Network(), 'BV1wfyyY7E2x', 2), SIGNED)
                urls = [call.args[0] for call in api.call_args_list]
                self.assertEqual(urls[0], 'https://api.bilibili.com/x/web-interface/view?bvid=BV1wfyyY7E2x')
                self.assertIn('/x/player/playurl?bvid=BV1wfyyY7E2x&cid=456&', urls[1])
        self.assertNotIn('Cookie', music.HEADERS)
        self.save_manifest([{**TRACK, 'source': 'https://www.bilibili.com/video/BV1h14y1t7bZ',
                             'sourceFile': 'bilibili BV1h14y1t7bZ p1'}])
        with patch.object(music.Network, 'json', side_effect=[pages, {'code': -101, 'message': SIGNED}]):
            result, text = self.cli('--accept-source-terms')
        self.assertNotEqual(result, 0)
        self.assertIn('https://www.bilibili.com/video/BV1h14y1t7bZ', text)
        self.assertIn('手动准备', text)
        self.assertNotIn('DO-NOT-LOG', text)


ORIGINAL_TRANSFER = music.Network.transfer

if __name__ == '__main__':
    unittest.main()
