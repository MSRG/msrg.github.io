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
  await page.context().route(base + '/~*/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><title>Personal preview</title></head><body><main><h1>Personal page preview fixture</h1></main></body></html>' }));
  await page.goto(base);
  console.log('Editor loaded');
  assert.equal(await page.locator('#new-profile').count(), 0);
  assert.equal(await page.locator('#save').textContent(), 'Create');
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
  await page.getByRole('button', { name: 'Add awards and funding', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.getByLabel('Award name').evaluate(input => input === document.activeElement), true);
  await page.getByLabel('Award name').fill('Example award');
  await page.getByLabel('Award page *', { exact: true }).fill('https://example.org/award');
  async function addItem(key, value) {
    await page.locator('#' + key).fill(value);
    await page.locator('#' + key).press('Enter');
    assert.equal(await page.locator('#' + key).inputValue(), '');
  }
  async function items(key) {
    return page.locator('#field-' + key + ' .item span').allTextContents();
  }
  async function pasteItems(key, text) {
    await page.locator('#' + key).evaluate((input, text) => {
      // Firefox does not retain clipboardData passed to a synthetic ClipboardEvent.
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
      input.dispatchEvent(event);
    }, text);
  }
  await addItem('author_names', 'J. Doe');
  await addItem('interests', 'Distributed Systems');
  await page.locator('#interests').fill('Quantum Computing');
  await page.getByRole('button', { name: 'Add to specialities', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Distributed Systems', exact: true }).click();
  assert.deepEqual(await items('interests'), ['Quantum Computing']);
  assert.equal(fs.existsSync(path.join(fixture, 'content/people/jane-doe.md')), false, 'Enter adds an item without submitting the form');
  async function save() {
    await Promise.all([
      page.waitForResponse(response => response.url() === base + '/api/records' && response.request().method() === 'POST'),
      page.locator('#save').click(),
    ]);
    await page.waitForFunction(() => !document.querySelector('#save').disabled);
    assert.match(await page.locator('#message').textContent(), /^Saved /);
  }
  async function choose(kind) {
    await page.locator('#kind').selectOption(kind);
    await page.waitForFunction(expected => !document.querySelector('#save').disabled && document.querySelector('#kind').value === expected, kind);
  }
  async function chooseEntry(slug) {
    await page.locator('#entry-toggle').click();
    await page.locator('#entry-options [data-value=' + JSON.stringify(slug) + ']').click();
  }
  await save();
  console.log('Profile saved');
  assert.equal(await page.locator('#save').textContent(), 'Save changes');
  assert.deepEqual(await items('author_names'), ['J. Doe']);
  assert.deepEqual(await items('interests'), ['Quantum Computing']);
  assert.equal(await page.locator('#slug').getAttribute('readonly'), null);
  await page.waitForFunction(() => { const image = document.querySelector('.portrait-preview'); return image.complete && image.naturalWidth > 0; });

  await choose('personal');
  console.log('Personal page form loaded');
  assert.equal(await page.locator('#save').textContent(), 'Create', 'A member can exist before their personal page');
  assert.equal(await page.locator('#kind option:checked').textContent(), 'Personal Pages');
  assert.equal(await page.locator('#custom_css').count(), 0);
  await page.locator('#custom-site-guide summary').click();
  assert.equal(await page.locator('#custom-site-folder').textContent(), 'static/~jane-doe/');
  assert.equal(await page.locator('#custom-site-folder').isVisible(), true);
  assert.equal(await page.locator('#preview').getAttribute('href'), null, 'An unsaved personal page cannot be previewed');
  const structuredFields = ['subtitle', 'tone', 'focus', 'primary_link', 'quick_links', 'highlights', 'timeline'];
  async function assertStructuredFields(visible) {
    for (const key of structuredFields) assert.equal(await page.locator('#field-' + key).isVisible(), visible, key);
  }
  await assertStructuredFields(false);

  await page.locator('#layout').selectOption('structured');
  await assertStructuredFields(true);
  await addItem('focus', 'Quantum systems');
  await page.locator('#body').fill('My research interests.');
  await page.getByRole('button', { name: 'Add highlights', exact: true }).click();
  await page.getByLabel('Title *', { exact: true }).fill('Research highlight');
  await page.getByRole('button', { name: 'Add primary link', exact: true }).click();
  assert.equal(await page.getByLabel('Label *', { exact: true }).evaluate(input => input === document.activeElement), true);
  await page.getByLabel('Label *', { exact: true }).fill('MSRG');
  await page.getByLabel('Link *', { exact: true }).fill('https://msrg.github.io/');
  await save();
  assert.equal(await page.locator('#save').textContent(), 'Save changes');
  assert.deepEqual(await items('focus'), ['Quantum systems']);
  await page.waitForFunction(() => document.querySelector('#preview').hasAttribute('href'));
  assert.match(await page.locator('#preview').getAttribute('href'), /\/~jane-doe\/$/);
  async function checkNewTabPreview(slug) {
    assert.equal(await page.locator('iframe').count(), 0);
    const [preview] = await Promise.all([
      page.waitForEvent('popup'), page.getByRole('link', { name: 'Open preview in new tab ↗', exact: true }).click(),
    ]);
    await preview.waitForLoadState();
    assert.equal(preview.url(), base + '/~' + slug + '/');
    assert.equal(await preview.getByRole('heading', { name: 'Personal page preview fixture' }).isVisible(), true);
    assert.equal(page.url(), base + '/');
    await preview.close();
  }
  await checkNewTabPreview('jane-doe');
  const timeline = page.locator('#field-timeline');
  const timelineRows = timeline.locator('.award');
  async function addTimeline(title) {
    await timeline.getByRole('button', { name: 'Add timeline', exact: true }).click();
    const row = timelineRows.last();
    await row.getByLabel('Title *', { exact: true }).fill(title);
    await row.getByLabel('Period', { exact: true }).fill('2026');
    await row.getByLabel('Description', { exact: true }).fill('Details for ' + title);
  }
  async function assertTimeline(titles) {
    assert.deepEqual(await timeline.locator('input[id$="-title"]').evaluateAll(inputs => inputs.map(input => input.value)), titles);
    assert.equal(await timelineRows.first().getByRole('button', { name: 'Move up', exact: true }).isDisabled(), true);
    assert.equal(await timelineRows.last().getByRole('button', { name: 'Move down', exact: true }).isDisabled(), true);
  }
  for (const title of ['First', 'Second', 'Third']) await addTimeline(title);
  await assertTimeline(['First', 'Second', 'Third']);
  await timelineRows.last().getByRole('button', { name: 'Move up', exact: true }).click();
  await assertTimeline(['First', 'Third', 'Second']);
  await page.setViewportSize({ width: 390, height: 900 });
  const moveDown = timelineRows.first().getByRole('button', { name: 'Move down', exact: true });
  await moveDown.focus(); await page.keyboard.press('Enter');
  await assertTimeline(['Third', 'First', 'Second']);
  await timelineRows.nth(1).getByRole('button', { name: 'Remove item', exact: true }).click();
  await assertTimeline(['Third', 'Second']);
  await addTimeline('Fourth');
  await save();
  await assertTimeline(['Third', 'Second', 'Fourth']);
  const savedPage = await (await page.request.get(base + '/api/records/personal/jane-doe')).json();
  assert.deepEqual(savedPage.data.timeline.map(item => [item.title, item.description]),
    ['Third', 'Second', 'Fourth'].map(title => [title, 'Details for ' + title]));
  // An incomplete field from another template must not block saving this one.
  await timeline.getByRole('button', { name: 'Add timeline', exact: true }).click();
  for (const layout of ['academic', 'single']) {
    await page.locator('#layout').selectOption(layout);
    await assertStructuredFields(false);
    await save();
    assert.equal(await page.locator('#body').inputValue(), 'My research interests.');
  }
  await page.locator('#layout').selectOption('structured');
  await assertStructuredFields(true);
  await assertTimeline(['Third', 'Second', 'Fourth']);
  await save();
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log('Template fields, hidden-field preservation, and timeline reordering passed');
  await page.getByRole('button', { name: 'Remove item', exact: true }).first().click();
  assert.equal(await page.getByRole('button', { name: 'Add primary link', exact: true }).evaluate(button => button === document.activeElement), true);
  await save();

  await choose('publications');
  console.log('Publication form loaded');
  assert.equal(await page.locator('#save').textContent(), 'Create');
  await page.locator('#title').fill('Example Paper');
  assert.equal(await page.locator('#date').count(), 0, 'Publication entry creation date is hidden');
  assert.equal(await page.locator('#record-slug').evaluate(input => input.readOnly), true);
  assert.equal(await page.locator('#record-slug').inputValue(), 'example-paper');
  await page.locator('#year').fill('2026');
  const publicationType = page.getByRole('combobox', { name: 'Publication type *', exact: true });
  assert.equal(await publicationType.inputValue(), 'Conference Paper');
  await publicationType.selectOption('Journal Article');
  assert.match(await page.locator('#publication_type-help').textContent(), /contact the site owner/i);
  assert.equal(await page.locator('#authors').evaluate(input => input.tagName), 'INPUT');
  assert.deepEqual(await page.locator('#authors-suggestions option').evaluateAll(options => options.map(option => [option.value, option.label])),
    [['Jane Doe', 'Jane Doe']], 'Suggest each member once');
  assert.equal(await page.locator('#authors').evaluate(input => input.checkValidity()), false, 'Empty authors are required');
  await addItem('authors', 'Jane Doe');
  assert.equal(await page.locator('#authors-suggestions option').count(), 0, 'Adding a member also hides their published variants');
  assert.equal(await page.locator('#authors').evaluate(input => input.checkValidity()), true, 'Added authors satisfy the required field');
  await page.getByRole('button', { name: 'Remove Jane Doe', exact: true }).click();
  assert.equal(await page.locator('#authors-suggestions option').count(), 1, 'Removing a member restores their suggestion');
  await page.locator('#authors').fill('j.');
  assert.deepEqual(await page.locator('#authors-suggestions option').evaluateAll(options => options.map(option => [option.value, option.label])),
    [['J. Doe', 'Jane Doe']], 'Search published variants without duplicating the member');
  await addItem('authors', ' j. doe ');
  assert.equal(await page.locator('#authors-suggestions option').count(), 0, 'Matching ignores case and surrounding whitespace');
  await page.getByRole('button', { name: 'Remove j. doe', exact: true }).click();
  await page.locator('#authors').fill('   ');
  assert.equal(await page.locator('#authors').evaluate(input => input.checkValidity()), false, 'Whitespace is not an author');
  await addItem('authors', 'J. Doe');
  assert.equal(await page.locator('#authors-suggestions option').count(), 0, 'A published variant also hides the member name');
  await pasteItems('authors', 'John Doe\r\n\r\nDoe, Alex');
  assert.deepEqual(await items('authors'), ['J. Doe', 'John Doe', 'Doe, Alex'], 'Pasted author order and commas are preserved');
  await page.locator('#authors').fill('External Author');
  await addItem('tags', 'quantum');
  await page.locator('#tags').fill('systems');
  await page.locator('#venue').fill('Example Conference');
  const publishedURL = page.getByLabel('Published / official URL', { exact: true });
  const preprintURL = page.getByLabel('Preprint URL', { exact: true });
  assert.equal(await publishedURL.evaluate(input => input.checkValidity()), false, 'At least one paper link is required');
  assert.match(await page.locator('#external_url-help').textContent(), /even if the paper is accepted/);
  assert.match(await page.locator('#preprint_url-help').textContent(), /less emphasis/);
  await publishedURL.fill('https://arxiv.org/abs/2601.01234');
  assert.match(await publishedURL.evaluate(input => input.validationMessage), /Put arXiv links in Preprint URL/);
  await preprintURL.fill('https://arxiv.org/abs/2601.01234');
  await publishedURL.fill('');
  assert.equal(await publishedURL.evaluate(input => input.checkValidity()), true, 'A preprint-only paper needs no published URL');
  await publishedURL.fill('https://example.org/paper');
  await page.getByLabel('Abstract', { exact: true }).fill('An abstract with ');
  const mathTools = page.getByRole('group', { name: 'Formatting for abstract', exact: true });
  await mathTools.getByRole('button', { name: 'Inline formula', exact: true }).click();
  assert.match(await page.locator('#abstract').inputValue(), /\\\(x\^2\\\)/);
  await mathTools.getByRole('button', { name: 'Equation', exact: true }).click();
  const abstract = await page.locator('#abstract').inputValue();
  assert.match(abstract, /\$\$\n\\sum_\{i=1\}\^\{n\} x_i\n\$\$/);
  await page.getByLabel('Additional notes', { exact: true }).fill('Companion notes. [Member](/people/#member-jane-doe)');
  const outcomeField = page.locator('#field-research_outcomes');
  const outcomeRows = outcomeField.locator('.award');
  const addOutcome = outcomeField.getByRole('button', { name: 'Add research outcome', exact: true });
  let expectedOutcomes = [
    { title: 'Public benchmark', url: 'https://example.org/benchmark', summary: 'Sample data and evaluation scripts.\nTwo public examples.' },
    { title: 'Project website', url: 'https://example.org/project', summary: 'Project overview and leaderboard.' },
  ];
  async function outcomeValues() {
    return outcomeRows.evaluateAll(rows => rows.map(row => Object.fromEntries(
      ['title', 'url', 'summary'].map(key => [key, row.querySelector(`[id$="-${key}"]`).value]))));
  }
  async function addOutcomeWithKeyboard(outcome) {
    await addOutcome.focus(); await page.keyboard.press('Enter');
    const row = outcomeRows.last();
    const title = row.getByLabel('Outcome name *', { exact: true });
    const url = row.getByLabel('Project or repository URL *', { exact: true });
    const summary = row.getByLabel('Description *', { exact: true });
    assert.equal(await title.evaluate(input => input === document.activeElement), true, 'Add focuses the first new field');
    assert.equal(await title.evaluate(input => input.checkValidity()), false, 'An added outcome requires a name');
    await page.keyboard.insertText(outcome.title);
    await page.keyboard.press('Tab');
    assert.equal(await url.evaluate(input => input === document.activeElement), true);
    await page.keyboard.insertText(outcome.url);
    await page.keyboard.press('Tab');
    assert.equal(await summary.evaluate(input => input === document.activeElement), true);
    assert.equal(await summary.evaluate(input => input.tagName), 'TEXTAREA');
    await page.keyboard.insertText(outcome.summary);
    return row;
  }
  async function removeOutcomeWithKeyboard(row) {
    await row.getByRole('button', { name: 'Remove item', exact: true }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await addOutcome.evaluate(button => button === document.activeElement), true, 'Remove returns focus to Add');
  }
  assert.equal(await outcomeRows.count(), 0, 'Outcomes are optional and initially empty');
  assert.equal(await addOutcome.getAttribute('aria-describedby'), 'research_outcomes-help');
  assert.match(await page.locator('#research_outcomes-help').textContent(), /automatically.*publication.*research areas/);
  await page.evaluate(() => {
    window.outcomeFocusEvents = [];
    document.addEventListener('focusin', event => {
      if (event.target.closest('#field-research_outcomes')) window.outcomeFocusEvents.push(event.target.id || event.target.textContent);
    });
  });
  await addOutcomeWithKeyboard(expectedOutcomes[0]);
  await addOutcomeWithKeyboard({ title: 'Temporary outcome', url: 'https://example.org/temp', summary: 'Remove this before creating the paper.' });
  await removeOutcomeWithKeyboard(outcomeRows.last());
  assert.deepEqual(await outcomeValues(), expectedOutcomes.slice(0, 1));
  await addOutcomeWithKeyboard(expectedOutcomes[1]);
  const outcomeUrl = outcomeRows.first().getByLabel('Project or repository URL *', { exact: true });
  await outcomeUrl.fill('http://example.org/benchmark');
  await page.locator('#save').click();
  await page.waitForFunction(() => document.querySelector('#message').classList.contains('error') && !document.querySelector('#save').disabled);
  assert.match(await page.locator('#message').textContent(), /research_outcomes\[0\]\.url: use a valid HTTPS URL/);
  assert.equal(fs.existsSync(path.join(fixture, 'content/publications/example-paper.md')), false);
  await outcomeUrl.fill(expectedOutcomes[0].url);
  await page.evaluate(() => { window.outcomeFocusEvents = []; });
  await save();
  assert.deepEqual(await page.evaluate(() => window.outcomeFocusEvents), [], 'Rendering saved outcomes must not steal focus');
  assert.deepEqual(await outcomeValues(), expectedOutcomes);
  assert.deepEqual((await (await page.request.get(base + '/api/records/publications/example-paper')).json()).data.research_outcomes, expectedOutcomes);
  assert.equal(await publishedURL.inputValue(), 'https://example.org/paper');
  assert.equal(await preprintURL.inputValue(), 'https://arxiv.org/abs/2601.01234');
  assert.equal(await page.locator('#save').textContent(), 'Save changes');
  assert.equal(await publicationType.inputValue(), 'Journal Article');
  assert.deepEqual(await items('authors'), ['J. Doe', 'John Doe', 'Doe, Alex', 'External Author'], 'Saving includes unfinished input');
  assert.deepEqual(await items('tags'), ['quantum', 'systems']);
  assert.equal(await page.locator('#record-slug').inputValue(), 'example-paper');
  await chooseEntry('');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#save').textContent === 'Create');
  assert.equal(await outcomeRows.count(), 0, 'A new publication starts with no outcomes');
  assert.deepEqual(await items('authors'), [], 'New entry resets the list controls');
  assert.deepEqual(await page.locator('#tags-suggestions option').evaluateAll(options => options.map(option => option.value)),
    ['quantum', 'systems'], 'Newly saved tags are immediately available for the next entry');
  await page.locator('#title').fill('Example Paper');
  await addItem('authors', 'Another Author');
  await page.locator('#venue').fill('Another Conference');
  assert.equal(await preprintURL.inputValue(), '', 'A new publication does not inherit another paper’s preprint');
  await preprintURL.fill('https://example.org/another-preprint');
  await save();
  assert.equal(await page.locator('#record-slug').inputValue(), 'example-paper-2');
  assert.equal(await outcomeRows.count(), 0, 'Publications can be created without outcomes or research areas');
  assert.equal(await page.locator('#profile').inputValue(), 'Example Paper');
  assert.match(await page.locator('#preview').getAttribute('href'), /\/publications\/example-paper-2\/$/);
  assert.equal(await page.locator('#record-slug').evaluate(input => input.readOnly), true);

  await choose('data-sets');
  console.log('Dataset form loaded');
  assert.equal(await page.locator('#save').textContent(), 'Create');
  await page.locator('#title').fill('Example Dataset');
  await addItem('aliases', '/previous-dataset/');
  await page.locator('#related_publication').selectOption('example-paper');
  await page.getByRole('button', { name: 'Add downloads', exact: true }).click();
  await page.getByLabel('Label *', { exact: true }).fill('Results CSV');
  await page.getByLabel('Upload a file', { exact: true }).first().setInputFiles({ name: 'results.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') });
  await page.waitForFunction(() => document.querySelector('#message').textContent.startsWith('Uploaded '));
  await save();
  assert.equal(await page.locator('#save').textContent(), 'Save changes');
  assert.deepEqual(await items('aliases'), ['/previous-dataset/']);
  assert.equal(fs.readdirSync(path.join(fixture, 'static/downloads')).length, 1);

  await choose('publications');
  console.log('Publication form loaded');
  assert.deepEqual(await page.locator('#tags-suggestions option').evaluateAll(options => options.map(option => option.value)), ['quantum', 'systems']);
  await page.evaluate(() => { window.outcomeFocusEvents = []; });
  await chooseEntry('example-paper');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#title').value === 'Example Paper');
  assert.deepEqual(await page.evaluate(() => window.outcomeFocusEvents), [], 'Loading an existing publication must not focus its outcomes');
  assert.deepEqual(await outcomeValues(), expectedOutcomes);
  await page.setViewportSize({ width: 390, height: 900 });
  const editedName = outcomeRows.first().getByLabel('Outcome name *', { exact: true });
  await editedName.focus(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText('Updated public benchmark');
  expectedOutcomes[0].title = 'Updated public benchmark';
  await removeOutcomeWithKeyboard(outcomeRows.last());
  expectedOutcomes = expectedOutcomes.slice(0, 1);
  await save();
  assert.deepEqual(await outcomeValues(), expectedOutcomes);
  const thirdOutcome = { title: 'New evaluation tools', url: 'https://example.org/evaluation', summary: 'Evaluation tools added to an existing publication.' };
  await addOutcomeWithKeyboard(thirdOutcome);
  expectedOutcomes.push(thirdOutcome);
  await save();
  await page.locator('#reload').focus();
  await page.evaluate(() => { window.outcomeFocusEvents = []; });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#message').textContent.startsWith('Edit the form'));
  assert.deepEqual(await page.evaluate(() => window.outcomeFocusEvents), [], 'Reload must not focus the populated outcome rows');
  assert.deepEqual(await outcomeValues(), expectedOutcomes);
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log('Optional publication outcomes: keyboard create/edit/remove/reload, HTTPS validation, and focus preservation passed');
  assert.equal(await preprintURL.inputValue(), 'https://arxiv.org/abs/2601.01234', 'Preprint survives reopening and outcome edits');
  await preprintURL.fill('');
  await save();
  assert.equal(await publishedURL.inputValue(), 'https://example.org/paper', 'Removing a preprint preserves the published link');
  await publishedURL.fill('');
  assert.equal(await publishedURL.evaluate(input => input.checkValidity()), false, 'Clearing both links prevents saving');
  await preprintURL.fill('https://arxiv.org/abs/2601.01234');
  await save();
  assert.equal(await publishedURL.inputValue(), '', 'A saved paper can retain only its preprint');
  await publishedURL.fill('https://example.org/paper');
  await save();
  assert.equal(await preprintURL.inputValue(), 'https://arxiv.org/abs/2601.01234', 'Adding the published version preserves its preprint');
  console.log('Publication versions: separate fields, preprint-only creation, published link addition, and removal checks passed');
  assert.equal(await publicationType.inputValue(), 'Journal Article', 'Publication type survives reopening');
  assert.equal(await page.locator('#abstract').inputValue(), abstract, 'LaTeX survives saving and reopening');
  assert.deepEqual(await items('authors'), ['J. Doe', 'John Doe', 'Doe, Alex', 'External Author']);
  assert.equal(await page.locator('#save').textContent(), 'Save changes');
  await page.getByLabel('Example Dataset', { exact: true }).check();
  await save();
  assert.deepEqual(await outcomeValues(), expectedOutcomes, 'Unrelated changes preserve research outcomes');
  const publication = path.join(fixture, 'content/publications/example-paper.md');
  fs.appendFileSync(publication, '\nChanged outside the editor.\n');
  const externalPublication = fs.readFileSync(publication, 'utf8');
  await removeOutcomeWithKeyboard(outcomeRows.last());
  await page.locator('#title').fill('Changed title');
  await page.locator('#save').click();
  await page.waitForFunction(() => document.querySelector('#message').classList.contains('error'));
  assert.match(await page.locator('#message').textContent(), /changed since you opened/);
  assert.equal(fs.readFileSync(publication, 'utf8'), externalPublication, 'A stale removal must not discard saved outcomes');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved entry' }).click();
  await page.waitForFunction(() => !document.querySelector('#save').disabled && !document.querySelector('#message').classList.contains('error'));
  assert.deepEqual(await outcomeValues(), expectedOutcomes, 'Reload restores the saved outcomes after a conflict');
  const originalPreview = await page.locator('#preview').getAttribute('href');
  await page.locator('#title').fill('Revised Paper');
  await save();
  assert.equal(await page.locator('#record-slug').inputValue(), 'example-paper');
  assert.equal(await page.locator('#preview').getAttribute('href'), originalPreview);
  assert.match(fs.readFileSync(publication, 'utf8'), /aliases = \["\/publications\/revised-paper\/"\]/);

  await choose('people');
  await chooseEntry('jane-doe');
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
      if (kind !== 'personal') {
        const slug = { people: 'jane-smith', publications: 'example-paper', 'data-sets': 'example-dataset' }[kind];
        await chooseEntry(slug);
        await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#save').textContent === 'Save changes');
      }
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
  await page.waitForFunction(() => document.querySelector('#preview').hasAttribute('href'));
  await checkNewTabPreview('jane-smith');
  previewState = { state: 'failed', message: 'Preview stopped', details: 'Example error' };
  await page.waitForFunction(() => document.querySelector('#preview').getAttribute('aria-disabled') === 'true');
  assert.equal(await page.locator('#preview').getAttribute('href'), null);
  assert.equal(await page.locator('#preview-start').isVisible(), true);

  // Native select popups can expand to their longest option. Exercise the
  // replacement with a large collection and a single option taller than it.
  const longTitle = 'Extremely long publication title: ' + 'Full title text must stay readable. '.repeat(30) + 'Unbroken'.repeat(60);
  function pickerFixture(slug, title) {
    fs.writeFileSync(path.join(fixture, 'content/publications', slug + '.md'),
      '+++\ntitle = ' + JSON.stringify(title) + '\nyear = 2026\nauthors = ["Example Author"]\nvenue = "Example"\npublication_type = "Conference Paper"\nexternal_url = "https://example.org/paper"\n+++\n');
  }
  pickerFixture('picker-long', longTitle);
  pickerFixture('picker-duplicate-a', 'Repeated publication title');
  pickerFixture('picker-duplicate-b', 'Repeated publication title');
  for (let i = 0; i < 80; i++) pickerFixture('picker-' + i, 'Picker sample ' + String(i).padStart(3, '0'));
  await choose('publications');
  const entry = page.locator('#profile'), entryMenu = page.locator('#entry-menu');
  const entryOptions = page.locator('#entry-options [role="option"]');
  const menuScreenshots = fs.mkdtempSync(path.join(os.tmpdir(), `msrg-entry-${engine}-`));
  for (const [width, height] of [[1440, 900], [800, 600], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await entry.scrollIntoViewIfNeeded();
    await entry.fill('Extremely long');
    assert.equal(await entryOptions.count(), 1);
    assert.equal(await entryOptions.first().textContent(), longTitle, 'Retain the full option label');
    assert.equal(await entryOptions.first().getAttribute('aria-selected'), 'true', 'Filtered active suggestion is selected for assistive technology');
    const bounds = await page.evaluate(() => {
      const menu = document.querySelector('#entry-menu'), list = document.querySelector('#entry-options'), control = document.querySelector('.entry-control');
      const rect = menu.getBoundingClientRect(), field = control.getBoundingClientRect();
      const row = menu.querySelector('[role=option]').getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        width: rect.width, fieldWidth: field.width, height: rect.height, rowHeight: row.height,
        rowTop: row.top, scrolling: list.scrollHeight > list.clientHeight,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        menuOverflow: list.scrollWidth > list.clientWidth + 1 };
    });
    assert(bounds.left >= 0 && bounds.right <= width + 1 && bounds.top >= 0 && bounds.bottom <= height + 1, 'Menu must stay within viewport');
    assert(bounds.width <= bounds.fieldWidth + 1 && bounds.height <= Math.min(320, height * .45) + 1);
    assert(bounds.scrolling && bounds.rowHeight > bounds.height, 'Exercise an option taller than the menu');
    assert(Math.abs(bounds.rowTop - bounds.top) < 8, 'A tall option initially shows the start of its title');
    assert.equal(bounds.overflow || bounds.menuOverflow, false);
    const beforeScroll = await page.evaluate(() => scrollY);
    await entry.press('PageDown');
    assert(await page.locator('#entry-options').evaluate(list => list.scrollTop > 50), 'Keyboard users can read the rest of a tall option');
    assert.equal(await page.evaluate(() => scrollY), beforeScroll);
    await entry.press('PageUp');
    assert(await page.locator('#entry-options').evaluate(list => list.scrollTop < 10));
    const menuBox = await entryMenu.boundingBox();
    await page.mouse.move(menuBox.x + 20, menuBox.y + menuBox.height / 2);
    await page.mouse.wheel(0, 150);
    await page.waitForFunction(() => document.querySelector('#entry-options').scrollTop > 50);
    assert.equal(await page.evaluate(() => scrollY), beforeScroll, 'Wheel scrolling stays inside the menu');
    await entry.press('Escape');
    assert.equal(await entry.inputValue(), 'New entry');
    assert.equal(await page.locator('#title').inputValue(), '');
    await page.locator('#entry-toggle').click();
    assert.equal(await entryOptions.count(), 86);
    await page.screenshot({ path: path.join(menuScreenshots, `entries-${width}.png`) });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    assert.deepEqual(await page.evaluate(async () => (await axe.run()).violations.map(v => v.id)), [], 'Open entry menu accessibility');
    await entry.press('Escape');
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => scrollTo(0, 0));
  await entry.press('ArrowDown');
  assert.equal(await entryMenu.isVisible(), true);
  await page.mouse.move(20, 250); await page.mouse.wheel(0, 500);
  await page.waitForFunction(() => document.querySelector('#entry-menu').hidden);
  assert.equal(await entry.getAttribute('aria-expanded'), 'false', 'Dismiss when document scrolling hides the control');
  assert.equal(await entry.getAttribute('aria-activedescendant'), null);
  assert.equal(await entry.inputValue(), 'New entry');
  assert.equal(await page.locator('#record-slug').inputValue(), '');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await entry.press('ArrowDown');
  assert.equal(await entryMenu.isVisible(), true);
  await page.setViewportSize({ width: 390, height: 360 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector('#entry-menu').hidden);
  assert.equal(await entry.getAttribute('aria-expanded'), 'false', 'Dismiss when resizing hides the control');
  assert.equal(await entry.getAttribute('aria-activedescendant'), null);
  assert.equal(await entry.inputValue(), 'New entry');
  assert.equal(await page.locator('#record-slug').inputValue(), '');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => scrollTo(0, 0));
  await entry.fill('No matching entry xyz');
  assert.equal(await entryOptions.count(), 0);
  assert.equal(await page.locator('#entry-empty').isVisible(), true);
  assert.equal(await entry.getAttribute('aria-activedescendant'), null);
  await entry.press('Escape');
  assert.equal(await entry.inputValue(), 'New entry');
  await entry.press('ArrowDown');
  await page.mouse.move(0, 0);
  const beforeKeys = await page.evaluate(() => scrollY);
  for (let i = 0; i < 45; i++) await entry.press('ArrowDown');
  assert.equal(await page.locator('#entry-options [aria-selected="true"]').count(), 1);
  assert.equal(await page.locator('#' + await entry.getAttribute('aria-activedescendant')).getAttribute('aria-selected'), 'true');
  assert.equal(await page.evaluate(() => scrollY), beforeKeys, 'Keyboard navigation scrolls only the menu');
  assert.equal(await page.locator('#record-slug').inputValue(), '', 'Highlighting does not select a record');
  await entry.press('Escape');
  await entry.fill('Picker sample 037');
  await entry.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#record-slug').value === 'picker-37');
  assert.equal(await entry.evaluate(input => input === document.activeElement), true, 'Focus returns after loading the chosen record');
  assert.equal(await entryMenu.isVisible(), false);
  await entry.fill('Uncommitted search');
  await entry.press('Tab');
  assert.equal(await entry.inputValue(), 'Picker sample 037');
  assert.equal(await entryMenu.isVisible(), false);
  await entry.fill('Picker sample 038');
  await page.locator('h1').click();
  assert.equal(await entry.inputValue(), 'Picker sample 037', 'Outside clicks dismiss without changing the record');
  assert.equal(await page.locator('#record-slug').inputValue(), 'picker-37');
  await entry.fill('Repeated publication title');
  assert.equal(await entryOptions.count(), 2);
  await page.locator('#entry-options [data-value="picker-duplicate-b"]').click();
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#record-slug').value === 'picker-duplicate-b');
  assert.equal(await entry.inputValue(), 'Repeated publication title');

  await chooseEntry('example-paper');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#record-slug').value === 'example-paper');
  const unsavedOutcome = page.locator('#field-research_outcomes input[id$="-title"]').first();
  await unsavedOutcome.fill('Keep this unsaved outcome');
  await entry.fill('Picker sample 037');
  let discardPrompted = false;
  page.once('dialog', dialog => { discardPrompted = true; dialog.dismiss(); });
  await entry.press('Enter');
  assert.equal(discardPrompted, true, 'Selecting another entry must prompt before discarding edits');
  assert.equal(await entry.inputValue(), 'Revised Paper');
  assert.equal(await page.locator('#record-slug').inputValue(), 'example-paper');
  assert.equal(await unsavedOutcome.inputValue(), 'Keep this unsaved outcome');
  await entry.fill('Picker sample 037');
  discardPrompted = false;
  page.once('dialog', dialog => { discardPrompted = true; dialog.accept(); });
  await entry.press('Enter');
  assert.equal(discardPrompted, true);
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#record-slug').value === 'picker-37');

  const failedRecordURL = base + '/api/records/publications/picker-38';
  await page.route(failedRecordURL, route => route.fulfill({ status: 500, json: { error: 'Could not load test entry' } }));
  await entry.fill('Picker sample 038'); await entry.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#message').classList.contains('error'));
  assert.equal(await entry.inputValue(), 'Picker sample 037', 'A failed load restores the current selection');
  assert.equal(await page.locator('#record-slug').inputValue(), 'picker-37');
  await page.unroute(failedRecordURL);
  let releaseLoad;
  const pausedLoad = new Promise(resolve => { releaseLoad = resolve; });
  const delayedRecordURL = base + '/api/records/publications/picker-39';
  await page.route(delayedRecordURL, async route => { await pausedLoad; await route.continue(); });
  await entry.fill('Picker sample 039'); await entry.press('Enter');
  try {
    await page.waitForFunction(() => document.querySelector('#profile').disabled);
    assert.equal(await page.locator('#entry-toggle').isDisabled(), true);
    assert.equal(await entryMenu.isVisible(), false);
  } finally { releaseLoad(); }
  await page.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#record-slug').value === 'picker-39');
  await page.unroute(delayedRecordURL);
  if (engine === 'chromium') {
    // Use the real visual viewport at mobile pinch zoom, not a mocked object.
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const phone = await mobile.newPage();
      phone.on('pageerror', error => errors.push(error.message));
      await phone.route(base + '/api/preview', route => route.fulfill({ json: previewState }));
      await phone.goto(base);
      await phone.waitForFunction(() => !document.querySelector('#save').disabled);
      await phone.locator('#kind').selectOption('publications');
      await phone.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#title'));
      const input = phone.locator('#profile');
      await input.fill('Picker sample');
      const cdp = await mobile.newCDPSession(phone);
      await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
      await phone.waitForFunction(() => visualViewport.scale === 2);
      await phone.evaluate(() => scrollTo(0, document.querySelector('.entry-control').getBoundingClientRect().top + scrollY - 50));
      await input.fill('Picker sample 037');
      assert.equal(await input.inputValue(), 'Picker sample 037', 'Zoom must not discard the typed query');
      assert.equal(await phone.locator('#entry-menu').isVisible(), true);
      const zoomBounds = await phone.evaluate(() => {
        const menu = document.querySelector('#entry-menu').getBoundingClientRect();
        const control = document.querySelector('.entry-control').getBoundingClientRect();
        const viewport = visualViewport;
        return { left: menu.left, right: menu.right, top: menu.top, bottom: menu.bottom,
          visibleLeft: viewport.offsetLeft, visibleTop: viewport.offsetTop,
          visibleRight: viewport.offsetLeft + viewport.width, visibleBottom: viewport.offsetTop + viewport.height,
          controlWidth: control.width, visibleWidth: viewport.width };
      });
      assert(zoomBounds.controlWidth > zoomBounds.visibleWidth, 'Exercise a partly visible control at 2× zoom');
      assert(zoomBounds.left >= zoomBounds.visibleLeft && zoomBounds.right <= zoomBounds.visibleRight + 1 &&
        zoomBounds.top >= zoomBounds.visibleTop && zoomBounds.bottom <= zoomBounds.visibleBottom + 1, 'Zoomed menu stays inside the visual viewport');
      assert.equal(await phone.locator('#record-slug').inputValue(), '', 'Zoomed search does not commit by itself');
      await phone.screenshot({ path: path.join(menuScreenshots, 'entries-mobile-2x.png') });
      await input.press('Enter');
      await phone.waitForFunction(() => !document.querySelector('#save').disabled && document.querySelector('#record-slug').value === 'picker-37');
      assert.equal(await input.inputValue(), 'Picker sample 037');
      assert.equal(await phone.locator('#title').inputValue(), 'Picker sample 037');
      console.log('chromium: mobile 2× zoom preserves search, bounds the popup, and selects the intended record');
    } finally { await mobile.close(); }
  }
  console.log(`${engine}: bounded long-title entry picker, search, keyboard, dismissal, duplicate titles, dirty cancellation, and failed/busy loads passed. Screenshots: ${menuScreenshots}`);
  assert.deepEqual(errors, []);
  console.log(`${engine}: profile photo, awards, personal templates, publications and outcomes, dataset uploads, conflicts, accessibility and desktop/mobile layouts passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server.exitCode === null) { const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill(); await stopped; }
  fs.rmSync(fixture, { recursive: true, force: true });
});
