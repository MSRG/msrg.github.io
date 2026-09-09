"""Expose non-file inputs to Pixi's task cache without adding dependencies."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]


def write_if_changed(path: Path, value: object) -> None:
    text = json.dumps(value, sort_keys=True) + '\n'
    if not path.is_file() or path.read_text(encoding='utf-8') != text:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')


def refresh(root: Path = ROOT, now: dt.datetime | None = None) -> None:
    now = now or dt.datetime.now(dt.timezone.utc)
    # Toronto switches between UTC-4 and UTC-5. Tracking both date boundaries
    # avoids an extra timezone package on Windows; at most one extra build/day.
    # The local year also covers the footer's use of Hugo's local now.Year.
    dates = [now.astimezone(dt.timezone(dt.timedelta(hours=offset))).date().isoformat()
             for offset in (-4, -5)]
    directory = root / '.pixi/task-context'
    write_if_changed(directory / 'calendar.json', {'toronto_dates': dates, 'local_year': now.astimezone().year})
    # Hugo accepts config overrides through the environment. Store only a hash
    # so credentials in HUGO_* values never get copied into the cache metadata.
    environment = {key: value for key, value in os.environ.items()
                   if key.startswith(('HUGO_', 'GOHUGO_')) or key == 'TZ'}
    digest = hashlib.sha256(json.dumps(environment, sort_keys=True).encode()).hexdigest()
    write_if_changed(directory / 'environment.json', digest)


if __name__ == '__main__':
    if sys.argv[1:] == ['--clear']:
        for directory in (ROOT / '.pixi').glob('task-cache-*'):
            if directory.is_dir() and not directory.is_symlink():
                shutil.rmtree(directory)
        print('Task cache cleared. The next pixi run check will run all checks.')
    elif sys.argv[1:]:
        sys.exit('Usage: python scripts/task_context.py [--clear]')
    else:
        refresh()
