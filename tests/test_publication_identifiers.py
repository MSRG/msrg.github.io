from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from content_model import defaults, update_profile_text
from edit_profiles import Conflict, ProfileStore


class PublicationIdentifierTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = ProfileStore(self.root)

    def create(self, title, **payload):
        return self.store.save({'kind': 'publications', 'data': defaults('publications') | {
            'title': title, 'authors': ['Jane Doe'], 'year': 2026,
            'venue': 'Conference', 'external_url': 'https://example.org/paper'}, **payload})

    def rename(self, slug, title):
        record = self.store.get(slug, 'publications')
        return self.store.save({'kind': 'publications', 'slug': slug, 'revision': record['revision'],
                                'data': {'title': title}})

    def test_original_title_determines_read_only_identifier(self):
        result = self.create('Café: A New Paper!', slug='custom-name')
        self.assertEqual(result['slug'], 'cafe-a-new-paper')
        self.assertEqual(result['path'], 'content/publications/cafe-a-new-paper.md')
        self.assertFalse(self.store.path('custom-name', 'publications').exists())
        record = self.store.get(result['slug'], 'publications')
        for field in ['slug', 'url', 'aliases']:
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, 'Unknown editor field'):
                self.store.save({'kind': 'publications', 'slug': result['slug'], 'revision': record['revision'],
                                 'data': {field: 'custom-name'}})
        with self.assertRaisesRegex(ValueError, 'Only member identifiers'):
            self.store.save({'kind': 'publications', 'slug': 'custom-name', 'original_slug': result['slug'],
                             'revision': record['revision'], 'data': {'title': 'Changed'}})

    def test_numbered_conflicts_include_simultaneous_creates(self):
        first = self.create('Same paper')
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: self.create('Same paper'), range(2)))
        self.assertEqual({result['slug'] for result in results}, {'same-paper-2', 'same-paper-3'})
        self.assertEqual(self.store.get('same-paper', 'publications')['revision'], first['revision'])

    def test_title_aliases_keep_original_url_and_avoid_other_pages(self):
        self.create('Original title', body='\nKeep these notes.\n')
        self.create('Revised title')
        self.rename('original-title', 'Revised title')
        record = self.store.get('original-title', 'publications')
        self.assertEqual(record['preview'], '/publications/original-title/')
        self.assertEqual(record['data']['aliases'], ['/publications/revised-title-2/'])
        self.assertEqual(record['body'], '\nKeep these notes.\n')
        self.rename('original-title', 'Third title')
        self.rename('original-title', 'Revised title')
        self.rename('original-title', 'Original title')
        self.assertEqual(self.store.get('original-title', 'publications')['data']['aliases'],
                         ['/publications/revised-title-2/', '/publications/third-title/'])
        self.assertEqual(self.create('Revised title')['slug'], 'revised-title-3')
        self.assertEqual(self.create('Third title')['slug'], 'third-title-2')

    def test_existing_aliases_explicit_urls_and_static_pages_are_reserved(self):
        self.create('Existing')
        path = self.store.path('existing', 'publications')
        path.write_text(update_profile_text(path.read_text(), {
            'url': '/publications/taken/', 'aliases': ['/publications/taken-2/index.html/']}))
        static = self.root / 'static/publications/taken-3/index.html'
        static.parent.mkdir(parents=True)
        static.write_text('Existing static page')
        self.assertEqual(self.create('Taken')['slug'], 'taken-4')
        self.rename('existing', 'New title')
        record = self.store.get('existing', 'publications')
        self.assertEqual(record['preview'], '/publications/taken/')
        self.assertEqual(record['data']['aliases'], ['/publications/taken-2/index.html/', '/publications/new-title/'])

    def test_stale_edits_do_not_rename_overwrite_or_create_a_duplicate(self):
        first = self.create('Paper')
        self.rename('paper', 'Updated')
        saved = self.store.path('paper', 'publications').read_text()
        with self.assertRaises(Conflict):
            self.store.save({'kind': 'publications', 'slug': 'paper', 'revision': first['revision'],
                             'data': {'title': 'Stale'}})
        self.assertEqual(self.store.path('paper', 'publications').read_text(), saved)
        self.assertEqual(len(self.store.records('publications')), 1)

    def test_generated_identifiers_handle_empty_slugs_long_titles_and_reserved_names(self):
        for title, expected in [('量子', 'publication'), ('!!!', 'publication-2'),
                                ('Index', 'index-2'), ('Page', 'page-2'), ('a' * 300, 'a' * 180)]:
            with self.subTest(title=title):
                self.assertEqual(self.create(title)['slug'], expected)
        with self.assertRaisesRegex(ValueError, 'title: required'):
            self.create(' ')

    def test_creation_date_is_hidden_and_existing_metadata_is_preserved(self):
        config = self.store.schema('publications')
        self.assertNotIn('date', {field['key'] for field in config['schema']['fields']})
        self.assertNotIn('date', config['defaults'])
        self.create('Paper')
        path = self.store.path('paper', 'publications')
        self.assertNotIn('date', self.store.get('paper', 'publications')['data'])
        path.write_text(update_profile_text(path.read_text(), {'date': '2024-02-29', 'custom': 'Retain'}))
        self.rename('paper', 'Revised')
        record = self.store.get('paper', 'publications')
        self.assertEqual(record['data']['date'], '2024-02-29')
        self.assertEqual(record['data']['custom'], 'Retain')


if __name__ == '__main__':
    unittest.main()
