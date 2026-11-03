"""Published and preprint links remain distinct through editing and rendering."""
from __future__ import annotations

from html.parser import HTMLParser
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from edit_profiles import ProfileStore

HUGO = os.environ.get("HUGO_BIN") or shutil.which("hugo")
PUBLISHED = "https://doi.org/10.1234/example"
PREPRINT = "https://arxiv.org/abs/2601.01234"


class PublicationVersionEditorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = ProfileStore(self.root)

    def create(self, **links):
        return self.store.save({"kind": "publications", "data": {
            "title": "Versioned Paper", "authors": ["Example Author"], "year": 2026,
            "venue": "Example Conference (accepted)", "publication_type": "Conference Paper",
            **links}})

    def read(self):
        return self.store.get("versioned-paper", "publications", include_preview=False)

    def edit(self, **data):
        return self.store.save({"kind": "publications", "slug": "versioned-paper",
                                "revision": self.read()["revision"], "data": data})

    def test_preprint_can_gain_a_published_version_and_either_link_can_be_removed(self):
        self.create(preprint_url=PREPRINT)
        self.assertNotIn("external_url", self.read()["data"])
        self.assertEqual(self.read()["data"]["publication_type"], "Conference Paper")
        self.edit(external_url=PUBLISHED)
        self.assertEqual(self.read()["data"]["preprint_url"], PREPRINT)
        self.edit(preprint_url="")
        self.assertEqual(self.read()["data"]["external_url"], PUBLISHED)
        self.edit(external_url="", preprint_url=PREPRINT)
        self.assertEqual(self.read()["data"]["preprint_url"], PREPRINT)
        before = self.store.path("versioned-paper", "publications").read_bytes()
        with self.assertRaisesRegex(ValueError, "provide a published / official URL"):
            self.edit(preprint_url="")
        self.assertEqual(self.store.path("versioned-paper", "publications").read_bytes(), before)

    def test_no_link_or_whitespace_cannot_create_a_record(self):
        for links in ({}, {"external_url": "", "preprint_url": ""},
                      {"external_url": "  ", "preprint_url": "\n"}):
            with self.subTest(links=links), self.assertRaises(ValueError):
                self.create(**links)
            self.assertFalse(self.store.path("versioned-paper", "publications").exists())

    def test_unrelated_edit_preserves_absent_preprint_field_and_existing_provenance(self):
        self.create(external_url=PUBLISHED)
        path = self.store.path("versioned-paper", "publications")
        original = path.read_text().replace("external_url =", "# Published source provenance.\nexternal_url =")
        original += "\nKeep these explanatory notes.\n"
        path.write_text(original)
        self.edit(venue="Published Conference")
        self.assertEqual(path.read_text(), original.replace("Example Conference (accepted)", "Published Conference"))
        self.assertNotIn("preprint_url", self.read()["data"])
        self.edit(preprint_url=PREPRINT)
        self.assertIn("# Published source provenance.\n", path.read_text())
        self.assertTrue(path.read_text().endswith("Keep these explanatory notes.\n"))

    def test_bad_preprint_urls_and_duplicate_links_are_rejected_without_writing(self):
        self.create(external_url=PUBLISHED)
        path = self.store.path("versioned-paper", "publications")
        before = path.read_bytes()
        for url in ("javascript:alert(1)", "//arxiv.org/abs/2601.01234", "https://",
                    "https://example.org:broken/paper", "https://example.org/a b", PUBLISHED):
            with self.subTest(url=url), self.assertRaises(ValueError):
                self.edit(preprint_url=url)
            self.assertEqual(path.read_bytes(), before)

    def test_arxiv_links_belong_in_the_preprint_field_including_arxiv_dois(self):
        for url in (PREPRINT, "https://export.arxiv.org/pdf/2601.01234",
                    "https://ARXIV.ORG/abs/2601.01234", "https://doi.org/10.48550/arXiv.2601.01234"):
            with self.subTest(url=url), self.assertRaisesRegex(ValueError, "put arXiv links in Preprint URL"):
                self.create(external_url=url)
            self.assertFalse(self.store.path("versioned-paper", "publications").exists())
        self.create(preprint_url="https://example.org/manuscript.pdf")
        self.assertEqual(self.read()["data"]["preprint_url"], "https://example.org/manuscript.pdf")


class ActionLinks(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.active = False
        self.links = []
        self.link = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "p" and "publication-links" in attrs.get("class", "").split():
            self.active = True
        if tag == "a" and self.active:
            self.link = {"url": attrs["href"], "classes": attrs.get("class", "").split(), "text": ""}

    def handle_data(self, text):
        if self.link is not None:
            self.link["text"] += text

    def handle_endtag(self, tag):
        if tag == "a" and self.link is not None:
            self.links.append(self.link)
            self.link = None
        if tag == "p":
            self.active = False


@unittest.skipUnless(HUGO, "Hugo is required for publication version rendering")
class PublicationVersionRenderingTests(unittest.TestCase):
    def test_versions_and_source_fallback_are_labeled_on_paper_and_research_pages(self):
        with tempfile.TemporaryDirectory(prefix="msrg-versions-") as tmp:
            root = Path(tmp)
            for directory in ("content", "layouts", "assets", "static", "data", "archetypes"):
                shutil.copytree(ROOT / directory, root / directory)
            shutil.copy2(ROOT / "hugo.yaml", root / "hugo.yaml")
            store = ProfileStore(root)
            examples = [
                ("Both versions", {"external_url": PUBLISHED, "preprint_url": PREPRINT},
                 [(PUBLISHED, "Published version"), (PREPRINT, "Preprint (arXiv)")]),
                ("Published only", {"external_url": "https://openreview.net/forum?id=conference"},
                 [("https://openreview.net/forum?id=conference", "Published version")]),
                ("Accepted preprint only", {"preprint_url": PREPRINT}, [(PREPRINT, "Preprint (arXiv)")]),
                ("Official workshop copy", {"external_url": "https://openreview.net/forum?id=workshop",
                                            "publication_type": "Workshop Paper"},
                 [("https://openreview.net/forum?id=workshop", "Workshop version")]),
                ("Similar hostname", {"preprint_url": "https://arxiv.org.example.com/paper"},
                 [("https://arxiv.org.example.com/paper", "Preprint")]),
                ("Official record", {"external_url": "https://dblp.org/rec/example"},
                 [("https://dblp.org/rec/example", "Publication record")]),
            ]
            expected = []
            for title, links, labels in examples:
                saved = store.save({"kind": "publications", "data": {
                    "title": title, "authors": ["Example Author"], "year": 2030,
                    "venue": "Example Conference (accepted)", "publication_type": "Conference Paper",
                    "research": ["rca-aiops"], **links}})
                expected.append((saved["slug"], links, labels))
            build = subprocess.run([HUGO, "--source", str(root), "--destination", str(root / "public"),
                                    "--cacheDir", str(root / "cache"), "--panicOnWarning"],
                                   capture_output=True, text=True)
            self.assertEqual(build.returncode, 0, build.stdout + build.stderr)
            research = (root / "public/research/rca-aiops/index.html").read_text()
            research_links = ActionLinks(research).links
            self.assertEqual(len(research_links), 7, "Six recent papers: five single links and one pair")
            for slug, links, labels in expected:
                html = (root / "public/publications" / slug / "index.html").read_text()
                rendered = ActionLinks(html).links
                self.assertEqual([(link["url"], link["text"]) for link in rendered], labels)
                for url, label in labels:
                    self.assertTrue(any(link["url"] == url and link["text"] == label for link in research_links))
                if links.get("preprint_url"):
                    self.assertIn("button-secondary", rendered[-1]["classes"])
                    self.assertIn("publication-preprint", rendered[-1]["classes"])
                    for link in research_links:
                        if link["url"] == links["preprint_url"]:
                            self.assertIn("publication-preprint", link["classes"])
                if links.get("external_url") and links.get("preprint_url"):
                    self.assertNotIn("button-secondary", rendered[0]["classes"])
                if not links.get("external_url"):
                    self.assertIn("Read the abstract and full preprint at the source.", html)
                    self.assertNotIn("Read the abstract and full publication at the source.", html)


if __name__ == "__main__":
    unittest.main()
