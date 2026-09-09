/* Optional end-to-end checks for the local editor. Uses a disposable website folder. */
const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'msrg-editor-test-'));
const engine = process.env.BROWSER_ENGINE || 'chromium';
const python = process.env.PYTHON || (process.platform === 'win32' ? path.join(root, '.pixi/envs/default/python.exe') : path.join(root, '.pixi/envs/default/bin/python'));
const server = spawn(python, ['-u', '-c', `import sys\nfrom pathlib import Path\nsys.path.insert(0, sys.argv[1])\nfrom edit_profiles import make_server\nserver = make_server(Path(sys.argv[2]), 0)\nprint(server.server_port, flush=True)\nserver.serve_forever()`, path.join(root, 'scripts'), fixture]);
let browser;
(async () => {
  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Editor failed to start')), 15000);
    server.stdout.on('data', data => { output += data; if (/^\d+\n/.test(output)) { clearTimeout(timeout); resolve(Number(output.trim())); } });
    server.on('error', error => { clearTimeout(timeout); reject(error); });
    server.on('exit', code => { clearTimeout(timeout); reject(new Error('Editor exited: ' + code)); });
  });
  const base = 'http://127.0.0.1:' + port;
  browser = await ({ chromium, firefox }[engine]).launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // Exercise preview availability independently of the real Hugo lifecycle tests.
  let previewState = { state: 'starting', message: 'Starting the local preview…' };
  await page.route(base + '/api/preview', route => route.fulfill({ json: previewState }));
  await page.route(base + '/api/preview/personal/*', route => route.fulfill({ json: previewState }));
  await page.route(base + '/~*/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><title>Personal preview</title></head><body><main><h1>Personal page preview fixture</h1></main></body></html>' }));
  await page.goto(base);
  console.log('Editor loaded');
  assert.equal(await page.locator('#preview').getAttribute('href'), null);
  assert.equal(await page.locator('#preview').getAttribute('aria-disabled'), 'true');
  previewState = { state: 'ready', message: 'Local preview is running.', url: base };
  await page.waitForFunction(() => document.querySelector('#preview').hasAttribute('href'));
  assert.match(await page.locator('#preview').getAttribute('href'), new RegExp('^' + base));

  await page.locator('#name').fill('Jane Doe');
  assert.equal(await page.locator('#personal-page-status').textContent(), 'Not enabled');
  assert.equal(await page.locator('#slug').inputValue(), 'jane-doe');
  await page.getByLabel('Upload a portrait').setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64') });
  await page.waitForFunction(() => document.querySelector('#message').textContent.startsWith('Uploaded '));
  await page.getByRole('button', { name: 'Add awards and funding', exact: true }).click();
  await page.getByLabel('Award name').fill('Example award');
  await page.getByLabel('Award page *', { exact: true }).fill('https://example.org/award');
  async function save() {
    await page.locator('#save').click();
    await page.waitForFunction(() => document.querySelector('#message').textContent.startsWith('Saved ') || document.querySelector('#message').classList.contains('error'));
    assert.match(await page.locator('#message').textContent(), /^Saved /);
    await page.waitForFunction(() => !document.querySelector('#save').disabled);
  }
  async function choose(kind) {
    await page.locator('#kind').selectOption(kind);
    await page.waitForFunction(expected => !document.querySelector('#save').disabled && document.querySelector('#kind').value === expected, kind);
  }
  await save();
  console.log('Profile saved');
  assert.equal(await page.locator('#slug').getAttribute('readonly'), null);
  await page.waitForFunction(() => { const image = document.querySelector('.portrait-preview'); return image.complete && image.naturalWidth > 0; });

  await choose('personal');
  console.log('Personal page form loaded');
  assert.equal(await page.locator('#kind option:checked').textContent(), 'Personal Pages');
  assert.equal(await page.locator('#custom_css').count(), 0);
  await page.locator('#custom-site-guide summary').click();
  assert.equal(await page.locator('#custom-site-folder').textContent(), 'static/~jane-doe/');
  assert.equal(await page.locator('#custom-site-folder').isVisible(), true);
  assert.equal(await page.locator('#preview').getAttribute('href'), null, 'An unsaved personal page cannot be previewed');

  await page.locator('#layout').selectOption('structured');
  await page.locator('#body').fill('My research interests.');
  await page.getByRole('button', { name: 'Add highlights', exact: true }).click();
  await page.getByLabel('Title *', { exact: true }).fill('Research highlight');
  await page.getByRole('button', { name: 'Add primary link', exact: true }).click();
  await page.getByLabel('Label *', { exact: true }).fill('MSRG');
  await page.getByLabel('Link *', { exact: true }).fill('https://msrg.github.io/');
  await save();
  await page.waitForFunction(() => document.querySelector('#personal-preview-frame').hasAttribute('src'));
  assert.match(await page.locator('#preview').getAttribute('href'), /\/~jane-doe\/$/);
  assert.equal(await page.frameLocator('#personal-preview-frame').getByRole('heading', { name: 'Personal page preview fixture' }).isVisible(), true);
  await page.locator('#preview-phone').click();
  await page.waitForFunction(() => document.querySelector('#preview-phone').getAttribute('aria-pressed') === 'true');
  assert.equal(await page.locator('#personal-preview-frame').evaluate(frame => frame.clientWidth <= 390), true);
  await page.locator('#preview-wide').click();
  await page.getByRole('button', { name: 'Remove item', exact: true }).first().click();
  await save();

  await choose('publications');
  console.log('Publication form loaded');
  await page.locator('#title').fill('Example Paper');
  await page.locator('#year').fill('2026');
  await page.locator('#authors').fill('Jane Doe\nJohn Doe');
  await page.locator('#venue').fill('Example Conference');
  await page.locator('#external_url').fill('https://example.org/paper');
  await page.getByLabel('Abstract', { exact: true }).fill('An abstract with ');
  const mathTools = page.getByRole('group', { name: 'Formatting for abstract', exact: true });
  await mathTools.getByRole('button', { name: 'Inline formula', exact: true }).click();
  assert.match(await page.locator('#abstract').inputValue(), /\\\(x\^2\\\)/);
  await mathTools.getByRole('button', { name: 'Equation', exact: true }).click();
  const abstract = await page.locator('#abstract').inputValue();
  assert.match(abstract, /\$\$\n\\sum_\{i=1\}\^\{n\} x_i\n\$\$/);
  await page.getByLabel('Additional notes', { exact: true }).fill('Companion notes. [Member](/people/#member-jane-doe)');
  await save();
  assert.equal(await page.locator('#record-slug').inputValue(), 'example-paper');

  await choose('data-sets');
  console.log('Dataset form loaded');
  await page.locator('#title').fill('Example Dataset');
  await page.locator('#related_publication').selectOption('example-paper');
  await page.getByRole('button', { name: 'Add downloads', exact: true }).click();
  await page.getByLabel('Label *', { exact: true }).fill('Results CSV');
  await page.getByLabel('Upload a file', { exact: true }).first().setInputFiles({ name: 'results.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') });
  await page.waitForFunction(() => document.querySelector('#message').textContent.startsWith('Uploaded '));
  await save();
  assert.equal(fs.readdirSync(path.join(fixture, 'static/downloads')).length, 1);

  await choose('publications');
  console.log('Publication form loaded');
  await page.locator('#profile').selectOption('example-paper');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#title').value === 'Example Paper');
  assert.equal(await page.locator('#abstract').inputValue(), abstract, 'LaTeX survives saving and reopening');
  await page.getByLabel('Example Dataset', { exact: true }).check();
  await save();
  const publication = path.join(fixture, 'content/publications/example-paper.md');
  fs.appendFileSync(publication, '\nChanged outside the editor.\n');
  await page.locator('#title').fill('Changed title');
  await page.locator('#save').click();
  await page.waitForFunction(() => document.querySelector('#message').classList.contains('error'));
  assert.match(await page.locator('#message').textContent(), /changed since you opened/);
  assert.match(fs.readFileSync(publication, 'utf8'), /title = "Example Paper"/);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved entry' }).click();
  await page.waitForFunction(() => !document.querySelector('#save').disabled && !document.querySelector('#message').classList.contains('error'));

  await choose('people');
  await page.locator('#profile').selectOption('jane-doe');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#slug').value === 'jane-doe');
  assert.equal(await page.locator('#personal-page-status').textContent(), 'Enabled — template page');
  assert.equal(await page.locator('#personal-page-status').evaluate(element => element.tagName), 'OUTPUT');
  await page.locator('#slug').fill('jane-smith');
  assert.equal(await page.locator('#rename-warning').isVisible(), true);
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#save').click();
  await page.waitForFunction(() => !document.querySelector('#save').disabled);
  assert.equal(fs.existsSync(path.join(fixture, 'content/people/jane-doe.md')), true);
  assert.equal(fs.existsSync(path.join(fixture, 'content/people/jane-smith.md')), false);
  page.once('dialog', dialog => dialog.accept());
  await save();
  assert.equal(fs.existsSync(path.join(fixture, 'content/people/jane-doe.md')), false);
  assert.equal(fs.existsSync(path.join(fixture, 'content/people/jane-smith.md')), true);
  assert.equal(fs.existsSync(path.join(fixture, 'content/personal/jane-smith/index.md')), true);
  assert.match(fs.readFileSync(publication, 'utf8'), /#member-jane-smith/);
  assert.match(await page.locator('#preview').getAttribute('href'), /#member-jane-smith$/);
  console.log('Identifier rename confirmation, cancellation, and linked updates passed');

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const kind of ['people', 'personal', 'publications', 'data-sets']) {
      await choose(kind);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow at ${width}px: ${kind}`);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await axe.run()).violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id));
      assert.deepEqual(violations, [], `Accessibility at ${width}px: ${kind}`);
    }
  }
  await page.screenshot({ path: path.join(os.tmpdir(), `msrg-editor-${engine}-mobile.png`), fullPage: true });
  fs.renameSync(path.join(fixture, 'content/personal/jane-smith'), path.join(fixture, 'saved-template'));
  fs.mkdirSync(path.join(fixture, 'static/~jane-smith'));
  fs.writeFileSync(path.join(fixture, 'static/~jane-smith/index.html'), '<!doctype html><title>Custom site</title>');
  await choose('personal');
  assert.equal(await page.locator('#save').isVisible(), false, 'Custom websites should not open a template editor');
  assert.equal(await page.locator('#fields').textContent(), '');
  assert.equal(await page.locator('#custom-site-guide').getAttribute('open'), '');
  await page.waitForFunction(() => document.querySelector('#personal-preview-frame').hasAttribute('src'));
  assert.match(await page.locator('#personal-preview-frame').getAttribute('src'), /\/~jane-smith\/$/);
  previewState = { state: 'failed', message: 'Preview stopped', details: 'Example error' };
  await page.waitForFunction(() => document.querySelector('#preview').getAttribute('aria-disabled') === 'true');
  assert.equal(await page.locator('#preview').getAttribute('href'), null);
  assert.equal(await page.locator('#preview-start').isVisible(), true);
  assert.deepEqual(errors, []);
  console.log(`${engine}: profile photo, awards, personal templates, publications, dataset uploads, conflicts, accessibility and desktop/mobile layouts passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server.exitCode === null) { const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill(); await stopped; }
  fs.rmSync(fixture, { recursive: true, force: true });
});
