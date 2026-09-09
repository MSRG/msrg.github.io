"""Rename a member and their local references without changing unrelated identifiers."""
from __future__ import annotations

from pathlib import Path
import re

TEXT_SUFFIXES = {'.md', '.html', '.css', '.js', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.toml', '.svg', '.xml', '.txt', '.webmanifest'}


def rewrite_references(text: str, old: str, new: str, origins: set[str]) -> str:
    # A root-relative URL or a URL on this website, never another site's user path.
    left = r'(?<![\w.~:/%+@-])'
    for prefix in ('/~', '/people/', '/personal/'):
        source = prefix + old
        target = prefix + new
        boundary = r'(?=[/?#\s\"\'<>\)\]\}]|$)'
        text = re.sub(left + re.escape(source) + boundary, lambda _: target, text)
        for origin in origins:
            text = re.sub(left + re.escape(origin + source) + boundary, lambda _: origin + target, text)
    fragment = re.escape('#member-' + old) + r'(?![\w-])'
    local_path = r'(/[^\s\"\'<>\)\]]*)?'
    text = re.sub(left + local_path + fragment, lambda match: (match[1] or '') + '#member-' + new, text)
    for origin in origins:
        text = re.sub(left + re.escape(origin) + local_path + fragment,
                      lambda match: origin + (match[1] or '') + '#member-' + new, text)
    for prefix, suffix in [('content/people/', '.md'), ('content/personal/', '/'), ('static/~', '/')]:
        text = re.sub(left + re.escape(prefix + old + suffix), lambda _: prefix + new + suffix, text)
    # Hugo references can also point directly to the source Markdown file.
    for prefix in ('/people/', '/personal/'):
        text = re.sub(left + re.escape(prefix + old + '.md') + r'(?![\w.-])', lambda _: prefix + new + '.md', text)
    return text


def rename_member(store, old: str, new: str, profile_text: str, original_text: str) -> dict:
    """Called with the store lock held; preflight everything and roll back on failure."""
    source = store.path(old)
    destination = store.path(new)
    # Even an orphaned folder must never be silently adopted by the renamed member.
    for relative in (f'content/people/{new}.md', f'content/people/{new}',
                     f'content/personal/{new}', f'static/~{new}'):
        if store.safe_path(relative).exists():
            raise ValueError(f'The identifier {new!r} is already used by {relative}. Choose another identifier.')
    moves = [(source, destination)]
    for relative, target in ((f'content/personal/{old}', f'content/personal/{new}'),
                             (f'static/~{old}', f'static/~{new}')):
        folder = store.safe_path(relative)
        if folder.exists():
            if not folder.is_dir():
                raise ValueError(f'{relative} must be a directory')
            for child in folder.rglob('*'):
                store.safe_path(child.relative_to(store.root).as_posix())
            moves.append((folder, store.safe_path(target)))

    origins = {'http://localhost:1313', 'http://127.0.0.1:1313'}
    config = store.root / 'hugo.yaml'
    if config.is_file():
        match = re.search(r'^baseURL:\s*[\"\']?([^\s\"\']+)', config.read_text(encoding='utf-8'), re.MULTILINE)
        if match:
            origins.add(match[1].rstrip('/'))
    candidates = {source}
    for directory in ('content', 'static', 'assets', 'layouts', 'data'):
        for path in (store.root / directory).rglob('*'):
            if path.suffix.lower() in TEXT_SUFFIXES and path.is_file():
                if path.is_relative_to(store.root / 'static/downloads'):
                    continue  # Research data and published attachments are not website source links.
                # Schema and data definitions describe identifiers in general, not a member.
                if path == store.root / 'data/content_schema.json':
                    continue
                candidates.add(store.safe_path(path.relative_to(store.root).as_posix()))
    for name in ('hugo.yaml', 'README.md'):
        path = store.safe_path(name)
        if path.is_file():
            candidates.add(path)
    originals, changes = {}, {}
    for path in sorted(candidates):
        original = path.read_bytes()
        if path == source and original.decode('utf-8').replace('\r\n', '\n').replace('\r', '\n') != original_text:
            raise ValueError('The member changed during the rename. Reload and try again.')
        try:
            text = profile_text if path == source else original.decode('utf-8')
        except UnicodeDecodeError:
            continue  # Leave binary/other-encoded custom files untouched.
        updated = rewrite_references(text, old, new, origins)
        if updated.encode('utf-8') != original:
            originals[path] = original
            changes[path] = updated

    def relocated(path):
        for before, after in moves:
            if path == before or path.is_relative_to(before):
                return after / path.relative_to(before)
        return path

    # Detect intervening edits before mutating any file.
    for path, original in originals.items():
        if path.read_bytes() != original:
            raise ValueError(f'{path.relative_to(store.root)} changed during the rename. Reload and try again.')
    written, moved = [], []
    try:
        for path, text in changes.items():
            store.write(path, text)
            written.append(path)
        for before, after in moves:
            if after.exists():
                raise ValueError(f'{after.relative_to(store.root)} appeared during the rename. Reload and try again.')
            before.rename(after)
            moved.append((before, after))
    except Exception:
        for before, after in reversed(moved):
            after.rename(before)
        for path in reversed(written):
            path.write_bytes(originals[path])
        raise
    changed = sorted({relocated(path).relative_to(store.root).as_posix() for path in changes})
    return {'text': changes[source], 'changed_files': changed,
            'moved': [{'from': before.relative_to(store.root).as_posix(), 'to': after.relative_to(store.root).as_posix()} for before, after in moves]}
