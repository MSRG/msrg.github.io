"""Shared content definitions, validation and lossless profile updates (Python 3.11+)."""
from __future__ import annotations

import datetime as dt
import json
import re
import tomllib
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / "data/content_schema.json").read_text(encoding="utf-8"))
FRONT_MATTER = re.compile(r"\A\+\+\+[^\S\n]*\n(.*?)\n\+\+\+[^\S\n]*(?:\n|$)", re.DOTALL)


def load_toml_front_matter(path: Path) -> dict:
    match = FRONT_MATTER.match(path.read_text(encoding="utf-8"))
    if not match:
        raise ValueError(f"{path}: expected TOML front matter delimited by +++")
    return tomllib.loads(match[1])


def iter_people_pages(root: Path = ROOT) -> list[tuple[Path, str, dict]]:
    return [(path, path.parent.name if path.name == "index.md" else path.stem,
             load_toml_front_matter(path))
            for path in sorted((root / "content/people").rglob("*.md"))
            if path.name != "_index.md"]


def iter_personal_pages(root: Path = ROOT) -> list[tuple[Path, str, dict]]:
    pages = []
    for path in sorted((root / "content/personal").glob("*/index.*")):
        if path.suffix in {".md", ".html"}:
            data = load_toml_front_matter(path)
            data.setdefault("url", f"/~{path.parent.name}/")
            pages.append((path, path.parent.name, data))
    for path in sorted((root / "static").glob("~*/index.html")):
        slug = path.parent.name[1:]
        pages.append((path, slug, {"url": f"/~{slug}/"}))
    return pages


def iter_publication_pages(root: Path = ROOT) -> list[tuple[Path, dict]]:
    return [(path, load_toml_front_matter(path))
            for path in sorted((root / "content/publications").glob("*.md"))
            if path.name != "_index.md"]


def research_areas(root: Path = ROOT) -> list[dict]:
    areas = []
    for path in (root / "content/research").glob("*/_index.md"):
        data = load_toml_front_matter(path)
        areas.append({"value": path.parent.name, "label": data["title"], "weight": data.get("weight", 0)})
    return sorted(areas, key=lambda item: (item["weight"], item["label"]))


def field_options(field: dict, kind: str, root: Path = ROOT) -> list[str]:
    source = field.get("options_source")
    if source == "roles":
        return [role for group in SCHEMA["types"][kind]["groups"] for role in group["roles"]]
    if source == "research":
        return [area["value"] for area in research_areas(root)]
    if source in {"publications", "data-sets"}:
        return sorted(path.stem for path in (root / "content" / source).glob("*.md") if path.stem != "_index")
    return field.get("options", [])


def validate_fields(fields: list[dict], data: dict, kind: str, root: Path = ROOT,
                    prefix: str = "") -> list[str]:
    errors = []
    for field in fields:
        key = field["key"]
        label = prefix + key
        value = data.get(key)
        if field.get("required") and (value is None or value == [] or value == "" or
                                      isinstance(value, str) and not value.strip()):
            errors.append(f"{label}: required")
            continue
        if value is None:
            continue
        kind_type = field["type"]
        valid_type = {"string": isinstance(value, str), "boolean": type(value) is bool,
                      "integer": type(value) is int,
                      "object": isinstance(value, dict),
                      "strings": isinstance(value, list) and all(isinstance(v, str) for v in value),
                      "objects": isinstance(value, list) and all(isinstance(v, dict) for v in value)}
        if not valid_type.get(kind_type):
            errors.append(f"{label}: expected {kind_type}")
            continue
        options = field_options(field, kind, root)
        if (options or field.get("options_source")) and value not in ("", []):
            values = value if isinstance(value, list) else [value]
            if any(v not in options for v in values):
                errors.append(f"{label}: choose from {', '.join(options)}")
        if kind_type == "objects":
            for index, item in enumerate(value):
                errors.extend(validate_fields(field["fields"], item, kind, root, f"{label}[{index}]."))
        if kind_type == "object" and value:
            errors.extend(validate_fields(field["fields"], value, kind, root, f"{label}."))
        if kind_type == "integer" and not field.get("min", value) <= value <= field.get("max", value):
            errors.append(f"{label}: outside the allowed range")
        if not value or kind_type != "string":
            continue
        fmt = field.get("format")
        if fmt == "slug" and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
            errors.append(f"{label}: use lowercase letters, numbers, and hyphens")
        if fmt == "partial-date":
            try:
                if not re.fullmatch(r"\d{4}(?:-\d{2}){0,2}", value):
                    raise ValueError
                dt.date.fromisoformat(value + {4: "-01-01", 7: "-01", 10: ""}[len(value)])
            except ValueError:
                errors.append(f"{label}: use a real, quoted YYYY, YYYY-MM, or YYYY-MM-DD date")
        if fmt == "link" and value.startswith("/") and not value.startswith("//"):
            if any(c.isspace() for c in value) or ".." in value.split("/") or "\\" in value:
                errors.append(f"{label}: invalid local link")
            continue
        if fmt in {"url", "link"}:
            try:
                parsed = urlsplit(value)
                schemes = {"https"} if field.get("https_only") else {"http", "https"}
                host = parsed.hostname or ""
                if parsed.scheme not in schemes or not host or any(c.isspace() for c in value):
                    raise ValueError
                if field.get("host") and not (host == field["host"] or host.endswith("." + field["host"])):
                    raise ValueError
            except ValueError:
                errors.append(f"{label}: use a valid {'HTTPS' if field.get('https_only') else 'HTTP(S)'} URL"
                              + (f" on {field['host']}" if field.get("host") else ""))
        if fmt == "email":
            if not re.fullmatch(r"[^\s@,;?&#]+@[A-Za-z0-9.-]+\.[A-Za-z]+", value):
                errors.append(f"{label}: use an email address")
            elif field.get("host"):
                domain = value.rsplit("@", 1)[1].lower()
                if domain != field["host"] and not domain.endswith("." + field["host"]):
                    errors.append(f"{label}: use an address on {field['host']} or its subdomains, or leave empty")
    return errors


def validate_record(kind: str, data: dict, slug: str | None = None, root: Path = ROOT) -> list[str]:
    definition = SCHEMA["types"][kind]
    errors = validate_fields(definition["fields"], data, kind, root)
    for key in data:
        if key.lower() in SCHEMA["forbidden_fields"]:
            errors.append(f"{key}: keep unfinished content on a Git branch")
        if key in definition.get("forbidden_fields", {}):
            errors.append(f"{key}: {definition['forbidden_fields'][key]}")
    if kind == "people" and slug is not None and data.get("slug") != slug:
        errors.append("slug: must match the profile filename")
    if kind == "personal" and slug is not None and data.get("url", f"/~{slug}/") != f"/~{slug}/":
        errors.append(f"url: expected /~{slug}/")
    return errors


def defaults(kind: str) -> dict:
    # JSON round trip avoids sharing mutable array defaults with the schema.
    return {field["key"]: json.loads(json.dumps(field["default"]))
            for field in SCHEMA["types"][kind]["fields"] if field.get("editor", True)}


def toml_value(value) -> str:
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if type(value) is bool:
        return "true" if value else "false"
    if type(value) in (int, float):
        return repr(value)
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, list):
        return "[" + ", ".join(toml_value(v) for v in value) + "]"
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{json.dumps(k)} = {toml_value(v)}" for k, v in value.items()) + " }"
    raise ValueError(f"Unsupported TOML value: {type(value).__name__}")


def update_profile_text(original: str, updates: dict) -> str:
    """Edit top-level assignments, preserving unchanged fields, comments, and body.

    Parse each assignment to find its end, including multiline strings/arrays.
    Never guess at a table layout: verify the resulting TOML before returning it.
    """
    if not original:
        return "+++\n" + "".join(f"{k} = {toml_value(v)}\n" for k, v in updates.items()) + "+++\n"
    match = FRONT_MATTER.match(original)
    if not match:
        raise ValueError("Expected TOML front matter")
    old = tomllib.loads(match[1])
    pending = {key: value for key, value in updates.items() if key not in old or old[key] != value}
    lines = match[1].splitlines(keepends=True)
    output = []
    index = 0
    while index < len(lines):
        line = lines[index]
        assignment = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
        if not assignment:
            output.append(line)
            index += 1
            continue
        key = assignment[1]
        end = index + 1
        while True:
            try:
                tomllib.loads("".join(lines[index:end]))
                break
            except tomllib.TOMLDecodeError:
                end += 1
                if end > len(lines):
                    raise ValueError(f"Cannot safely edit {key}; update this field in the Markdown file")
        if key in pending:
            output.append(f"{key} = {toml_value(pending.pop(key))}\n")
        else:
            output.extend(lines[index:end])
        index = end
    front = "".join(output).rstrip("\n") + "\n"
    front += "".join(f"{key} = {toml_value(value)}\n" for key, value in pending.items())
    if tomllib.loads(front) != old | updates:
        raise ValueError("Cannot safely edit this TOML table layout; update it in the Markdown file")
    return "+++\n" + front + "+++\n" + original[match.end():]
