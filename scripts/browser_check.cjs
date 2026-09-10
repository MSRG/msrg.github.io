/* Optional browser regression checks. See README.md#browser-checks for setup. */
const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(process.argv[2] || 'public');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const output = fs.mkdtempSync(path.join(os.tmpdir(), `msrg-${engine}-`));
// Member-owned apps may use their own markup, external scripts and client routing.
// The shared site's browser contracts apply to Hugo pages, including its templates.
const staticRoot = path.resolve(__dirname, '../static');
const standalone = new Set(fs.readdirSync(staticRoot).filter(name =>
  name.startsWith('~') && fs.existsSync(path.join(staticRoot, name, 'index.html'))));
const files = fs.readdirSync(root, { recursive: true }).filter(file =>
  file.endsWith('.html') && !standalone.has(file.split(path.sep)[0]));
const routes = files.filter(file => !/http-equiv\s*=\s*["']?refresh/i.test(fs.readFileSync(path.join(root, file), 'utf8')))
  .map(file => '/' + file.replace(/index.html$/, ''));
const report = { engine, pages: routes.length, widths: [1440, 1024, 980, 768, 390, 320], overflow: [], errors: [], accessibility: [] };
report.pageCrawlSkipped = Boolean(process.env.SKIP_PAGE_CRAWL);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.statusCode = 404; file = path.join(root, '404.html'); }
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  response.end(fs.readFileSync(file));
});
let browser;
(async () => {
  let base = process.env.SITE_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  }
  report.baseURL = base;
  browser = await ({ chromium, firefox, webkit }[engine]).launch(
    process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {},
  );
  const createContext = async (options = {}, dismissNotice = true) => {
    const context = await browser.newContext(options);
    if (dismissNotice) await context.addInitScript(() => {
      try { localStorage.setItem('msrg_cookie_notice_accepted', 'true'); } catch { /* Initial blank documents have no storage. */ }
    });
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    context.on('page', page => page.on('pageerror', error => report.errors.push(error.message)));
    return context;
  };
  for (const width of process.env.SKIP_PAGE_CRAWL ? [] : report.widths) {
    const context = await createContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (overflow) report.overflow.push({ route, width });
      assert.equal(await page.locator('h1').count(), 1, `${route}: expected one main heading`);
    }
    console.log(`${engine}: ${routes.length} pages checked at ${width}px`);
    await context.close();
  }

  const context = await createContext({ viewport: { width: 390, height: 667 }, hasTouch: true }, false);
  const page = await context.newPage();
  await page.goto(base + '/people/');
  await page.locator('[data-cookie-accept]').click();
  await page.reload();
  assert.equal(await page.locator('[data-cookie-notice]').isVisible(), false, 'Notice dismissal must persist');
  const menu = page.locator('[data-nav-toggle]');
  await menu.click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  assert.equal(await menu.evaluate(element => element === document.activeElement), true);
  await menu.click();
  await page.locator('#site-nav a[href="/people/#alumni"]').click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'false', 'Same-page navigation must close menu');
  await page.waitForTimeout(400);
  assert(await page.locator('#alumni').evaluate(element => element.getBoundingClientRect().top >= 65), 'Alumni heading is hidden under header');
  await menu.click();
  await page.locator('#site-nav a[href="/data-sets/"]').click();
  await page.waitForURL('**/data-sets/');
  await page.setViewportSize({ width: 844, height: 390 });
  await menu.click();
  assert(await page.locator('#site-nav').evaluate(element => element.getBoundingClientRect().bottom <= innerHeight + 1), 'Landscape menu must fit the viewport');
  await page.locator('#site-nav a[href="/publications/"]').click();
  await page.waitForURL('**/publications/');
  await page.setViewportSize({ width: 390, height: 844 });
  const visible = page.locator('[data-publication-card]:visible');
  const total = await page.locator('[data-publication-card]').count();
  const search = page.locator('[data-publication-search]');
  await search.fill('Grier 2025'); assert.equal(await visible.count(), 1);
  await search.fill('Woisetschlager'); assert(await visible.count() > 0);
  await search.fill('Michael Dang’ana'); assert(await visible.count() > 0);
  await search.fill('no-result-xyz'); assert.equal(await visible.count(), 0);
  assert(await page.locator('[data-publication-empty]').isVisible());
  await page.locator('[data-publication-clear]').click(); assert.equal(await visible.count(), total);
  for (const button of await page.locator('[data-publication-tag]').all()) {
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert(await visible.count() > 0, 'Each advertised topic must have publications');
  }
  await page.locator('[data-publication-clear]').click();
  await page.locator('[data-publication-research]').selectOption('quantum-computing-systems');
  const quantumCount = await visible.count(); assert(quantumCount > 0 && quantumCount < total);
  await page.reload(); assert.equal(await visible.count(), quantumCount, 'Filters must survive reload');
  await page.goto(base + '/publications/?author=Grier+Jones'); assert(await visible.count() >= 2);
  await page.goto(base + '/publications/?tag=invalid&research=invalid'); assert.equal(await visible.count(), total);
  await page.goto(base + '/research/quantum-computing-systems/');
  await page.getByRole('link', { name: 'Browse all publications in this area' }).click();
  assert.equal(await visible.count(), quantumCount);
  await page.goto(base + '/people/');
  assert.equal(await page.locator('.person-card h3 a, .alumni-list li > span:first-child a').count(), 0, 'Member names must be plain text');
  // Snap at group starts; oversized groups must not create bottom-edge stops.
  const snapContext = await createContext();
  const snapPage = await snapContext.newPage();
  await snapPage.bringToFront();
  const rosterRoutes = ['/people/', '/research/quantum-computing-systems/', '/research/distributed-machine-learning/', '/research/data-management/'];
  for (const width of [1440, 390]) {
    await snapPage.setViewportSize({ width, height: 900 });
    for (const route of rosterRoutes) {
      await snapPage.goto(base + route);
      // Measure snap destinations independently of smooth-scroll animation timing.
      await snapPage.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
      await snapPage.evaluate(() => document.fonts.ready);
      await snapPage.waitForTimeout(100);
      if (route.startsWith('/research/')) {
        const opening = await snapPage.evaluate(() => {
          const hero = document.querySelector('.research-area .page-hero');
          const navigation = document.querySelector('.site-header').getBoundingClientRect();
          return {
            scroll: scrollY,
            gap: hero.querySelector('.eyebrow').getBoundingClientRect().top - navigation.bottom,
            border: parseFloat(getComputedStyle(hero).borderTopWidth),
          };
        });
        assert(Math.abs(opening.scroll) < 1, `${route}: opening snap must not scroll past the page top`);
        assert(opening.gap >= 16 && opening.gap <= 24, `${route}: opening spacing must be compact and visible`);
        assert.equal(opening.border, 0, `${route}: no colored line above the research header`);
        await snapPage.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
        await snapPage.mouse.wheel(0, -1500);
        await snapPage.waitForTimeout(500);
        assert(Math.abs(await snapPage.evaluate(() => scrollY)) < 1, `${route}: scrolling back up must reach the page top`);
      }
      const group = snapPage.locator('.roster-group').filter({ has: snapPage.locator('.section-context-sub', { hasText: /^PhD$/ }) });
      const bounds = await group.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        return { top: rect.top + scrollY - offset, bottom: rect.bottom + scrollY - innerHeight };
      });
      const scrollTo = async target => {
        await snapPage.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), target);
        let previous = await snapPage.evaluate(() => scrollY);
        let stable = 0;
        for (let attempt = 0; attempt < 30; attempt++) {
          await snapPage.waitForTimeout(100);
          const current = await snapPage.evaluate(() => scrollY);
          stable = Math.abs(current - previous) < 0.25 ? stable + 1 : 0;
          if (stable >= 3) return current;
          previous = current;
        }
        throw new Error(`${route}: scroll position did not settle`);
      };
      await scrollTo(bounds.top - 40);
      const headingAligned = await group.evaluate(element => {
        const heading = element.querySelector('.section-context-bar').getBoundingClientRect();
        const navigation = document.querySelector('.site-header').getBoundingClientRect();
        return Math.abs(heading.top - (navigation.bottom - 1)) < 2
          && element.getBoundingClientRect().top > navigation.bottom - heading.height;
      });
      assert(headingAligned, `${route} at ${width}px: group heading must snap flush below navigation`);
      if (bounds.bottom - bounds.top > 630) {
        const middle = (bounds.top + bounds.bottom) / 2;
        assert(Math.abs(await scrollTo(middle) - middle) < 2, `${route}: middle of a tall group must scroll freely`);
      }
      // Short groups legitimately remain within proximity of their top target.
      if (bounds.bottom - bounds.top > 270) {
        const pastBottom = bounds.bottom + 80;
        assert(Math.abs(await scrollTo(pastBottom) - pastBottom) < 2, `${route}: roster bottom must not create a snap stop`);
      }
    }
  }
  await snapContext.close();
  async function openPersonalPage() {
    const [personal] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('#member-thomas-trenty').getByRole('link', { name: 'MSRG personal page', exact: true }).click(),
    ]);
    await personal.waitForURL('**/~thomas-trenty/');
    await personal.getByRole('link', { name: 'MSRG people', exact: true }).click();
    await personal.waitForURL('**/people/');
    await personal.close();
  }
  await openPersonalPage();
  assert.equal(await page.locator('#member-hans-arno-jacobsen').getByRole('link', { name: 'External personal website', exact: true }).getAttribute('href'), 'https://www.eecg.toronto.edu/~jacobsen');
  await page.goto(base + '/research/quantum-computing-systems/');
  await openPersonalPage();
  for (const slug of ['hans-arno-jacobsen', 'grier-jones']) {
    const removed = await page.goto(base + `/people/${slug}/`);
    assert.equal(removed.status(), 404, 'Individual member pages must not be generated');
  }
  await page.goto(base + '/missing-page/'); assert(await page.getByRole('heading', { name: 'Page not found' }).isVisible());

  await page.goto(base + '/');
  const typingInput = page.locator('[data-msrg-input]');
  await typingInput.pressSequentially('msrg', { delay: 90 });
  assert.equal(await page.locator('[data-msrg-rounds]').textContent(), '1', 'Touch keyboard must complete a round');
  await page.waitForTimeout(650);
  await typingInput.fill('x'); assert.equal(await typingInput.inputValue(), '', 'Reject wrong letters');
  await typingInput.evaluate(element => element.blur());
  await page.keyboard.type('msrg', { delay: 90 });
  assert.equal(await page.locator('[data-msrg-rounds]').textContent(), '2', 'Hardware keyboard must complete a round');

  for (const route of ['/', '/people/', '/publications/', '/research/quantum-computing-systems/', '/data-sets/begen/', '/~thomas-trenty/', '/data-sets/']) {
    await page.goto(base + route);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(async () => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
    report.accessibility.push({ route, violations: results.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })) });
  }
  await page.goto(base + '/people/');
  await page.screenshot({ path: path.join(output, 'people-phone.png') });
  await page.locator('[data-nav-toggle]').click();
  await page.screenshot({ path: path.join(output, 'menu-phone.png') });
  await page.goto(base + '/publications/');
  await page.screenshot({ path: path.join(output, 'publications-phone.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/people/');
  await page.screenshot({ path: path.join(output, 'people-desktop.png') });
  await context.close();

  const noJS = await createContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const plain = await noJS.newPage();
  await plain.goto(base + '/'); assert(await plain.locator('#site-nav').isVisible(), 'Navigation needs a no-JS fallback');
  await plain.locator('#site-nav a[href="/publications/"]').click();
  assert.equal(await plain.locator('[data-publication-card]:visible').count(), total);
  assert.equal(await plain.locator('[data-publication-controls]').isVisible(), false);
  await noJS.close();

  const blockedStorage = await createContext({ viewport: { width: 390, height: 844 } }, false);
  await blockedStorage.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
    Object.defineProperty(document, 'cookie', { get() { throw new Error('Cookies unavailable'); }, set() { throw new Error('Cookies unavailable'); } });
  });
  const blocked = await blockedStorage.newPage();
  await blocked.goto(base + '/publications/');
  await blocked.locator('[data-cookie-accept]').click();
  await blocked.locator('[data-publication-search]').fill('Q-DICE');
  assert.equal(await blocked.locator('[data-publication-card]:visible').count(), 1);
  await blockedStorage.close();
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  assert.deepEqual(report.overflow, [], 'Horizontal overflow found');
  assert.deepEqual(report.errors, [], 'JavaScript errors found');
  assert(report.accessibility.every(item => item.violations.length === 0), 'Accessibility violations found');
  console.log(`${engine}: responsive, interaction, accessibility, no-JS, and storage-disabled checks passed. Artifacts: ${output}`);
})().catch(error => {
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.error(error); console.error(`Artifacts: ${output}`); process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); if (server.listening) server.close(); });
