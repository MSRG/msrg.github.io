#!/usr/bin/env python3
"""Local website editor. Run: pixi run editor (no extra Python dependencies)."""
from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import json
import io
import mimetypes
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import tomllib
from member_rename import rename_member
from editor_preview import EditorPreview

from content_model import (ROOT, SCHEMA, defaults, field_options, research_areas,
                           update_profile_text, validate_record, FRONT_MATTER)

ASSETS = Path(__file__).with_name("profile_editor")
KINDS = {key: value for key, value in SCHEMA['types'].items() if value.get('editor')}
MAX_UPLOAD = 20 * 1024 * 1024


class Conflict(ValueError):
    pass


def revision(text):
    return hashlib.sha256(text.encode()).hexdigest() if text else None


class ProfileStore:
    """Schema-backed records; retains the original profile API for callers."""
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.lock = threading.Lock()

    def safe_path(self, relative: str) -> Path:
        path = self.root / relative
        if not path.resolve().is_relative_to(self.root):
            raise ValueError('Path must stay inside the website')
        for part in (path, *path.parents):
            if part == self.root:
                break
            if part.is_symlink():
                raise ValueError('Symbolic links cannot be edited or uploaded through the tool')
        return path

    def path(self, slug: str, kind='people') -> Path:
        if kind not in KINDS:
            raise ValueError('Unknown content type')
        if not isinstance(slug, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError('Use lowercase letters, numbers, and hyphens for the identifier')
        if kind == 'personal':
            return self.safe_path(f'content/personal/{slug}/index.md')
        return self.safe_path(f'content/{kind}/{slug}.md')

    def preview(self, slug, kind):
        if kind == 'people':
            return '/people/#member-' + slug
        if kind == 'personal':
            return '/~' + slug + '/'
        if (self.root / 'hugo.yaml').exists():
            hugo = shutil.which('hugo')
            if not hugo:
                raise ValueError('Start with pixi run editor so Hugo is available for page previews')
            result = subprocess.run([hugo, 'list', 'all', '--noBuildLock', '--source', str(self.root)],
                                    capture_output=True, text=True, encoding='utf-8', timeout=30)
            if result.returncode:
                raise ValueError('Hugo could not resolve page URLs: ' + result.stderr.strip())
            relative = self.path(slug, kind).relative_to(self.root).as_posix()
            for row in csv.DictReader(io.StringIO(result.stdout)):
                if row['path'].replace('\\', '/') == relative:
                    return urlsplit(row['permalink']).path
            raise ValueError('Hugo could not find this page for preview')
        return f'/{kind}/{slug}/'

    def get(self, slug: str, kind='people', include_preview=True) -> dict:
        path = self.path(slug, kind)
        text = path.read_text(encoding='utf-8')
        match = FRONT_MATTER.match(text)
        if not match:
            raise ValueError('This record does not use TOML front matter')
        record = {'data': tomllib.loads(match[1]), 'body': text[match.end():], 'revision': revision(text)}
        if include_preview:
            record['preview'] = self.preview(slug, kind)
        if kind in {'people', 'personal'}:
            record['personal_page'] = self.personal_page(slug)
        return record

    def personal_page(self, slug):
        folder = self.path(slug, 'personal').parent
        template = any((folder / ('index' + suffix)).is_file() for suffix in ('.md', '.html'))
        custom = self.safe_path(f'static/~{slug}/index.html').is_file()
        kind = 'conflict' if template and custom else 'template' if template else 'custom' if custom else 'none'
        return {'enabled': kind in {'template', 'custom'}, 'kind': kind,
                'url': f'/~{slug}/' if template or custom else None}

    def records(self, kind):
        if kind not in KINDS:
            raise ValueError('Unknown content type')
        pattern = '*/index.md' if kind == 'personal' else '*.md'
        records = []
        for path in (self.root / 'content' / kind).glob(pattern):
            if path.name == '_index.md':
                continue
            slug = path.parent.name if kind == 'personal' else path.stem
            data = self.get(slug, kind, include_preview=False)['data']
            name = data.get('name', data.get('title', slug.replace('-', ' ').title()))
            if kind == 'personal':
                try:
                    name = self.get(slug)['data']['name']
                except FileNotFoundError:
                    pass
            records.append({'slug': slug, 'name': name})
        return sorted(records, key=lambda item: item['name'].casefold())

    def schema(self, kind='people') -> dict:
        if kind not in KINDS:
            raise ValueError('Unknown content type')
        definition = json.loads(json.dumps(KINDS[kind]))
        labels = {area['value']: area['label'] for area in research_areas(self.root)}
        for source in ('publications', 'data-sets'):
            labels.update({item['slug']: item['name'] for item in self.records(source)})
        def prepare(fields):
            result = []
            for field in fields:
                if not field.get('editor', True):
                    continue
                if field.get('options_source') or field.get('options'):
                    field['choices'] = [{'value': v, 'label': labels.get(v, v)} for v in field_options(field, kind, self.root)]
                if 'fields' in field:
                    field['fields'] = prepare(field['fields'])
                result.append(field)
            return result
        definition['fields'] = prepare(definition['fields'])
        return {'schema': definition, 'defaults': defaults(kind)}

    def write(self, path, text):
        path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temp = tempfile.mkstemp(prefix='.editor-', suffix='.tmp', dir=path.parent)
        try:
            with os.fdopen(descriptor, 'w', encoding='utf-8', newline='') as stream:
                stream.write(text)
            os.chmod(temp, path.stat().st_mode & 0o777 if path.exists() else 0o644)
            os.replace(temp, path)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)

    def local_links(self, value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == 'url' and isinstance(item, str) and item.startswith('/downloads/'):
                    if not self.safe_path('static' + item).is_file():
                        raise ValueError('Download does not exist; upload the file first')
                self.local_links(item)
        elif isinstance(value, list):
            for item in value:
                self.local_links(item)

    def save(self, payload: dict) -> dict:
        kind = payload.get('kind', 'people')
        slug = payload.get('slug', '')
        path = self.path(slug, kind)
        original_slug = payload.get('original_slug', slug)
        renaming = original_slug != slug
        if renaming and kind != 'people':
            raise ValueError('Only member identifiers can be renamed')
        if renaming and payload.get('confirm_rename') is not True:
            raise ValueError('Confirm the identifier-change warning before saving')
        source = self.path(original_slug, kind)
        changes = payload.get('data')
        if not isinstance(changes, dict):
            raise ValueError('Expected content fields')
        allowed = {f['key'] for f in KINDS[kind]['fields'] if f.get('editor', True)}
        if set(changes) - allowed:
            raise ValueError('Unknown editor field')
        with self.lock:
            original = source.read_text(encoding='utf-8') if source.exists() else ''
            if renaming and not original:
                raise Conflict('The original member no longer exists. Reload the member list before saving.')
            if payload.get('revision') != revision(original):
                raise Conflict('This record changed since you opened it. Reload it before saving to avoid overwriting another edit.')
            match = FRONT_MATTER.match(original) if original else None
            if original and not match:
                raise ValueError('This record does not use TOML front matter')
            old = tomllib.loads(match[1]) if match else {}
            # New entries use their identifier; older title-derived URLs stay stable on rename.
            if kind in {'publications', 'data-sets'}:
                if not original:
                    changes = changes | {'slug': slug}
                elif changes.get('title', old.get('title')) != old.get('title') and not old.get('slug') and not old.get('url'):
                    changes = changes | {'url': self.preview(slug, kind)}
            merged = old | changes
            errors = validate_record(kind, merged, slug, self.root)
            if errors:
                raise ValueError('\n'.join(errors))
            portrait = merged.get('portrait', '') if kind == 'people' else ''
            if portrait:
                image = self.safe_path('static' + portrait)
                if (not portrait.startswith('/images/people/') or not image.is_file() or
                        not image.resolve().is_relative_to(self.root / 'static/images/people')):
                    raise ValueError('Portrait: upload a photo or choose an existing one')
            if kind == 'data-sets':
                for download in merged.get('downloads', []):
                    if download['url'].startswith('/') and not download['url'].startswith('/downloads/'):
                        raise ValueError('Downloads: use an uploaded file or an HTTP(S) link')
            if kind == 'personal':
                if not self.path(slug).is_file():
                    raise ValueError('Create the member profile before its personal page')
                if self.safe_path(f'static/~{slug}/index.html').exists():
                    raise ValueError('This member already has a custom website. A template cannot replace it at the same address.')
            self.local_links(merged)
            text = update_profile_text(original, changes)
            if 'body' in payload:
                if not KINDS[kind]['editor'].get('body') or not isinstance(payload['body'], str):
                    raise ValueError('This record does not accept page text')
                text = text[:FRONT_MATTER.match(text).end()] + payload['body']
            if renaming:
                renamed = rename_member(self, original_slug, slug, text, original)
                return {'revision': revision(renamed.pop('text')), 'path': path.relative_to(self.root).as_posix(), **renamed}
            self.write(path, text)
            return {'revision': revision(text), 'path': path.relative_to(self.root).as_posix()}

    def upload(self, payload):
        category = payload.get('category')
        if category not in {'portrait', 'download', 'personal'}:
            raise ValueError('Unknown upload category')
        name = payload.get('name', '')
        if not isinstance(name, str) or '/' in name or '\\' in name or not name:
            raise ValueError('Choose a filename without folders')
        try:
            content = base64.b64decode(payload.get('content', ''), validate=True)
        except (ValueError, TypeError):
            raise ValueError('Invalid uploaded file') from None
        if not 0 < len(content) <= MAX_UPLOAD:
            raise ValueError('Upload files up to 20 MB. Use an external download link for larger datasets.')
        suffix = Path(name).suffix.lower()
        is_image = ((suffix in {'.jpg', '.jpeg'} and content.startswith(b'\xff\xd8\xff')) or
                    (suffix == '.png' and content.startswith(b'\x89PNG\r\n\x1a\n')) or
                    (suffix == '.webp' and content.startswith(b'RIFF') and content[8:12] == b'WEBP'))
        if category == 'portrait' and not is_image:
            raise ValueError('Choose a JPEG, PNG, or WebP profile photo')
        if category != 'portrait' and not is_image and suffix not in {'.pdf', '.zip', '.gz', '.tgz', '.rar', '.7z', '.csv', '.tsv', '.txt', '.json', '.bib'}:
            raise ValueError('Choose an image, PDF, archive, or data file. Custom CSS is not supported in the editor.')
        stem = re.sub(r'[^a-z0-9]+', '-', Path(name).stem.lower()).strip('-')[:80] or 'file'
        if category == 'portrait':
            slug = payload.get('slug', '')
            self.path(slug)
            stem = slug
            folder = 'static/images/people'
        elif category == 'personal':
            slug = payload.get('slug', '')
            page = self.path(slug, 'personal')
            if not self.path(slug).exists():
                raise ValueError('Create the member profile before uploading personal page files')
            folder = page.parent.relative_to(self.root).as_posix()
        else:
            folder = 'static/downloads'
        filename = stem + '-' + hashlib.sha256(content).hexdigest()[:12] + suffix
        path = self.safe_path(f'{folder}/{filename}')
        with self.lock:
            path.parent.mkdir(parents=True, exist_ok=True)
            if not path.exists():
                with path.open('xb') as stream:
                    stream.write(content)
        url = f'/~{slug}/{filename}' if category == 'personal' else '/' + path.relative_to(self.root / 'static').as_posix()
        return {'url': url, 'filename': filename, 'path': path.relative_to(self.root).as_posix(), 'image': is_image}


def make_server(root: Path = ROOT, port: int = 1314, preview: EditorPreview | None = None) -> ThreadingHTTPServer:
    store = ProfileStore(root)
    token = secrets.token_urlsafe(32)

    class Handler(BaseHTTPRequestHandler):
        def respond(self, status, data, content_type='application/json'):
            body = json.dumps(data, ensure_ascii=False, default=str).encode() if content_type == 'application/json' else data
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; frame-src http://127.0.0.1:*; frame-ancestors 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(body)

        def host_allowed(self):
            return self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}'

        def do_GET(self):
            if not self.host_allowed():
                return self.respond(403, {'error': 'Use the 127.0.0.1 address printed in the terminal'})
            route = urlsplit(self.path).path
            try:
                if route == '/api/config':
                    return self.respond(200, {'token': token, 'collections': {k: v['editor'] for k, v in KINDS.items()}})
                if route == '/api/preview':
                    return self.respond(200, preview.status() if preview else {
                        'state': 'stopped', 'message': 'Restart with pixi run editor to start the local preview.'})
                if route.startswith('/api/preview/personal/'):
                    slug = route.removeprefix('/api/preview/personal/')
                    store.path(slug)
                    return self.respond(200, preview.status(f'/~{slug}/') if preview else {
                        'state': 'stopped', 'message': 'Restart with pixi run editor to start the local preview.'})
                if route == '/api/schema':
                    return self.respond(200, store.schema() | {'token': token})
                if route.startswith('/api/schema/'):
                    return self.respond(200, store.schema(route.removeprefix('/api/schema/')))
                if route == '/api/profiles':
                    return self.respond(200, store.records('people'))
                if route.startswith('/api/profiles/'):
                    return self.respond(200, store.get(route.removeprefix('/api/profiles/')))
                if route.startswith('/api/records/'):
                    parts = route.removeprefix('/api/records/').split('/')
                    return self.respond(200, store.records(parts[0]) if len(parts) == 1 else store.get(parts[1], parts[0]))
                if route == '/api/portraits':
                    return self.respond(200, sorted('/images/people/' + p.name for p in (store.root / 'static/images/people').glob('*') if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}))
                if route.startswith('/images/people/'):
                    path = store.safe_path('static' + route)
                    if path.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
                        raise ValueError('Not a portrait')
                    return self.respond(200, path.read_bytes(), mimetypes.guess_type(path.name)[0])
                if route in {'/', '/editor.js', '/editor.css'}:
                    path = ASSETS / ('index.html' if route == '/' else route[1:])
                    return self.respond(200, path.read_bytes(), mimetypes.guess_type(path.name)[0] + '; charset=utf-8')
                self.respond(404, {'error': 'Not found'})
            except FileNotFoundError:
                self.respond(404, {'error': 'Record not found'})
            except (ValueError, TypeError, OSError) as error:
                self.respond(400, {'error': str(error)})

        def do_POST(self):
            expected_origin = f'http://127.0.0.1:{self.server.server_port}'
            if (not self.host_allowed() or self.headers.get('Origin') != expected_origin or
                    not secrets.compare_digest(self.headers.get('X-Editor-Token', ''), token)):
                return self.respond(403, {'error': 'Open the local editor to save changes'})
            if self.path not in {'/api/profiles', '/api/records', '/api/uploads', '/api/preview/start'}:
                return self.respond(404, {'error': 'Not found'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= (MAX_UPLOAD * 4 // 3 + 4096 if self.path == '/api/uploads' else 1_000_000):
                    raise ValueError('Invalid request size')
                payload = json.loads(self.rfile.read(length))
                if not isinstance(payload, dict):
                    raise ValueError('Expected an object')
                if self.path == '/api/preview/start':
                    if not preview:
                        raise ValueError('Restart with pixi run editor to start the local preview')
                    preview.start()
                    return self.respond(200, preview.status())
                self.respond(200, store.upload(payload) if self.path == '/api/uploads' else store.save(payload))
            except Conflict as error:
                self.respond(409, {'error': str(error)})
            except (ValueError, TypeError, OSError) as error:
                self.respond(400, {'error': str(error)})

    return ThreadingHTTPServer(('127.0.0.1', port), Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=1314)
    args = parser.parse_args()
    preview = EditorPreview(ROOT)
    server = make_server(port=args.port, preview=preview)
    try:
        preview.start()
        print(f'Website editor: http://127.0.0.1:{server.server_port}', flush=True)
        print('The local Hugo preview starts automatically. Ctrl+C stops both the editor and its preview.', flush=True)
        print('Saves changes locally. Preview and submit a pull request when ready.', flush=True)
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        preview.close()


if __name__ == '__main__':
    main()
