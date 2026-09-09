"""Own a local Hugo preview for the editor, with isolated build files and cleanup."""
from __future__ import annotations

from http.client import HTTPConnection
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading


class EditorPreview:
    def __init__(self, root: Path, preferred_port: int = 1313, hugo: str | None = None):
        self.root = root.resolve()
        self.preferred_port = preferred_port
        self.hugo = hugo or shutil.which('hugo')
        self.process = None
        self.port = None
        self.temp = None
        self.log = None
        self.error = ''
        self.lock = threading.RLock()

    def start(self):
        with self.lock:
            if self.process and self.process.poll() is None:
                return
            self.close()
            self.error = ''
            if not self.hugo:
                self.error = 'Hugo is unavailable. Restart the editor with pixi run editor.'
                return
            try:
                with socket.socket() as probe:
                    try:
                        probe.bind(('127.0.0.1', self.preferred_port))
                    except OSError:
                        probe.bind(('127.0.0.1', 0))
                    self.port = probe.getsockname()[1]
                self.temp = tempfile.TemporaryDirectory(prefix='msrg-editor-preview-')
                folder = Path(self.temp.name)
                self.log = (folder / 'hugo.log').open('w+b')
                self.process = subprocess.Popen([
                    self.hugo, 'server', '--source', str(self.root), '--disableFastRender',
                    '--bind', '127.0.0.1', '--port', str(self.port),
                    '--baseURL', f'http://127.0.0.1:{self.port}/', '--appendPort=false',
                    '--destination', str(folder / 'public'), '--cacheDir', str(folder / 'cache'),
                    '--noBuildLock',
                ], stdout=self.log, stderr=subprocess.STDOUT)
            except OSError as error:
                self.error = f'Could not start Hugo: {error}'
                self.close()

    def status(self, path='/'):
        with self.lock:
            if self.error:
                return {'state': 'failed', 'message': self.error}
            if not self.process:
                return {'state': 'stopped', 'message': 'The local preview is not running.'}
            if self.process.poll() is not None:
                self.log.seek(0, 2)
                self.log.seek(max(0, self.log.tell() - 4000))
                detail = self.log.read().decode('utf-8', errors='replace').strip()
                return {'state': 'failed', 'message': 'Hugo could not start the preview. Fix the reported error, then retry.', 'details': detail}
            connection = HTTPConnection('127.0.0.1', self.port, timeout=0.4)
            try:
                connection.request('HEAD', path)
                if connection.getresponse().status == 200:
                    return {'state': 'ready', 'message': 'Local preview is running.', 'url': f'http://127.0.0.1:{self.port}'}
            except OSError:
                pass
            finally:
                connection.close()
            return {'state': 'starting', 'message': 'Starting the local preview…'}

    def close(self):
        with self.lock:
            if self.process:
                if self.process.poll() is None:
                    self.process.terminate()
                    try:
                        self.process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        self.process.kill()
                        self.process.wait()
                self.process = None
            if self.log:
                self.log.close()
                self.log = None
            if self.temp:
                self.temp.cleanup()
                self.temp = None
