/* Optional: NODE_PATH=/path/to/browser-deps/node_modules node scripts/personal_site_check.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve('public');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'thomas-site-'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext();
  const errors = [];
  const failed = [];
  context.on('page', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  });
  await context.route('**/*', route => {
    assert(route.request().url().startsWith(base), 'The page must load without third-party requests');
    return route.continue();
  });
  const page = await context.newPage();
  for (const width of [1440, 1024, 768, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + '/~thomas-trenty/');
    await page.locator('#scene.ready').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
    assert.equal(await page.locator('h1').textContent(), 'ThomasTrenty.');
    assert(await page.locator('.portrait img').evaluate(img => img.complete && img.naturalWidth > 0));
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
    })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
    assert.deepEqual(violations, [], `Accessibility at ${width}px`);
    if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `${width}.png`), fullPage: true });
  }
  const motion = page.locator('#motion');
  await motion.focus();
  await page.keyboard.press('Enter');
  assert.equal(await motion.textContent(), 'Play motion');
  const paused = await page.locator('canvas').screenshot();
  await page.waitForTimeout(150);
  assert(paused.equals(await page.locator('canvas').screenshot()), 'Paused canvas must remain still');
  await page.keyboard.press('Enter');
  assert.equal(await motion.textContent(), 'Pause motion');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#motion').textContent === 'Play motion');
  assert.equal(await motion.textContent(), 'Play motion');
  await page.reload();
  await page.locator('#scene.ready').waitFor();
  assert.equal(await motion.textContent(), 'Play motion', 'Reduced motion starts paused');
  for (const link of await page.locator('.email, .socials a').all()) {
    assert.equal(await link.getAttribute('target'), '_blank');
    assert((await link.getAttribute('rel')).includes('noopener'));
  }
  for (const route of ['/people/', '/research/quantum-computing-systems/']) {
    await page.goto(base + route);
    const hosted = page.locator('#member-thomas-trenty [aria-label="MSRG personal page"]');
    assert.equal(await hosted.getAttribute('href'), '/~thomas-trenty/');
    assert.equal(await hosted.getAttribute('target'), '_blank');
    for (const slug of ['grier-jones', 'michael-dangana', 'shashank-motepalli']) {
      assert.equal(await page.locator(`#member-${slug} [aria-label="MSRG personal page"]`).count(), 0);
    }
  }
  for (const slug of ['grier-jones', 'michael-dangana', 'shashank-motepalli']) {
    assert(!fs.existsSync(path.join(root, `~${slug}/index.html`)), `${slug}'s page must not be built`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  await context.close();
  for (const javascript of [true, false]) {
    const fallback = await browser.newContext({ javaScriptEnabled: javascript });
    if (javascript) await fallback.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
    const view = await fallback.newPage();
    await view.goto(base + '/~thomas-trenty/');
    assert(await view.locator('.fallback').isVisible());
    assert(await view.locator('#motion').isHidden());
    assert(await view.getByRole('heading', { name: 'Let’s compare notes.' }).count());
    await fallback.close();
  }
  console.log(`Personal site: six widths, accessibility, motion controls, roster links, and fallbacks passed. Screenshots: ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
