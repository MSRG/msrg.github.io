from __future__ import annotations

from pathlib import Path
import sys
import tempfile
import unittest
import tomllib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from content_model import FRONT_MATTER, defaults, update_profile_text
from edit_profiles import Conflict, ProfileStore


class ProfileEditorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "content/people").mkdir(parents=True)
        self.store = ProfileStore(self.root)

    def sample(self, slug="jane-doe"):
        return defaults("people") | {"name": 'Jane "J" Doe', "slug": slug}

    def test_create_edit_and_preserve_unknown_fields_comments_and_body(self):
        data = self.sample()
        result = self.store.save({"slug": data["slug"], "data": data, "revision": None})
        path = self.root / result["path"]
        text = path.read_text().replace('+++\n', '+++\n# Keep this source note.\n', 1)
        text = text.replace('\n+++\n', '\ncustom_field = ["Keep me"]\n+++\nAn existing biography.\n')
        path.write_text(text)
        opened = self.store.get(data["slug"])
        self.store.save({"slug": data["slug"], "revision": opened["revision"], "data": {
            "name": "Jane Doe", "role": "MSc Student", "interests": ["Quantum Computing"],
            "awards": [{"name": 'Award "A"', "url": "https://example.org/award", "funding_url": ""}]}})
        updated = path.read_text()
        self.assertIn('# Keep this source note.', updated)
        self.assertTrue(updated.endswith('An existing biography.\n'))
        final = self.store.get(data["slug"])["data"]
        self.assertEqual(final["custom_field"], ["Keep me"])
        self.assertEqual(final["role"], "MSc Student")
        self.assertEqual(final["awards"][0]["name"], 'Award "A"')

    def test_stale_edits_and_duplicate_creations_are_rejected(self):
        data = self.sample()
        result = self.store.save({"slug": data["slug"], "data": data, "revision": None})
        with self.assertRaises(Conflict):
            self.store.save({"slug": data["slug"], "data": data, "revision": None})
        path = self.root / result["path"]
        path.write_text(path.read_text() + '\n# Updated elsewhere\n')
        with self.assertRaises(Conflict):
            self.store.save({"slug": data["slug"], "data": data, "revision": result["revision"]})

    def test_invalid_role_dates_links_and_paths_cannot_be_saved(self):
        for update in [{"role": "Unsupported degree"}, {"status": "unknown"},
                       {"end_date": "2026-02-30"}, {"start_date": "2026-13"},
                       {"linkedin": "https://linkedin.com.example.org/user"},
                       {"email": "member@gmail.com"}, {"email": "member@my.yorku.ca"},
                       {"email": "member@utoronto.ca.example.com"}, {"email": "member@notutoronto.ca"},
                       {"email": "member@utoronto.ca?bcc=other@gmail.com"},
                       {"homepage": "javascript:alert(1)"}, {"portrait": "/../../README.md"}]:
            with self.subTest(update=update), self.assertRaises(ValueError):
                self.store.save({"slug": "jane-doe", "data": self.sample() | update})
        for slug in ["../outside", "_index", "jane/doe", ""]:
            with self.subTest(slug=slug), self.assertRaises(ValueError):
                self.store.save({"slug": slug, "data": self.sample(slug)})
        self.assertEqual(list((self.root / "content/people").iterdir()), [])

    def test_multiline_strings_and_arrays_are_updated_without_losing_metadata(self):
        original = '''+++
name = """A name
with multiple lines"""
interests = [
  "One",
  "Two", # keep valid TOML
]
# Preserve unrelated comments and values.
custom = { name = "Extra", value = 1 }
+++
Body text.
'''
        updated = update_profile_text(original, {"name": "Renamed", "interests": ["Three"]})
        parsed = tomllib.loads(FRONT_MATTER.match(updated)[1])
        self.assertEqual(parsed["name"], "Renamed")
        self.assertEqual(parsed["interests"], ["Three"])
        self.assertEqual(parsed["custom"], {"name": "Extra", "value": 1})
        self.assertIn('# Preserve unrelated comments', updated)
        self.assertTrue(updated.endswith('Body text.\n'))

    def test_every_existing_profile_can_round_trip_unchanged(self):
        from content_model import iter_people_pages
        for path, slug, data in iter_people_pages():
            with self.subTest(slug=slug):
                updated = update_profile_text(path.read_text(), data)
                self.assertEqual(tomllib.loads(FRONT_MATTER.match(updated)[1]), data)
                self.assertEqual(updated, path.read_text())


if __name__ == "__main__":
    unittest.main()
