"""Exercise both personal-site paths through a real production Hugo build."""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from content_model import SCHEMA, iter_personal_pages
from check_site import check

HUGO = os.environ.get("HUGO_BIN") or shutil.which("hugo")


@unittest.skipUnless(HUGO, "Hugo is required for personal-site build tests")
class PersonalSiteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="msrg-personal-test-")
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name)
        for directory in ("content", "layouts", "assets", "static", "data"):
            shutil.copytree(ROOT / directory, self.project / directory)
        shutil.copy2(ROOT / "hugo.yaml", self.project / "hugo.yaml")
        self.output = self.project / "public"

    def build(self):
        return subprocess.run(
            [HUGO, "--source", str(self.project), "--destination", str(self.output),
             "--cacheDir", str(self.project / "cache"), "--minify", "--panicOnWarning"],
            capture_output=True, text=True)

    def test_standalone_site_is_unchanged_and_linked_from_rosters(self):
        folder = self.project / "static/~thomas-trenty"
        (folder / "assets").mkdir(parents=True)
        files = {
            "index.html": '<!doctype html>\n<html><head><title>My custom site</title>'
                          '<link rel="stylesheet" href="./assets/style.css"></head>'
                          '<body><div id="app"></div><a href="#/research">Research</a>'
                          '<script type="module" src="./assets/app.js"></script></body></html>\n',
            "assets/style.css": 'body { background: #123456; }\n',
            "assets/app.js": 'document.querySelector("#app").textContent = "My app";\n',
            "about/index.html": '<!doctype html><html><title>About</title><body>About me</body></html>',
        }
        for relative, content in files.items():
            path = folder / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for relative in files:
            self.assertEqual((self.output / "~thomas-trenty" / relative).read_bytes(),
                             (folder / relative).read_bytes())
        for relative in ("people", "research/quantum-computing-systems"):
            html = (self.output / relative / "index.html").read_text()
            self.assertRegex(html, r'href=["\']?/~thomas-trenty/["\']? aria-label=["\']Personal website')
        self.assertIn("thomas-trenty", [slug for _, slug, _ in iter_personal_pages(self.project)])
        self.assertEqual(check(self.output, self.project), [])

    def test_templates_infer_url_and_identity_from_member(self):
        folder = self.project / "content/personal/thomas-trenty"
        folder.mkdir()
        layouts = next(field["options"] for field in SCHEMA["types"]["personal"]["fields"] if field["key"] == "layout")
        for layout in layouts:
            with self.subTest(layout=layout):
                (folder / "index.md").write_text(f'+++\nlayout = "{layout}"\n+++\n\n## About\n\nMy research.\n')
                result = self.build()
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                html = (self.output / "~thomas-trenty/index.html").read_text()
                self.assertIn("<h1>Thomas Trenty</h1>", html)
                self.assertIn("<title>Thomas Trenty |", html)
                self.assertIn("My research.", html)
                if layout == "academic":
                    self.assertIn("thomas-trenty.jpg", html)
                    self.assertIn("PhD Student", html)
                self.assertEqual(check(self.output, self.project), [])

    def test_duplicate_standalone_and_template_url_fails_build(self):
        folder = self.project / "static/~grier-jones"
        folder.mkdir()
        (folder / "index.html").write_text("<!doctype html><title>Duplicate</title>")
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Choose either content/personal/grier-jones or static/~grier-jones", result.stdout + result.stderr)
