"""Verify contact privacy at editing, rendering, and deployment boundaries."""
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from content_model import defaults, validate_record
from check_site import Page
import test_personal_sites


class ContactValidationTests(unittest.TestCase):
    def test_university_addresses_and_empty_email_are_accepted(self):
        for email in ("", "member@utoronto.ca", "member@mail.utoronto.ca", "member@EEcg.UToronto.ca"):
            with self.subTest(email=email):
                self.assertEqual(validate_record("people", defaults("people") | {
                    "name": "Example Member", "slug": "example-member", "email": email}), [])

    def test_generated_page_audit_catches_private_addresses_and_wrong_link_targets(self):
        for markup in ('<p>member@gmail.com</p>', '<a href="mailto:member%40gmail.com">Email</a>',
                       '<a href="mailto:member@utoronto.ca">Email</a>',
                       '<a href="/~example/">Personal website</a>',
                       '<a href="https://example.com" aria-label="Personal website">Website</a>'):
            with self.subTest(markup=markup):
                self.assertTrue(Page("/", markup).contact_errors)
        self.assertFalse(Page("/", '<a href="mailto:member@utoronto.ca" target="_blank" '
                                  'rel="noopener noreferrer">Email</a>').contact_errors)
        self.assertFalse(Page("/", '<a href="https://example.org/~member/data.zip">Download</a>').contact_errors)


@unittest.skipUnless(test_personal_sites.HUGO, "Hugo is required for contact rendering tests")
class ContactRenderingTests(unittest.TestCase):
    setUp = test_personal_sites.PersonalSiteTests.setUp
    build = test_personal_sites.PersonalSiteTests.build

    def test_private_profile_addresses_are_hidden_even_if_the_editor_is_bypassed(self):
        cases = ("member@gmail.com", "member@utoronto.ca.example.com", "member@notutoronto.ca",
                 "member@utoronto.ca", "member@mail.utoronto.ca")
        for i, email in enumerate(cases):
            (self.project / f"content/people/contact-{i}.md").write_text(
                f'+++\nname = "Contact {i}"\nslug = "contact-{i}"\nrole = "PhD Student"\n'
                f'status = "current"\nemail = "{email}"\nresearch = ["data-management"]\n+++\n')
        personal = self.project / "content/personal/grier-jones/index.md"
        personal.write_text(personal.read_text() + '\n[Email me](mailto:member@utoronto.ca) '
                            '[Personal website](/~grier-jones/)\n')
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        html = (self.output / "people/index.html").read_text()
        for email in cases[:3]:
            self.assertNotIn(email, html)
        for email in cases[3:]:
            self.assertIn(f"mailto:{email}", html)
        for path in self.output.rglob("*.html"):
            self.assertFalse(Page(str(path), path.read_text()).contact_errors, path)
