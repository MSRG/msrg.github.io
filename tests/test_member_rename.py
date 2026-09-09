"""Identifier changes must move linked sites without losing files or editing other people."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from content_model import defaults, iter_people_pages, iter_personal_pages, validate_record
from edit_profiles import ProfileStore, Conflict
from member_rename import rewrite_references


class MemberRenameTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='msrg-member-rename-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = ProfileStore(self.root)
        self.store.save({'slug': 'jane-doe', 'data': defaults('people') | {'name': 'Jane Doe', 'slug': 'jane-doe'}})

    def file(self, relative, text):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(text.encode() if isinstance(text, str) else text)
        return path

    def payload(self, **extra):
        return {'kind': 'people', 'slug': 'jane-smith', 'original_slug': 'jane-doe',
                'revision': self.store.get('jane-doe')['revision'], 'confirm_rename': True,
                'data': {'slug': 'jane-smith'}, **extra}

    def snapshot(self):
        return {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def test_simple_rename_preserves_content_and_is_not_a_duplicate(self):
        path = self.store.path('jane-doe')
        path.write_text(path.read_text().replace('+++\n', '+++\n# A source note\n', 1) + '\nOriginal body.\n')
        old = self.store.get('jane-doe')['data']
        result = self.store.save(self.payload())
        self.assertFalse(path.exists())
        updated = self.store.get('jane-smith')
        self.assertEqual(updated['data'], old | {'slug': 'jane-smith'})
        self.assertEqual(updated['revision'], result['revision'])
        self.assertIn('# A source note', self.store.path('jane-smith').read_text())
        self.assertEqual(updated['body'], '\nOriginal body.\n')
        self.assertEqual([record['slug'] for record in self.store.records('people')], ['jane-smith'])

    def test_warning_confirmation_and_stale_source_are_required(self):
        before = self.snapshot()
        with self.assertRaises(ValueError):
            self.store.save(self.payload(confirm_rename=False))
        with self.assertRaises(Conflict):
            self.store.save(self.payload(revision='stale'))
        with self.assertRaises(ValueError):
            self.store.save(self.payload(slug='../escape', data={'slug': '../escape'}))
        self.assertEqual(self.snapshot(), before)
        payload = self.payload()
        self.store.save(payload)
        with self.assertRaises(Conflict):
            self.store.save(payload)
        self.assertFalse(self.store.path('jane-doe').exists())

    def test_collisions_never_overwrite_another_member_or_orphaned_site(self):
        for relative in ['content/people/jane-smith.md', 'content/people/jane-smith/index.md',
                         'content/personal/jane-smith/index.md', 'static/~jane-smith/index.html']:
            with self.subTest(relative=relative):
                path = self.file(relative, 'Existing content')
                before = self.snapshot()
                with self.assertRaisesRegex(ValueError, 'already used'):
                    self.store.save(self.payload())
                self.assertEqual(before, self.snapshot())
                path.unlink()
                if path.parent.name in {'jane-smith', '~jane-smith'}:
                    path.parent.rmdir()

    def test_template_bundle_url_assets_and_local_links_move_together(self):
        self.file('content/personal/jane-doe/index.md', '+++\nlayout = "academic"\nurl = "/~jane-doe/"\n+++\n![Photo](/~jane-doe/photo.png)\n[Member](/people/#member-jane-doe)\n')
        binary = b'\x00\xff\x89 original image bytes'
        self.file('content/personal/jane-doe/photo.png', binary)
        self.file('content/research/example/_index.md', '+++\ntitle = "Example"\n+++\n[Jane](/~jane-doe/)\n')
        self.store.save(self.payload(data={'slug': 'jane-smith', 'name': 'Jane Smith'}))
        self.assertFalse((self.root / 'content/personal/jane-doe').exists())
        self.assertEqual((self.root / 'content/personal/jane-smith/photo.png').read_bytes(), binary)
        record = self.store.get('jane-smith', 'personal')
        self.assertEqual(record['data']['url'], '/~jane-smith/')
        self.assertIn('/~jane-smith/photo.png', record['body'])
        self.assertIn('/people/#member-jane-smith', record['body'])
        self.assertIn('/~jane-smith/', (self.root / 'content/research/example/_index.md').read_text())
        self.assertEqual(validate_record('personal', record['data'], 'jane-smith'), [])

    def test_custom_site_relative_files_and_binary_assets_are_preserved(self):
        self.file('hugo.yaml', 'baseURL: https://msrg.github.io/\n')
        self.file('static/~jane-doe/index.html', '<a href="./about/">About</a><script src="/~jane-doe/app.js"></script>')
        self.file('static/~jane-doe/app.js', 'const base = "/~jane-doe/"; const website = "https://msrg.github.io/~jane-doe/";')
        binary = b'\x00\x01\xff\xfe'
        self.file('static/~jane-doe/data.bin', binary)
        self.store.save(self.payload())
        self.assertFalse((self.root / 'static/~jane-doe').exists())
        self.assertIn('href="./about/"', (self.root / 'static/~jane-smith/index.html').read_text())
        self.assertIn('src="/~jane-smith/app.js"', (self.root / 'static/~jane-smith/index.html').read_text())
        self.assertIn('https://msrg.github.io/~jane-smith/', (self.root / 'static/~jane-smith/app.js').read_text())
        self.assertEqual((self.root / 'static/~jane-smith/data.bin').read_bytes(), binary)
        self.assertEqual([slug for _, slug, _ in iter_personal_pages(self.root)], ['jane-smith'])

    def test_reference_rewrites_leave_similar_names_and_external_accounts_alone(self):
        changed = '\n'.join(['/~jane-doe/', '/~jane-doe/photo.png', '/people/#member-jane-doe',
                             '/research/example/#member-jane-doe', '#member-jane-doe',
                             'https://msrg.github.io/~jane-doe/?a=1',
                             'https://msrg.github.io/people/#member-jane-doe',
                             'content/people/jane-doe.md', 'content/personal/jane-doe/index.md', 'static/~jane-doe/app.js'])
        self.assertEqual(rewrite_references(changed, 'jane-doe', 'jane-smith', {'https://msrg.github.io'}), changed.replace('jane-doe', 'jane-smith'))
        unchanged = '\n'.join(['/~jane-doe-other/', '/people/#member-jane-doe-other',
                               'https://other.example/~jane-doe/', 'https://other.example/people/#member-jane-doe',
                               'https://linkedin.com/in/jane-doe/', 'jane-doe@example.org', 'jane-doe'])
        self.assertEqual(rewrite_references(unchanged, 'jane-doe', 'jane-smith', {'https://msrg.github.io'}), unchanged)

    def test_write_or_move_failure_rolls_back_all_files(self):
        self.file('content/personal/jane-doe/index.md', '+++\nlayout = "single"\n+++\n[Home](/~jane-doe/)\n')
        before = self.snapshot()
        write = self.store.write
        calls = 0
        def fail_second(path, text):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError('Simulated write failure')
            return write(path, text)
        with patch.object(self.store, 'write', side_effect=fail_second), self.assertRaises(OSError):
            self.store.save(self.payload())
        self.assertEqual(self.snapshot(), before)
        rename = Path.rename
        def fail_bundle(path, destination):
            if path.name == 'jane-doe':
                raise OSError('Simulated directory move failure')
            return rename(path, destination)
        with patch.object(Path, 'rename', fail_bundle), self.assertRaises(OSError):
            self.store.save(self.payload())
        self.assertEqual(self.snapshot(), before)

    @unittest.skipUnless(shutil.which('hugo'), 'Hugo required')
    def test_renamed_template_and_roster_build_with_working_links(self):
        for directory in ('content', 'data', 'static', 'assets', 'layouts'):
            shutil.copytree(ROOT / directory, self.root / directory, dirs_exist_ok=True)
        shutil.copy2(ROOT / 'hugo.yaml', self.root / 'hugo.yaml')
        self.file('content/personal/jane-doe/index.md', '+++\nlayout = "academic"\n+++\n[My roster card](/people/#member-jane-doe)\n')
        self.store.save(self.payload(data={'slug': 'jane-smith', 'name': 'Jane Smith'}))
        self.assertEqual([slug for _, slug, _ in iter_people_pages(self.root) if slug.startswith('jane-')], ['jane-smith'])
        output = self.root / 'public'
        build = subprocess.run(['hugo', '--source', str(self.root), '--destination', str(output), '--cacheDir', str(self.root / 'cache'), '--minify', '--panicOnWarning'], capture_output=True, text=True)
        self.assertEqual(build.returncode, 0, build.stdout + build.stderr)
        self.assertIn('Jane Smith', (output / '~jane-smith/index.html').read_text())
        self.assertFalse((output / '~jane-doe').exists())
        from check_site import check
        self.assertEqual(check(output, self.root), [])


if __name__ == '__main__':
    unittest.main()
