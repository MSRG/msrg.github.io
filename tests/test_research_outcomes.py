"""Exercise publication-owned outcomes through the editor store and real templates."""
from __future__ import annotations

from html import unescape
from html.parser import HTMLParser
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from edit_profiles import ProfileStore

HUGO = os.environ.get("HUGO_BIN") or shutil.which("hugo")
AIOPS = "distributed-machine-learning"
QUANTUM = "quantum-computing-systems"


class Links(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.hrefs = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.hrefs.append(dict(attrs).get("href"))


@unittest.skipUnless(HUGO, "Hugo is required for outcome rendering tests")
class ResearchOutcomeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="msrg-outcome-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ("content", "layouts", "assets", "static", "data", "archetypes"):
            shutil.copytree(ROOT / directory, self.root / directory)
        shutil.copy2(ROOT / "hugo.yaml", self.root / "hugo.yaml")
        self.store = ProfileStore(self.root)

    def outcome(self, name):
        return {"title": name, "url": f"https://example.org/outcomes/{name}",
                "summary": "Public evaluation scripts and sample data."}

    def paper(self, title, year, areas, outcomes=None):
        data = {"title": title, "year": year, "authors": ["Example Author"],
                "venue": "Example Conference", "publication_type": "Conference Paper",
                "external_url": "https://example.org/paper", "research": areas}
        if outcomes is not None:
            data["research_outcomes"] = outcomes
        result = self.store.save({"kind": "publications", "data": data})
        return result["slug"]

    def edit(self, slug, **changes):
        record = self.store.get(slug, "publications", include_preview=False)
        self.store.save({"kind": "publications", "slug": slug,
                         "revision": record["revision"], "data": changes})

    def build(self):
        result = subprocess.run(
            [HUGO, "--source", str(self.root), "--destination", str(self.root / "public"),
             "--cacheDir", str(self.root / "cache"), "--panicOnWarning"],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def page(self, route):
        return (self.root / "public" / route.strip("/") / "index.html").read_text()

    def section(self, html, identifier):
        match = re.search(rf'<section\b[^>]*\bid="{identifier}"[^>]*>(.*?)</section>', html, re.S)
        self.assertIsNotNone(match, f"Missing section {identifier}")
        return match[1]

    def assert_preview_limit(self, html):
        section = self.section(html, "publications")
        self.assertEqual(section.count('class="list-card"'), 6)
        return Links(section).hrefs

    def test_all_papers_supply_ordered_outcomes_independently_of_recent_citations(self):
        first = self.outcome("first") | {
            "title": '<b>Benchmark</b> & "examples"',
            "summary": '<script>alert("example")</script> is plain text, not executable markup.',
        }
        second = self.outcome("second")
        oldest = self.paper("Zebra old outcome paper", 2000, [AIOPS], [first, second])
        self.paper("Alpha old outcome paper", 2000, [AIOPS], [self.outcome("alphabetical")])
        self.paper("Newer outcome paper", 2001, [AIOPS], [self.outcome("newer")])
        unscoped = self.paper("Outcome without an area", 2000, [], [self.outcome("unscoped")])
        absent = self.paper("Paper without outcomes", 2000, [AIOPS])
        empty = self.paper("Paper with empty outcomes", 2000, [AIOPS], [])
        self.build()

        research = self.page("research/rca-aiops")
        outcomes = self.section(research, "outcomes")
        links = Links(outcomes).hrefs
        fixture_links = [url for url in links if url.startswith("https://example.org/outcomes/")]
        self.assertEqual(fixture_links, [self.outcome(name)["url"]
                                      for name in ("newer", "alphabetical", "first", "second")])
        owner_url = f"/publications/{oldest}/"
        self.assertEqual(links.count(owner_url), 2, "Both outputs link to their owning publication")
        self.assertNotIn(owner_url, self.assert_preview_limit(research), "The old paper must be outside the preview")
        self.assertNotIn(first["url"], self.page("research/quantum-computing-systems"))

        detail = self.section(self.page(f"publications/{oldest}"), "research-outcomes")
        for rendered in (outcomes, detail):
            self.assertNotIn("<script>", rendered)
            self.assertNotIn("<b>Benchmark</b>", rendered)
            self.assertIn(first["title"], unescape(rendered))
            self.assertIn(first["summary"], unescape(rendered))
        self.assertEqual(Links(detail).hrefs, [first["url"], second["url"]])
        self.assertIn(self.outcome("unscoped")["url"], self.section(
            self.page(f"publications/{unscoped}"), "research-outcomes"))
        for slug in (absent, empty):
            self.assertNotIn('id="research-outcomes"', self.page(f"publications/{slug}"))

    def test_editing_publication_keeps_association_and_moves_or_removes_outputs(self):
        first, second = self.outcome("keep"), self.outcome("remove")
        slug = self.paper("Original outcome paper", 2000, [AIOPS], [first, second])
        self.build()
        owner_url = f"/publications/{slug}/"
        self.assertIn(first["url"], self.section(self.page("research/rca-aiops"), "outcomes"))

        updated = first | {"title": "Renamed public benchmark", "url": "https://example.org/renamed"}
        self.edit(slug, title="Revised paper title", research=[QUANTUM], research_outcomes=[updated])
        self.build()
        self.assertNotIn(updated["url"], self.page("research/rca-aiops"))
        quantum = self.page("research/quantum-computing-systems")
        links = Links(self.section(quantum, "outcomes")).hrefs
        self.assertIn(updated["url"], links)
        self.assertIn(owner_url, links, "Title and research edits must not detach the related publication")
        self.assertNotIn(second["url"], quantum)
        self.assertNotIn(owner_url, self.assert_preview_limit(quantum))
        detail = self.page(f"publications/{slug}")
        self.assertIn("Revised paper title", detail)
        self.assertEqual(Links(self.section(detail, "research-outcomes")).hrefs, [updated["url"]])

        self.edit(slug, research_outcomes=[])
        self.build()
        self.assertNotIn('id="research-outcomes"', self.page(f"publications/{slug}"))
        self.assertNotIn(updated["url"], self.page("research/quantum-computing-systems"))


if __name__ == "__main__":
    unittest.main()
