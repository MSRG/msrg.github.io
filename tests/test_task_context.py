"""Time and environment changes must invalidate the right cached tasks."""
from __future__ import annotations

import datetime as dt
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from task_context import refresh


class TaskContextTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.calendar = self.root / '.pixi/task-context/calendar.json'
        self.environment = self.root / '.pixi/task-context/environment.json'

    def test_unchanged_context_does_not_rewrite_inputs(self):
        refresh(self.root, dt.datetime.fromisoformat('2026-09-09T14:00:00+00:00'))
        os.utime(self.calendar, ns=(1_000_000_000, 1_000_000_000))
        os.utime(self.environment, ns=(1_000_000_000, 1_000_000_000))
        refresh(self.root, dt.datetime.fromisoformat('2026-09-09T15:00:00+00:00'))
        self.assertEqual(self.calendar.stat().st_mtime_ns, 1_000_000_000)
        self.assertEqual(self.environment.stat().st_mtime_ns, 1_000_000_000)

    def test_toronto_midnight_invalidates_build_in_both_seasons(self):
        for midnight in ('2026-09-10T04:00:00+00:00', '2026-01-10T05:00:00+00:00'):
            with self.subTest(midnight=midnight):
                after = dt.datetime.fromisoformat(midnight)
                refresh(self.root, after - dt.timedelta(seconds=1))
                calendar = self.calendar.read_bytes()
                environment = self.environment.read_bytes()
                refresh(self.root, after)
                self.assertNotEqual(self.calendar.read_bytes(), calendar)
                self.assertEqual(self.environment.read_bytes(), environment)

    def test_hugo_overrides_invalidate_cache_without_storing_credentials(self):
        with patch.dict(os.environ, {'HUGO_BASEURL': 'https://example.org/'}):
            refresh(self.root)
            original = self.environment.read_bytes()
        with patch.dict(os.environ, {'HUGO_BASEURL': 'https://changed.example.org/', 'HUGO_PARAMS_TOKEN': 'private-value'}):
            refresh(self.root)
            self.assertNotEqual(self.environment.read_bytes(), original)
            self.assertNotIn('private-value', self.environment.read_text())

    def test_unrelated_environment_changes_do_not_invalidate_cache(self):
        refresh(self.root)
        original = self.environment.read_bytes()
        with patch.dict(os.environ, {'MSRG_UNRELATED_TEST_VARIABLE': 'changed'}):
            refresh(self.root)
        self.assertEqual(self.environment.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
