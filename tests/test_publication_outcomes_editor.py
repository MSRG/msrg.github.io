from __future__ import annotations

from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from edit_profiles import Conflict, ProfileStore


class PublicationOutcomesEditorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = ProfileStore(self.root)

    def paper(self, title='Example Paper'):
        return {'title': title, 'authors': ['Example Author'], 'year': 2026,
                'venue': 'Example Conference', 'publication_type': 'Conference Paper',
                'external_url': 'https://example.org/paper'}

    def outcome(self, **changes):
        return {'title': 'Public benchmark', 'url': 'https://example.org/benchmark',
                'summary': 'Sample data and evaluation scripts.\nIncludes "quoted" labels and Unicode: α.'} | changes

    def create(self, **changes):
        return self.store.save({'kind': 'publications', 'data': self.paper() | changes})

    def reopen(self):
        return self.store.get('example-paper', 'publications', include_preview=False)

    def save(self, changes, revision=None):
        return self.store.save({'kind': 'publications', 'slug': 'example-paper',
                                'revision': revision or self.reopen()['revision'], 'data': changes})

    def files(self):
        return {path.relative_to(self.root): path.read_bytes()
                for path in self.root.rglob('*') if path.is_file()}

    def legacy_paper(self):
        self.create()
        path = self.store.path('example-paper', 'publications')
        source = path.read_text().replace('+++\n', '+++\n# Verified citation source.\n', 1)
        source = source.replace('\n+++\n', '\ncustom_metadata = { owner = "Example", reviewed = true }\n+++\n')
        source += '\n## Additional notes\nKeep this publication body and [source](https://example.org/source).\n'
        path.write_text(source)
        return path, source

    def test_schema_exposes_optional_repeatable_outcomes_without_requiring_research(self):
        schema = self.store.schema('publications')
        fields = {field['key']: field for field in schema['schema']['fields']}
        outcomes = fields['research_outcomes']
        self.assertEqual(outcomes['type'], 'objects')
        self.assertEqual(schema['defaults']['research_outcomes'], [])
        self.assertEqual(outcomes['add_label'], 'Add research outcome')
        self.assertFalse(outcomes.get('required', False))
        self.assertFalse(fields['research'].get('required', False))
        self.assertEqual({child['key'] for child in outcomes['fields']}, {'title', 'url', 'summary'})
        self.assertTrue(all(child['required'] for child in outcomes['fields']))
        self.assertIn('this publication', outcomes['help'])
        self.assertIn('research areas', outcomes['help'])

    def test_create_reload_edit_and_remove_multiple_outcomes(self):
        outcomes = [self.outcome(), self.outcome(title='Project website', url='https://example.org/project')]
        self.create(research_outcomes=outcomes)
        self.assertEqual(self.reopen()['data']['research_outcomes'], outcomes)
        self.assertNotIn('research', self.reopen()['data'])
        self.assertEqual(list(self.files()), [Path('content/publications/example-paper.md')])
        edited = [outcomes[0] | {'title': 'Updated benchmark', 'summary': 'Revised public release.'}, outcomes[1]]
        self.save({'research_outcomes': edited})
        self.assertEqual(self.reopen()['data']['research_outcomes'], edited)
        self.save({'research_outcomes': edited[1:]})
        self.assertEqual(self.reopen()['data']['research_outcomes'], edited[1:])
        self.save({'research_outcomes': []})
        self.assertEqual(self.reopen()['data']['research_outcomes'], [])

    def test_legacy_publication_can_save_without_adding_optional_fields(self):
        path, source = self.legacy_paper()
        self.save({'venue': 'Revised Conference'})
        self.assertEqual(path.read_text(), source.replace('venue = "Example Conference"', 'venue = "Revised Conference"'))
        self.assertNotIn('research_outcomes', self.reopen()['data'])
        self.assertNotIn('research', self.reopen()['data'])

    def test_adding_and_removing_outcomes_preserves_body_comments_and_unknown_metadata(self):
        path, source = self.legacy_paper()
        original = self.reopen()
        self.save({'research_outcomes': [self.outcome()]})
        self.assertEqual(self.reopen()['data'], original['data'] | {'research_outcomes': [self.outcome()]})
        self.assertEqual(self.reopen()['body'], original['body'])
        self.assertIn('# Verified citation source.\n', path.read_text())
        provenance = '# Public artifact provenance: https://example.org/source\n'
        path.write_text(path.read_text().replace('research_outcomes = ', provenance + 'research_outcomes = '))
        revised = self.outcome(title='Revised public benchmark', summary='Updated release scope.')
        self.save({'research_outcomes': [revised]})
        self.assertEqual(self.reopen()['data'], original['data'] | {'research_outcomes': [revised]})
        self.assertEqual(self.reopen()['body'], original['body'])
        self.assertIn(provenance + 'research_outcomes = ', path.read_text())
        self.assertIn('# Verified citation source.\n', path.read_text())
        self.save({'research_outcomes': []})
        self.assertEqual(path.read_text(), source.replace('\n+++\n', '\n' + provenance + 'research_outcomes = []\n+++\n'))

    def test_unrelated_save_preserves_outcomes_and_their_source_comments_exactly(self):
        path, _ = self.legacy_paper()
        self.save({'research_outcomes': [self.outcome()]})
        source = path.read_text().replace('research_outcomes = [', '# Artifact provenance.\nresearch_outcomes = [\n  ')
        source = source.replace(' }]', ' }, # Keep this nested source note.\n]')
        path.write_text(source)
        outcomes = self.reopen()['data']['research_outcomes']
        self.save({'venue': 'Revised Conference'})
        expected = source.replace('venue = "Example Conference"', 'venue = "Revised Conference"')
        self.assertEqual(path.read_text(), expected)
        # The editor sends present fields even when their values have not changed.
        self.save({'venue': 'Another Conference', 'research_outcomes': outcomes})
        self.assertEqual(path.read_text(), expected.replace('Revised Conference', 'Another Conference'))

    def test_stale_revision_cannot_remove_or_overwrite_newer_outcomes(self):
        self.create(research_outcomes=[self.outcome()])
        stale = self.reopen()
        newer = [self.outcome(title='New public release', url='https://example.org/new')]
        self.save({'research_outcomes': newer})
        before = self.files()
        for changes in ({'research_outcomes': []}, {'research_outcomes': stale['data']['research_outcomes']}, {'venue': 'Stale edit'}):
            with self.subTest(changes=changes), self.assertRaises(Conflict):
                self.save(changes, revision=stale['revision'])
            self.assertEqual(self.files(), before)
        self.assertEqual(self.reopen()['data']['research_outcomes'], newer)

    def assert_rejected_without_write(self, outcomes):
        before = self.files()
        with self.assertRaises(ValueError):
            self.store.save({'kind': 'publications', 'data': self.paper('Invalid Paper') | {'research_outcomes': outcomes}})
        self.assertEqual(self.files(), before, 'An invalid new publication must not create a file')
        with self.assertRaises(ValueError):
            self.save({'research_outcomes': outcomes})
        self.assertEqual(self.files(), before, 'An invalid edit must not replace any existing file')

    def test_partial_and_invalid_nested_values_rejected_without_file_write(self):
        self.create(research_outcomes=[self.outcome()])
        invalid = [None, {}, 'not a list', [None], ['not an object'], [1], [{}],
                   [{'title': 'Missing fields'}],
                   [{'title': 'Missing URL', 'summary': 'Description'}],
                   [self.outcome(title='')], [self.outcome(title='  ')], [self.outcome(title=1)],
                   [self.outcome(url=None)], [self.outcome(url=[])],
                   [self.outcome(summary='')], [self.outcome(summary=' \n ')],
                   [self.outcome(summary=False)], [self.outcome(summary={})],
                   [self.outcome(), {'title': 'Incomplete second outcome'}]]
        for outcomes in invalid:
            with self.subTest(outcomes=outcomes):
                self.assert_rejected_without_write(outcomes)

    def test_unsafe_malformed_and_http_outcome_urls_rejected_without_file_write(self):
        self.create(research_outcomes=[self.outcome()])
        urls = ['', 'http://example.org/project', 'javascript:alert(1)', 'data:text/html,test',
                'file:///tmp/project', '//example.org/project', '/project/', 'not a URL',
                'https://', 'https:///project', 'https://example.org/a b',
                'https://example.org/a\nb', 'https://example.org/\x00project',
                'https://example.org\\project', 'https://exa%6dple.org/project',
                'https://example.org:invalid/project', 'https://example.org:70000/project',
                'https://[broken/project', 'https://user:password@example.org/project']
        for url in urls:
            with self.subTest(url=url):
                self.assert_rejected_without_write([self.outcome(url=url)])

    def test_valid_https_urls_and_plain_text_descriptions_round_trip(self):
        outcomes = [self.outcome(url=url) for url in (
            'https://github.com/example/benchmark',
            'https://example.org:8443/project?version=2&download=sample%20data#usage',
            'https://example.org/数据', 'https://[2001:db8::1]/project')]
        outcomes[0]['summary'] = 'Literal <tag>, **asterisks**, and $x^2$.\nPlain text stays intact.'
        self.create(research_outcomes=outcomes)
        self.assertEqual(self.reopen()['data']['research_outcomes'], outcomes)


if __name__ == '__main__':
    unittest.main()
