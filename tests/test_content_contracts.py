from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from content_model import (SCHEMA, iter_people_pages, iter_personal_pages,
                           iter_publication_pages, load_toml_front_matter, validate_record)


class ContentContractTests(unittest.TestCase):
    def test_people_discovery_is_nonempty_and_has_unique_slugs(self) -> None:
        records = iter_people_pages()
        self.assertTrue(records, "People checks must not silently inspect zero profiles")
        slugs = [slug for _, slug, _ in records]
        self.assertEqual(len(slugs), len(set(slugs)), "Duplicate flat and bundled profiles")

    def test_content_has_no_publication_gates(self) -> None:
        for path in (ROOT / "archetypes").glob("*"):
            gates = "|".join(map(re.escape, SCHEMA["forbidden_fields"]))
            self.assertNotRegex(path.read_text(), rf"(?im)^\s*({gates})\s*=", str(path))
        for path in (ROOT / "content").rglob("*"):
            if path.suffix not in {".md", ".html"}:
                continue
            data = {key.lower(): value for key, value in load_toml_front_matter(path).items()}
            with self.subTest(path=path):
                for field in SCHEMA["forbidden_fields"]:
                    self.assertNotIn(field, data, "Keep unfinished content on a Git branch")

    def test_people_follow_shared_schema(self) -> None:
        for path, slug, data in iter_people_pages():
            with self.subTest(path=path):
                self.assertEqual(validate_record("people", data, slug), [])

    def test_personal_pages_have_matching_people_page_and_expected_url(self) -> None:
        people_slugs = {slug for _path, slug, _data in iter_people_pages()}
        failures: list[str] = []
        seen = set()

        for path, slug, data in iter_personal_pages():
            if slug in seen:
                failures.append(f"{path}: choose either a template page or a standalone site for {slug}")
            seen.add(slug)
            if slug not in people_slugs:
                failures.append(f"{path}: no matching people page for {slug}")

            failures.extend(f"{path}: {error}" for error in validate_record("personal", data, slug))

        if failures:
            self.fail("Personal page contract issues:\n- " + "\n- ".join(failures))

    def test_publications_follow_shared_schema(self) -> None:
        for path, data in iter_publication_pages():
            with self.subTest(path=path):
                self.assertEqual(validate_record("publications", data), [])

    def test_datasets_follow_shared_schema(self) -> None:
        for path in (ROOT / "content/data-sets").glob("*.md"):
            if path.name != "_index.md":
                with self.subTest(path=path):
                    self.assertEqual(validate_record("data-sets", load_toml_front_matter(path)), [])

    def test_research_and_related_content_references_exist(self) -> None:
        areas = {path.parent.name for path in (ROOT / "content/research").glob("*/_index.md")}
        publications = {path.stem for path, _ in iter_publication_pages()}
        datasets = {path.stem for path in (ROOT / "content/data-sets").glob("*.md") if path.stem != "_index"}
        for path in (ROOT / "content").rglob("*.md"):
            data = load_toml_front_matter(path)
            with self.subTest(path=path):
                for area in data.get("research", []):
                    self.assertIn(area, areas)
                for dataset in data.get("related_datasets", []):
                    self.assertIn(dataset, datasets)
                if data.get("related_publication"):
                    self.assertIn(data["related_publication"], publications)
                for download in data.get("downloads", []):
                    self.assertTrue(download.get("label"))
                    parsed = urlsplit(download.get("url", ""))
                    if not parsed.scheme and not parsed.netloc:
                        self.assertTrue(parsed.path.startswith("/downloads/"))
                        target = (ROOT / "static" / parsed.path.lstrip("/")).resolve()
                        self.assertTrue(target.is_relative_to((ROOT / "static/downloads").resolve()))
                        self.assertTrue(target.is_file())
                    else:
                        self.assertIn(parsed.scheme, {"http", "https"})
                        self.assertTrue(parsed.netloc)


if __name__ == "__main__":
    unittest.main()
