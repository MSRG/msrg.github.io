from __future__ import annotations

import base64
import json
import re
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from content_model import defaults, SCHEMA
from edit_profiles import ProfileStore, Conflict, make_server

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
ABSTRACT = r'''We study **entanglement** with *noise* and $x_i^2$.
The error is \(\frac{\alpha}{\sqrt{n}}\). Literal prices: `$10` and `$20`.

$$
\begin{aligned}
f(x) &= \sum_{i=1}^{n} x_i \\
g(x) &= \text{Var}(x)
\end{aligned}
$$

\[\mathbf{H}\lvert\psi\rangle = E\lvert\psi\rangle\]
'''


class WebsiteEditorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = ProfileStore(self.root)

    def member(self):
        self.store.save({'slug': 'jane-doe', 'data': defaults('people') | {'name': 'Jane Doe', 'slug': 'jane-doe'}})

    def upload(self, category='download', name='results.csv', content=b'a,b\n1,2\n'):
        return self.store.upload({'category': category, 'name': name, 'content': base64.b64encode(content).decode(), 'slug': 'jane-doe'})

    def test_upload_and_select_portrait_without_copying_files(self):
        photo = self.upload('portrait', 'Photo.PNG', PNG)
        self.assertTrue(photo['url'].startswith('/images/people/jane-doe-'))
        self.assertEqual((self.root / photo['path']).read_bytes(), PNG)
        data = defaults('people') | {'name': 'Jane Doe', 'slug': 'jane-doe', 'portrait': photo['url'], 'portrait_position': 'top'}
        self.store.save({'slug': 'jane-doe', 'data': data})
        self.assertEqual(self.store.get('jane-doe')['data']['portrait'], photo['url'])
        self.assertEqual(self.upload('portrait', 'Photo.PNG', PNG), photo)

    def test_uploads_preserve_previous_files_and_reject_unsafe_paths_and_formats(self):
        one = self.upload(content=b'one')
        two = self.upload(content=b'two')
        self.assertNotEqual(one['url'], two['url'])
        self.assertEqual((self.root / one['path']).read_bytes(), b'one')
        for args in [('portrait', 'photo.jpg', b'not an image'), ('download', '../outside.csv', b'x'), ('download', 'code.html', b'<script>'), ('download', 'C:\\file.csv', b'x')]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                self.upload(*args)
        for kind in ['people', 'personal', 'publications', 'data-sets', 'unknown']:
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                self.store.path('../escape', kind)

    def test_create_publication_dataset_and_related_links(self):
        upload = self.upload()
        self.store.save({'kind': 'publications', 'slug': 'sample-paper', 'data': defaults('publications') | {
            'title': 'A paper', 'authors': ['Jane Doe'], 'year': 2026, 'venue': 'Conference', 'external_url': 'https://example.org/paper', 'abstract': ABSTRACT}, 'body': '\nCompanion experiment notes.\n'})
        self.store.save({'kind': 'data-sets', 'slug': 'sample-data', 'data': defaults('data-sets') | {
            'title': 'Sample data', 'related_publication': 'sample-paper', 'downloads': [{'label': 'CSV', 'url': upload['url']}]}, 'body': '\nReproduction instructions.\n'})
        paper = self.store.get('sample-paper', 'publications')
        self.store.save({'kind': 'publications', 'slug': 'sample-paper', 'revision': paper['revision'], 'data': {'related_datasets': ['sample-data']}})
        reopened = self.store.get('sample-paper', 'publications')
        self.assertEqual(reopened['body'], '\nCompanion experiment notes.\n')
        self.assertEqual(reopened['data']['abstract'], ABSTRACT)
        for source, key in [('publications', 'related_datasets'), ('data-sets', 'related_publication')]:
            field = next(f for f in self.store.schema(source)['schema']['fields'] if f['key'] == key)
            self.assertIn('sample-data' if key == 'related_datasets' else 'sample-paper', [choice['value'] for choice in field['choices']])
        with self.assertRaises(Conflict):
            self.store.save({'kind': 'publications', 'slug': 'sample-paper', 'revision': paper['revision'], 'data': {'title': 'Stale'}})
        with self.assertRaises(ValueError):
            self.store.save({'kind': 'data-sets', 'slug': 'bad-data', 'data': {'title': 'Bad', 'downloads': [{'label': 'Missing', 'url': '/downloads/missing.zip'}]}})

    def test_personal_templates_edit_structured_sections_and_upload_assets(self):
        with self.assertRaises(ValueError):
            self.store.save({'kind': 'personal', 'slug': 'jane-doe', 'data': defaults('personal')})
        self.member()
        image = self.upload('personal', 'photo.png', PNG)
        data = defaults('personal') | {'layout': 'structured', 'focus': ['Quantum systems'],
            'primary_link': {'label': 'Paper', 'url': 'https://example.org/paper'},
            'timeline': [{'period': '2026', 'title': 'Joined MSRG', 'description': 'Research'}]}
        self.store.save({'kind': 'personal', 'slug': 'jane-doe', 'data': data, 'body': '\n## About\n![Photo](' + image['url'] + ')\n'})
        record = self.store.get('jane-doe', 'personal')
        self.assertEqual(record['data'], data)
        self.assertIn('## About', record['body'])
        self.store.save({'kind': 'personal', 'slug': 'jane-doe', 'revision': record['revision'], 'data': {'layout': 'academic', 'primary_link': {}}})
        self.assertEqual(self.store.get('jane-doe', 'personal')['data']['primary_link'], {})
        custom = self.root / 'static/~jane-doe/index.html'
        custom.parent.mkdir(parents=True); custom.write_text('<h1>Custom</h1>')
        with self.assertRaises(ValueError):
            self.store.save({'kind': 'personal', 'slug': 'jane-doe', 'revision': self.store.get('jane-doe', 'personal')['revision'], 'data': {'layout': 'single'}})
        self.assertEqual(custom.read_text(), '<h1>Custom</h1>')

    def test_personal_pages_offer_templates_without_custom_css_controls_or_uploads(self):
        self.member()
        schema = self.store.schema('personal')
        self.assertEqual(schema['schema']['editor']['label'], 'Personal Pages')
        self.assertNotIn('custom_css', {field['key'] for field in schema['schema']['fields']})
        self.assertNotIn('custom_css', schema['defaults'])
        for category in ('personal', 'download'):
            with self.assertRaisesRegex(ValueError, 'Custom CSS is not supported'):
                self.upload(category, 'custom.css', b'body { color: red; }')
        with self.assertRaisesRegex(ValueError, 'Unknown editor field'):
            self.store.save({'kind': 'personal', 'slug': 'jane-doe', 'data': {'layout': 'single', 'custom_css': ['custom.css']}})

    def test_every_existing_record_can_be_edited_without_losing_unknown_values_or_body(self):
        original_store = ProfileStore(ROOT)
        for kind in ('people', 'personal', 'publications', 'data-sets'):
            fields = {f['key'] for f in SCHEMA['types'][kind]['fields'] if f.get('editor', True)}
            for record in original_store.records(kind):
                with self.subTest(kind=kind, slug=record['slug']):
                    opened = original_store.get(record['slug'], kind)
                    from content_model import update_profile_text
                    source = original_store.path(record['slug'], kind).read_text(encoding='utf-8')
                    updated = update_profile_text(source, {k: v for k, v in opened['data'].items() if k in fields})
                    self.assertEqual(source, updated)

    def test_http_api_requires_local_origin_and_token_and_handles_conflicts(self):
        server = make_server(self.root, 0)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
        base = f'http://127.0.0.1:{server.server_port}'
        with urlopen(base + '/api/config') as response:
            config = json.load(response)
        self.assertEqual(set(config['collections']), {'people', 'personal', 'publications', 'data-sets'})
        payload = json.dumps({'slug': 'jane-doe', 'data': defaults('people') | {'name': 'Jane Doe', 'slug': 'jane-doe'}}).encode()
        headers = {'Content-Type': 'application/json', 'Origin': base, 'X-Editor-Token': config['token']}
        for invalid in [headers | {'Origin': 'https://example.org'}, headers | {'X-Editor-Token': 'wrong'}]:
            with self.assertRaises(HTTPError) as caught:
                urlopen(Request(base + '/api/records', data=payload, headers=invalid))
            self.assertEqual(caught.exception.code, 403)
        with urlopen(Request(base + '/api/records', data=payload, headers=headers)) as response:
            self.assertEqual(response.status, 200)
        with self.assertRaises(HTTPError) as caught:
            urlopen(Request(base + '/api/records', data=payload, headers=headers))
        self.assertEqual(caught.exception.code, 409)

    @unittest.skipUnless(shutil.which('hugo'), 'Hugo required')
    def test_saved_forms_build_into_real_pages_and_downloads(self):
        for directory in ['archetypes', 'assets', 'content', 'data', 'layouts', 'static']:
            shutil.copytree(ROOT / directory, self.root / directory, dirs_exist_ok=True)
        shutil.copy2(ROOT / 'hugo.yaml', self.root / 'hugo.yaml')
        self.member()
        self.test_create_publication_dataset_and_related_links()
        # Legacy pages can derive their URLs from a title longer than the filename.
        existing = self.store.get('fledge', 'publications')
        self.store.save({'kind': 'publications', 'slug': 'fledge', 'revision': existing['revision'],
                         'data': {'title': 'An updated Fledge title', 'abstract': ''},
                         'body': '\nCompanion material remains available.\n'})
        self.assertEqual(self.store.get('fledge', 'publications')['preview'], existing['preview'])
        self.store.save({'kind': 'personal', 'slug': 'jane-doe', 'data': defaults('personal') | {'layout': 'structured',
            'primary_link': {'label': 'A paper', 'url': '/publications/sample-paper/'}, 'highlights': [{'title': 'Editor-created highlight', 'description': 'Works'}]}, 'body': '\n## Editor-created page\nHello.\n'})
        result = subprocess.run(['hugo', '--source', str(self.root), '--destination', str(self.root / 'public'), '--cacheDir', str(self.root / 'cache'), '--panicOnWarning'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('Editor-created highlight', (self.root / 'public/~jane-doe/index.html').read_text())
        self.assertIn('/downloads/', (self.root / 'public/data-sets/sample-data/index.html').read_text())
        paper_html = (self.root / 'public/publications/sample-paper/index.html').read_text()
        self.assertIn('>Abstract</p>', paper_html)
        self.assertIn('<strong>entanglement</strong>', paper_html)
        self.assertIn('<em>noise</em>', paper_html)
        self.assertEqual(paper_html.count('<math '), 4)
        self.assertEqual(paper_html.count('class="math-block"'), 2)
        self.assertIn('<mfrac>', paper_html)
        self.assertIn('<code>$10</code>', paper_html)
        self.assertIn('<code>$20</code>', paper_html)
        self.assertIn('>Additional notes</h2>', paper_html)
        self.assertIn('Companion experiment notes.', paper_html)
        self.assertNotIn('Read the abstract and full publication', paper_html)
        # Source abstracts must render their formatting, not expose escaped TeX.
        survey = self.store.get('a-comprehensive-survey-of-machine-unlearning-techniques-for-large-language-models', 'publications')
        survey_html = (self.root / 'public' / survey['preview'].lstrip('/') / 'index.html').read_text()
        self.assertIn('<em>LLM unlearning</em>', survey_html)
        self.assertNotIn(r'\textit', survey_html)
        for slug, equations in {
            'mess-dynamically-learned-inference-time-llm-routing-in-model-zoos-with-service-level-guarantees': 1,
            'building-fault-tolerant-overlays-with-low-node-degrees-for-topic-based-publish-subscribe': 12,
            'how-does-stake-distribution-influence-consensus': 3,
        }.items():
            record = self.store.get(slug, 'publications')
            markup = (self.root / 'public' / record['preview'].lstrip('/') / 'index.html').read_text()
            self.assertEqual(markup.count('<math '), equations, slug)
        archive_html = (self.root / 'public/publications/index.html').read_text()
        self.assertNotIn('entanglement', archive_html)
        self.assertEqual(archive_html.count('data-publication-card'), 100)
        index = json.loads((self.root / 'public/publications/index.json').read_text())
        self.assertTrue(any('entanglement' in record['search'] for record in index))
        # Every record remains reachable with JavaScript disabled, exactly once.
        archive_pages = [self.root / 'public/publications/index.html'] + sorted(
            (self.root / 'public/publications/page').glob('*/index.html'))
        urls = []
        for archive_page in archive_pages:
            markup = archive_page.read_text()
            if 'http-equiv="refresh"' in markup:
                continue
            self.assertLessEqual(markup.count('data-publication-card'), 100)
            urls.extend(re.findall(r'<h2><a href="([^"]+)"', markup))
        self.assertEqual(len(urls), len(index))
        self.assertEqual(set(urls), {record['url'] for record in index})
        legacy_html = (self.root / 'public' / existing['preview'].lstrip('/') / 'index.html').read_text()
        self.assertIn('Read the abstract and full publication at the source.', legacy_html)
        self.assertRegex(legacy_html, r'<a href="[^"]+" target="_blank" rel="noopener noreferrer">Read the abstract and full publication')
        self.assertIn('>Additional notes</h2>', legacy_html)
        self.assertNotIn('>Overview</p>', legacy_html)
        self.assertTrue(list((self.root / 'public/downloads').glob('*.csv')))
        self.assertTrue((self.root / 'public' / existing['preview'].lstrip('/') / 'index.html').is_file())

        # A bad pasted command must report its source, not silently ship broken math.
        self.store.save({'kind': 'publications', 'slug': 'sample-paper',
                         'revision': self.store.get('sample-paper', 'publications')['revision'],
                         'data': {'abstract': r'Invalid: $\notarealcommand{x}$'}})
        result = subprocess.run(['hugo', '--source', str(self.root), '--destination', str(self.root / 'public'),
                                 '--cacheDir', str(self.root / 'cache'), '--panicOnWarning'], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Invalid LaTeX', result.stdout + result.stderr)
        self.assertIn('sample-paper.md', result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
