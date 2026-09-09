"""Preview lifecycle and read-only on-site personal-page detection."""
from http.client import HTTPConnection
from pathlib import Path
import shutil
import socket
import sys
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from content_model import defaults
from edit_profiles import ProfileStore
from editor_preview import EditorPreview


class PersonalPageStatusTests(unittest.TestCase):
    def test_saved_files_determine_status_not_the_external_homepage_field(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            store = ProfileStore(root)
            store.save({'slug': 'jane-doe', 'data': defaults('people') | {
                'name': 'Jane Doe', 'slug': 'jane-doe', 'homepage': 'https://example.org/jane'}})
            def status():
                return store.get('jane-doe')['personal_page']
            self.assertEqual(status(), {'enabled': False, 'kind': 'none', 'url': None})
            folder = root / 'content/personal/jane-doe'
            folder.mkdir(parents=True)
            (folder / 'photo.png').write_bytes(b'photo')
            self.assertFalse(status()['enabled'], 'An asset folder alone is not a personal page')
            page = folder / 'index.md'
            page.write_text('+++\nlayout = "academic"\n+++\nAbout me.\n')
            self.assertEqual(status(), {'enabled': True, 'kind': 'template', 'url': '/~jane-doe/'})
            page.rename(folder / 'index.html')
            self.assertEqual(status()['kind'], 'template', 'Legacy Hugo HTML pages are supported')
            custom = root / 'static/~jane-doe/index.html'
            custom.parent.mkdir(parents=True); custom.write_text('<title>My site</title>')
            self.assertEqual(status()['kind'], 'conflict')
            (folder / 'index.html').unlink()
            self.assertEqual(status()['kind'], 'custom')
            with self.assertRaisesRegex(ValueError, 'Unknown editor field'):
                store.save({'slug': 'jane-doe', 'revision': store.get('jane-doe')['revision'], 'data': {'personal_page': {'enabled': False}}})


@unittest.skipUnless(shutil.which('hugo'), 'Hugo required')
class EditorPreviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='msrg-preview-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'layouts').mkdir()
        (self.root / 'layouts/index.html').write_text('<!doctype html><html><head><title>Preview test</title></head><body>Preview fixture</body></html>')
        (self.root / 'hugo.yaml').write_text('baseURL: https://example.org/\ndisableKinds: [taxonomy, term, rss, sitemap]\n')
        self.preview = EditorPreview(self.root, preferred_port=0)
        self.addCleanup(self.preview.close)

    def ready(self):
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            status = self.preview.status()
            if status['state'] == 'ready':
                return status
            if status['state'] == 'failed':
                self.fail(str(status))
            time.sleep(.1)
        self.fail('Preview did not become ready: ' + str(self.preview.status()))

    def test_starts_on_available_port_serves_changes_and_stops_only_its_own_process(self):
        (self.root / 'public').mkdir()
        sentinel = self.root / 'public/keep.txt'; sentinel.write_text('Do not replace this build')
        with socket.socket() as occupied:
            occupied.bind(('127.0.0.1', 0)); occupied.listen()
            self.preview.preferred_port = occupied.getsockname()[1]
            self.preview.start()
            ready = self.ready()
            self.assertNotEqual(self.preview.port, self.preview.preferred_port)
            self.assertEqual(ready['url'], f'http://127.0.0.1:{self.preview.port}')
            process = self.preview.process
            self.preview.start()
            self.assertIs(self.preview.process, process, 'Repeated starts should reuse the owned preview')
            connection = HTTPConnection('127.0.0.1', self.preview.port)
            connection.request('GET', '/')
            response = connection.getresponse()
            self.assertEqual(response.status, 200)
            self.assertIn(b'Preview fixture', response.read()); connection.close()
            (self.root / 'layouts/index.html').write_text('<!doctype html><html><title>Preview updated</title><body>Updated fixture</body></html>')
            deadline = time.monotonic() + 10
            body = b''
            while time.monotonic() < deadline:
                connection = HTTPConnection('127.0.0.1', self.preview.port)
                connection.request('GET', '/'); body = connection.getresponse().read(); connection.close()
                if b'Updated fixture' in body:
                    break
                time.sleep(.1)
            self.assertIn(b'Updated fixture', body)
            folder = Path(self.preview.temp.name)
            self.preview.close()
            self.assertIsNotNone(process.poll())
            self.assertFalse(folder.exists())
            self.assertEqual(sentinel.read_text(), 'Do not replace this build')
            self.assertNotEqual(occupied.fileno(), -1)
            self.assertEqual(self.preview.status()['state'], 'stopped')

    def test_failed_build_is_reported_and_can_be_retried(self):
        template = self.root / 'layouts/index.html'
        template.write_text('{{ broken template')
        self.preview.start()
        self.preview.process.wait(timeout=15)
        status = self.preview.status()
        self.assertEqual(status['state'], 'failed')
        self.assertIn('ERROR', status['details'])
        template.write_text('<!doctype html><title>Fixed</title><h1>Fixed preview</h1>')
        self.preview.start()
        self.assertEqual(self.ready()['state'], 'ready')

    def test_missing_hugo_leaves_editor_usable_with_an_explanation(self):
        self.preview.hugo = None
        self.preview.start()
        status = self.preview.status()
        self.assertEqual(status['state'], 'failed')
        self.assertIn('pixi run editor', status['message'])
        self.assertIsNone(self.preview.process)


if __name__ == '__main__':
    unittest.main()
