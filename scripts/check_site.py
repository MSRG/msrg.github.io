"""Check a fresh Hugo build before uploading it to Pages (standard library only)."""
from __future__ import annotations

import sys
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
from content_model import SCHEMA, iter_people_pages, iter_personal_pages, validate_fields

EMAIL_FIELD = next(field for field in SCHEMA["types"]["people"]["fields"] if field["key"] == "email")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


class Page(HTMLParser):
    def __init__(self, url: str, text: str):
        super().__init__()
        self.url = url
        self.links: list[str] = []
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()
        self.canonical = ""
        self.heading = ""
        self.title = ""
        self.capture = ""
        self.text = []
        self.personal_websites = set()
        self.contact_errors = set()
        self.feed(text)

    def check_emails(self, text):
        for email in EMAIL_PATTERN.findall(unquote(text)):
            if validate_fields([EMAIL_FIELD], {"email": email}, "people", ROOT):
                self.contact_errors.add("non-University of Toronto email must not be published")

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "title"}:
            self.capture = tag
        attrs = dict(attrs)
        for value in attrs.values():
            if value:
                self.check_emails(value)
        href = attrs.get("href", "")
        url = urlsplit(href)
        if tag == "a" and (url.scheme == "mailto" or attrs.get("aria-label") == "Personal website"
                           or re.fullmatch(r"/~[^/]+/?", url.path)):
            if attrs.get("target") != "_blank":
                self.contact_errors.add("email and personal website links must open in a new tab")
            if not {"noopener", "noreferrer"} & set(attrs.get("rel", "").split()):
                self.contact_errors.add("new-tab contact links must protect the opening page")
        if tag == "a" and attrs.get("aria-label") == "Personal website":
            self.personal_websites.add(attrs.get("href", ""))
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                self.duplicate_ids.add(attrs["id"])
            self.ids.add(attrs["id"])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href", "")
        for name in ("href", "src"):
            if attrs.get(name):
                self.links.append(urljoin(self.url, attrs[name]))

    def handle_data(self, data):
        self.check_emails(data)
        self.text.append(data)
        if self.capture == "h1":
            self.heading += data
        elif self.capture == "title":
            self.title += data

    def handle_endtag(self, tag):
        if tag == self.capture:
            self.capture = ""


def check(destination: Path, source: Path = ROOT) -> list[str]:
    failures = []
    pages = {}
    # Standalone sites own their markup and may use client-side routes/anchors.
    # Check that MSRG links reach them, without imposing Hugo's HTML contracts.
    standalone = {path.parent.name for path in (source / "static").glob("~*/index.html")}
    for path in destination.rglob("*.html"):
        url = "/" + path.relative_to(destination).as_posix()
        url = url.removesuffix("index.html")
        pages[path] = Page(url, path.read_text())

    home = pages.get(destination / "index.html")
    if not home or not home.canonical:
        return ["Missing homepage or canonical URL"]
    host = urlsplit(home.canonical).netloc

    for path, page in pages.items():
        # Contact privacy applies to standalone personal sites too.
        for error in page.contact_errors:
            failures.append(f"{page.url}: {error}")
        if path.relative_to(destination).parts[0] in standalone:
            continue
        for duplicate in page.duplicate_ids:
            failures.append(f"{page.url}: duplicate ID {duplicate}")
        for link in page.links:
            url = urlsplit(link)
            if url.scheme not in {"", "http", "https"} or url.netloc not in {"", host}:
                continue
            target = destination / unquote(url.path).lstrip("/")
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                failures.append(f"{page.url}: missing {url.path}")
            elif (url.fragment and target in pages
                  and target.relative_to(destination).parts[0] not in standalone
                  and unquote(url.fragment) not in pages[target].ids):
                failures.append(f"{page.url}: missing anchor {url.path}#{url.fragment}")

    roster = pages.get(destination / "people/index.html")
    retired_profile_urls = set()
    personal_pages = {slug: data for _, slug, data in iter_personal_pages(source)}
    for _, slug, data in iter_people_pages(source):
        retired_profile_urls.add(f"/people/{slug}/")
        if (destination / "people" / slug / "index.html").is_file():
            failures.append(f"Individual member pages must not be published: {slug}")
        if not roster or f"member-{slug}" not in roster.ids or data["name"] not in "".join(roster.text):
            failures.append(f"Member is missing from the roster: {slug}")
        personal = personal_pages.get(slug)
        website = personal["url"] if personal else data.get("homepage")
        if website and roster and website not in roster.personal_websites:
            failures.append(f"Missing Personal website link for {slug}: {website}")
        if personal and not (destination / personal["url"].lstrip("/") / "index.html").is_file():
            failures.append(f"Personal website was not published: {slug}")

    for xml in destination.rglob("*.xml"):
        if xml.relative_to(destination).parts[0] in standalone:
            continue
        for node in ElementTree.parse(xml).iter():
            if node.tag.rsplit("}", 1)[-1] in {"loc", "link", "guid"} and urlsplit(node.text or "").path in retired_profile_urls:
                failures.append(f"{xml.relative_to(destination)}: link to a removed member page")

    for relative in ("404.html", "people/current-team/index.html", "people/alumni/index.html"):
        if not (destination / relative).is_file():
            failures.append(f"Missing launch page: {relative}")
    for path in destination.rglob("*"):
        if path.name == "List_of_students.txt" or "local-notes" in path.parts or "test-1" in path.parts:
            failures.append(f"Development content was published: {path}")
    print(f"Checked {len(pages)} HTML pages and {len(iter_people_pages())} roster members.")
    return sorted(set(failures))


if __name__ == "__main__":
    failures = check(Path(sys.argv[1] if len(sys.argv) > 1 else "public").resolve())
    if failures:
        sys.exit("Site validation failed:\n- " + "\n- ".join(failures))
    print("All generated-page checks passed.")
