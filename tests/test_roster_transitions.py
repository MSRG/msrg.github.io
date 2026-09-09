"""Build the real templates at fixed times to check scheduled alumni transitions."""
from __future__ import annotations

import os
import json
from html import unescape
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUGO = os.environ.get("HUGO_BIN") or shutil.which("hugo")


@unittest.skipUnless(HUGO, "Hugo is required for roster build tests")
class RosterTransitionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="msrg-roster-test-")
        cls.project = Path(cls.temp.name)
        for directory in ("content", "layouts", "assets", "static", "data", "archetypes"):
            shutil.copytree(ROOT / directory, cls.project / directory)
        shutil.copy2(ROOT / "hugo.yaml", cls.project / "hugo.yaml")
        cls.groups = json.loads((ROOT / "data/content_schema.json").read_text())["types"]["people"]["groups"]
        cls.roles = [role for group in cls.groups for role in group["roles"]]
        cls.fixtures = {}
        for i, role in enumerate(cls.roles):
            cls.add_member(f"visitor-{i}", role, "visiting", "2026-08")
        cls.add_member("regular", "PhD Student", "current", "2026-08")
        cls.add_member("permanent", "PhD Student", "current", "")
        cls.add_member("manual", "PhD Student", "alumni", "2030-12")
        cls.add_member("manual-visitor", "Undergraduate Student", "alumni", "2023", visiting=True)
        award_member = cls.project / "content/people/test-manual-visitor.md"
        award_member.write_text(award_member.read_text().replace('\n+++\n',
            '\nemail = "visitor@mail.utoronto.ca"\n'
            'homepage = "https://example.org/visitor/"\n'
            'awards = [{ name = "Research award", url = "https://example.org/award", '
            'funding_url = "https://example.org/apply" }]\n+++\n'))
        cls.add_member("day", "PhD Student", "current", "2026-08-15")
        cls.add_member("year", "PhD Student", "current", "2026")
        cls.add_member("leap", "PhD Student", "current", "2028-02")

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    @classmethod
    def add_member(cls, slug, role, status, end, visiting=False, start=None):
        slug = "test-" + slug
        cls.fixtures[slug] = (role, status, end)
        start_field = f'start_date = "{start}"\n' if start is not None else ""
        (cls.project / "content/people" / (slug + ".md")).write_text(
            f'+++\nname = "{slug}"\nslug = "{slug}"\nrole = "{role}"\n'
            f'status = "{status}"\nend_date = "{end}"\n'
            f'visiting = {str(visiting).lower()}\n'
            + start_field +
            'research = ["quantum-computing-systems"]\n+++\n'
        )

    def test_unknown_start_dates_follow_dated_members(self):
        for status in ("current", "visiting"):
            for suffix, start in (("late", "2025-09"), ("early", "2020-09"), ("blank", ""), ("missing", None)):
                self.add_member(f"order-{status}-{suffix}", "PhD Student", status, "", start=start)
        roster, research = self.build("2026-09-08T12:00:00-04:00")
        for status in ("current", "visiting"):
            pages = (roster, research)
            for html in pages:
                positions = {suffix: html.index(f'id="member-test-order-{status}-{suffix}"')
                             for suffix in ("early", "late", "blank", "missing")}
                self.assertLess(positions["early"], positions["late"])
                self.assertLess(positions["late"], positions["blank"])
                self.assertLess(positions["late"], positions["missing"])

    def test_alumni_sort_by_end_then_start_with_unknown_dates_last(self):
        cases = [
            ('newest', '2025', '2018'),
            ('same-end-later-start', '2024-06', '2022'),
            ('same-end-earlier-start', '2024-06', '2020'),
            ('same-end-blank-start', '2024-06', ''),
            ('older', '2023', '2022'),
            ('blank-end', '', '2022'),
            ('missing-end', None, None),
        ]
        for visiting in (False, True):
            for suffix, end, start in cases:
                slug = f'alumni-order-{visiting}-{suffix}'
                self.add_member(slug, 'PhD Student', 'alumni', end or '', visiting=visiting, start=start)
                if end is None:
                    path = self.project / 'content/people' / f'test-{slug}.md'
                    path.write_text(path.read_text().replace('end_date = ""\n', ''))
        roster, _ = self.build('2026-09-09T12:00:00-04:00')
        for visiting in (False, True):
            positions = [roster.index(f'id="member-test-alumni-order-{visiting}-{suffix}"')
                         for suffix, _, _ in cases]
            self.assertEqual(positions, sorted(positions))
        # Visitors and regular alumni share one chronological role group.
        positions_by_date = [[roster.index(f'id="member-test-alumni-order-{visiting}-{suffix}"')
                              for visiting in (False, True)] for suffix, _, _ in cases]
        for earlier, later in zip(positions_by_date, positions_by_date[1:]):
            self.assertLess(max(earlier), min(later))

    def build(self, clock):
        result = subprocess.run(
            [HUGO, "--source", str(self.project), "--destination", str(self.project / "public"),
             "--cacheDir", str(self.project / "cache"), "--clock", clock, "--panicOnWarning"],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return ((self.project / "public/people/index.html").read_text(),
                (self.project / "public/research/quantum-computing-systems/index.html").read_text())

    def assert_placement(self, html, slug, active):
        member = "member-test-" + slug
        self.assertEqual(html.count(f'id="{member}"'), 1, member)
        tag = "article" if active else "li"
        self.assertRegex(html, rf'<{tag}\b[^>]*id="{member}"')

    def test_month_boundary_visitor_roles_and_research_roster(self):
        # UTC September 1 is still August 31 in Toronto until 04:00 UTC.
        before, research_before = self.build("2026-09-01T03:59:59Z")
        after, research_after = self.build("2026-09-01T04:00:00Z")
        for html in (before, after):
            self.assert_placement(html, "permanent", True)
            self.assert_placement(html, "manual", False)
            self.assert_placement(html, "manual-visitor", False)
        self.assert_placement(before, "regular", True)
        self.assert_placement(after, "regular", False)
        self.assertIn('id="member-test-regular"', research_before)
        self.assertNotIn('id="member-test-regular"', research_after)
        for i, role in enumerate(self.roles):
            group = next(group for group in self.groups if role in group["roles"])
            self.assert_placement(before, f"visitor-{i}", True)
            self.assert_placement(after, f"visitor-{i}", False)
            for html in (before, research_before):
                self.assert_placement(html, f"visitor-{i}", True)
                prefix = html.split(f'id="member-test-visitor-{i}"')[0]
                heading = re.findall(r'<h2\b.*?</h2>', prefix, re.S)[-1]
                self.assertIn(group["heading"], unescape(heading))
                self.assertIn(group["subtitle"], unescape(heading))
                card = re.search(rf'<article\b[^>]*id="member-test-visitor-{i}".*?</article>', html, re.S)[0]
                self.assertIn("Visiting researcher", card)
            heading = re.findall(r'<h3\b.*?</h3>', after.split(f'id="member-test-visitor-{i}"')[0], re.S)[-1]
            self.assertIn(group["alumni"], unescape(heading))
            self.assertNotIn(f'id="member-test-visitor-{i}"', research_after)
        for html in (before, after, research_before, research_after):
            self.assertNotIn("Visiting Researchers", html)
        row = re.search(r'<li\b[^>]*id="member-test-manual-visitor".*?</li>', after, re.S)[0]
        self.assertIn("Visiting researcher", row)
        labels = re.findall(r'aria-label="([^"]+)"', row)
        self.assertEqual(labels[:2], ["Award: Research award", "Research funding opportunities"])
        self.assertIn("Email", labels[2:])
        self.assertIn("Personal website", labels[2:])

    def test_day_year_and_leap_month_are_inclusive(self):
        cases = [
            ("day", "2026-08-15T23:59:59-04:00", "2026-08-16T00:00:00-04:00"),
            ("year", "2026-12-31T23:59:59-05:00", "2027-01-01T00:00:00-05:00"),
            ("leap", "2028-02-29T23:59:59-05:00", "2028-03-01T00:00:00-05:00"),
        ]
        for slug, before, after in cases:
            with self.subTest(slug=slug):
                self.assert_placement(self.build(before)[0], slug, True)
                self.assert_placement(self.build(after)[0], slug, False)

    def test_archetypes_read_schema_fields_and_current_role_choices(self):
        import tomllib
        for kind, relative in (("people", "people/schema-example.md"),
                               ("publications", "publications/schema-example.md"),
                               ("personal", "personal/schema-example/index.md")):
            with self.subTest(kind=kind):
                path = self.project / "content" / relative
                try:
                    result = subprocess.run(
                        [HUGO, "new", "content", relative, "--source", str(self.project)],
                        capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    text = path.read_text()
                    data = tomllib.loads(text.split('+++')[1])
                    schema = json.loads((self.project / "data/content_schema.json").read_text())["types"][kind]
                    for field in schema["fields"]:
                        if field.get("archetype", True):
                            self.assertIn(field["key"], data)
                    if kind == "people":
                        self.assertEqual(data["slug"], "schema-example")
                        self.assertEqual(data["name"], "Schema Example")
                        for role in self.roles:
                            self.assertIn(role, text)
                finally:
                    path.unlink(missing_ok=True)

    def test_schema_change_reaches_archetype_and_roster_without_template_edits(self):
        import tomllib
        schema_path = self.project / "data/content_schema.json"
        original = schema_path.read_text()
        path = self.project / "content/people/schema-extension.md"
        try:
            schema = json.loads(original)
            schema["types"]["people"]["fields"].append({
                "key": "example_field", "type": "string", "default": "From the schema"})
            group = dict(schema["types"]["people"]["groups"][0])
            group.update(id="example", roles=["Example Fellow"], heading="Example fellows")
            schema["types"]["people"]["groups"].append(group)
            schema_path.write_text(json.dumps(schema))
            result = subprocess.run([HUGO, "new", "content", "people/schema-extension.md",
                                     "--source", str(self.project)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            text = path.read_text()
            self.assertEqual(tomllib.loads(text.split('+++')[1])["example_field"], "From the schema")
            self.assertIn('Example Fellow', text)
            # Change only fixture data; the production templates stay untouched.
            text = re.sub(r"(?m)^role = .*$", 'role = "Example Fellow"', text)
            path.write_text(text)
            roster, _ = self.build("2026-09-08T12:00:00-04:00")
            self.assertIn('id="member-schema-extension"', roster)
            self.assertIn('Example fellows', roster)
        finally:
            schema_path.write_text(original)
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
