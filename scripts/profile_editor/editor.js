'use strict';
const form = document.querySelector('#editor');
const picker = document.querySelector('#profile');
const kindPicker = document.querySelector('#kind');
const message = document.querySelector('#message');
const saveButton = document.querySelector('#save');
let definition, initialValues, token, portraits = [], collections;
let kind = 'people';
let current = { data: {}, body: '', revision: null, slug: '' };
let readers = new Map();
let dirty = false, busy = false;
let previewState = { state: 'starting', message: 'Checking local preview…' };
let previewRequest = false;
let personalPreviewState = null;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function notify(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}
async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not complete the request');
  return data;
}
function post(url, data) {
  return api(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': token }, body: JSON.stringify(data) });
}
function markDirty() { dirty = true; if (kind === 'personal') renderPreview(); }
function canLeave() { return !busy && (!dirty || window.confirm('Discard your unsaved edits?')); }
function setBusy(value) {
  busy = value;
  for (const control of [picker, kindPicker, saveButton, document.querySelector('#new-profile'), document.querySelector('#reload')]) control.disabled = value;
  document.querySelector('#fields').inert = value;
  document.querySelector('#record-identifier').inert = value;
}
window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } });
form.addEventListener('input', markDirty);
form.addEventListener('change', markDirty);
function identifier() { return (kind === 'people' ? document.querySelector('#slug').value : document.querySelector('#record-slug').value).trim(); }
function slugify(value) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function uploadControl(category, complete) {
  const label = node('label', category === 'portrait' ? 'Upload a portrait' : 'Upload a file');
  const input = node('input'); input.type = 'file';
  if (category === 'portrait') input.accept = 'image/jpeg,image/png,image/webp';
  label.append(input);
  input.addEventListener('change', async () => {
    const file = input.files[0]; if (!file) return;
    if (file.size > 20 * 1024 * 1024) { notify('Upload files up to 20 MB; use an external link for larger datasets.', true); input.value = ''; return; }
    setBusy(true);
    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await post('/api/uploads', { category, slug: identifier(), name: file.name, content });
      complete(result, file.name); markDirty();
      notify('Uploaded ' + file.name + '. Save your changes to include its link.');
    } catch (error) { notify(error.message, true); }
    finally { setBusy(false); input.value = ''; }
  });
  return label;
}
function fieldControl(field, value, prefix = '') {
  const wrapper = node('div', undefined, 'field');
  const id = prefix + field.key;
  const label = node('label', field.label + (field.required ? ' *' : '')); label.htmlFor = id; wrapper.append(label);
  const helpText = field.help || (field.type === 'strings' && !field.choices ? 'One item per line.' : '');
  const help = node('p', helpText, 'help'); help.id = id + '-help';
  if (helpText) wrapper.append(help);
  let input, read;
  if (field.type === 'objects' || field.type === 'object') {
    label.removeAttribute('for');
    const rows = node('div');
    const add = node('button', 'Add ' + field.label.toLowerCase(), 'secondary'); add.type = 'button';
    function addRow(item) {
      const row = node('fieldset', undefined, 'award'); row.append(node('legend', field.label));
      const entries = field.fields.map(child => {
        const control = fieldControl(child, item[child.key] ?? child.default, id + '-' + crypto.randomUUID() + '-');
        row.append(control.wrapper); return [child.key, control.read];
      });
      row.readValue = () => ({ ...item, ...Object.fromEntries(entries.map(([key, get]) => [key, get()])) });
      const remove = node('button', 'Remove item', 'secondary'); remove.type = 'button';
      remove.addEventListener('click', () => { row.remove(); add.hidden = false; markDirty(); });
      row.append(remove); rows.append(row);
      if (field.type === 'object') add.hidden = true;
    }
    (field.type === 'object' ? (value && Object.keys(value).length ? [value] : []) : value || []).forEach(addRow);
    add.addEventListener('click', () => { addRow({}); markDirty(); });
    wrapper.append(rows, add);
    read = () => field.type === 'object' ? (rows.firstElementChild?.readValue() || {}) : Array.from(rows.children, row => row.readValue());
  } else if (field.type === 'strings' && field.choices) {
    const choices = node('fieldset'); choices.append(node('legend', field.label)); label.remove();
    for (const choice of field.choices) {
      const option = node('label', undefined, 'checkbox');
      const check = node('input'); check.type = 'checkbox'; check.value = choice.value; check.checked = (value || []).includes(choice.value);
      option.append(check, node('span', choice.label)); choices.append(option);
    }
    wrapper.append(choices);
    read = () => Array.from(choices.querySelectorAll('input:checked'), check => check.value);
  } else {
    if (field.type === 'boolean') {
      input = node('input'); input.type = 'checkbox'; input.checked = Boolean(value);
      label.className = 'checkbox'; label.prepend(input); read = () => input.checked;
    } else if (field.choices) {
      input = node('select');
      if (!field.required && field.allow_empty !== false) input.add(new Option('None', ''));
      for (const choice of field.choices) input.add(new Option(choice.label, choice.value));
      input.value = value || ''; read = () => input.value;
    } else if (field.type === 'strings' || field.multiline) {
      input = node('textarea'); input.value = field.type === 'strings' ? (value || []).join('\n') : value || '';
      read = () => field.type === 'strings' ? input.value.split('\n').map(line => line.trim()).filter(Boolean) : input.value;
    } else {
      input = node('input');
      input.type = field.type === 'integer' ? 'number' : ({ email: 'email', url: 'url' }[field.format] || 'text');
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.type === 'integer') input.step = '1';
      input.value = value ?? ''; read = () => field.type === 'integer' ? Number(input.value) : input.value.trim();
    }
    input.id = id; input.required = Boolean(field.required);
    if (helpText) input.setAttribute('aria-describedby', help.id);
    if (field.format === 'markdown') {
      input.rows = 12;
      wrapper.append(markdownToolbar(input).toolbar);
    }
    if (field.type !== 'boolean') wrapper.append(input);
    if (field.format === 'portrait') {
      const list = node('datalist'); list.id = 'portraits';
      portraits.forEach(path => { const option = node('option'); option.value = path; list.append(option); });
      input.setAttribute('list', list.id); wrapper.append(list);
      const preview = node('img', undefined, 'portrait-preview'); preview.alt = 'Selected portrait';
      function update() { preview.hidden = !input.value; if (input.value.startsWith('/images/people/')) preview.src = input.value; else preview.removeAttribute('src'); }
      input.addEventListener('input', update);
      wrapper.append(uploadControl('portrait', result => { input.value = result.url; update(); }), preview); update();
    }
    if (field.format === 'link') wrapper.append(uploadControl('download', result => { input.value = result.url; }));
  }
  return { wrapper, read };
}
function markdownToolbar(input) {
  const toolbar = node('div', undefined, 'toolbar');
  toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', 'Formatting for ' + input.id);
  function insert(before, after = '', fallback = '') {
    const text = input.value.slice(input.selectionStart, input.selectionEnd) || fallback;
    input.setRangeText(before + text + after, input.selectionStart, input.selectionEnd, 'end'); input.focus(); markDirty();
  }
  for (const [title, before, after, fallback] of [
    ['Heading', '\n## ', '\n', 'Heading'], ['Bold', '**', '**', 'text'], ['Italic', '*', '*', 'text'],
    ['Bullet', '\n- ', '', 'item'], ['Code', '`', '`', '$10'],
    ['Inline formula', '\\(', '\\)', 'x^2'], ['Equation', '\n\n$$\n', '\n$$\n\n', '\\sum_{i=1}^{n} x_i']
  ]) {
    const button = node('button', title, 'secondary'); button.type = 'button';
    button.addEventListener('click', () => insert(before, after, fallback)); toolbar.append(button);
  }
  return { toolbar, insert };
}
function bodyControl(container) {
  const title = definition.editor.body_label;
  const section = node('fieldset'); section.append(node('legend', title || 'Page text'));
  const label = node('label', title || 'Description / page content'); label.htmlFor = 'body';
  const input = node('textarea'); input.id = 'body'; input.value = current.body || ''; input.rows = 12;
  const { toolbar, insert } = markdownToolbar(input);
  const help = node('p', definition.editor.body_help || 'Write text here. The buttons insert Markdown and LaTeX math formatting; save and use the local preview to see the finished page.', 'help');
  help.id = 'body-help'; input.setAttribute('aria-describedby', help.id);
  section.append(label, help, toolbar, input);
  section.append(uploadControl(kind === 'personal' ? 'personal' : 'download', (result, name) => {
    insert((result.image ? '![' : '['), '](' + result.url + ')', name.replace(/[\[\]]/g, ''));
  }));
  container.append(section);
}
function previewUrl() {
  if (current.preview) return current.preview;
  if (kind === 'people') return '/people/' + (current.slug ? '#member-' + current.slug : '');
  if (kind === 'personal') return '/~' + identifier() + '/';
  return '/' + kind + '/' + (current.slug ? (current.data.slug || current.slug) + '/' : '');
}
function renderPreview() {
  const link = document.querySelector('#preview');
  const path = definition ? previewUrl() : '/people/';
  link.dataset.previewPath = path;
  const unsavedPage = kind === 'personal' && !current.revision && !current.personal_page?.enabled;
  const personalReady = personalPreviewState?.slug === current.slug && personalPreviewState.state === 'ready';
  const enabled = previewState.state === 'ready' && !unsavedPage && (kind !== 'personal' || personalReady);
  if (enabled) {
    link.href = previewState.url + path;
    link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex');
  } else {
    link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); link.tabIndex = -1;
  }
  document.querySelector('#preview-status').textContent = previewState.message;
  document.querySelector('#preview-start').hidden = !['failed', 'stopped'].includes(previewState.state);
  document.querySelector('#preview-error').hidden = !previewState.details;
  document.querySelector('#preview-error-text').textContent = previewState.details || '';
  const hint = document.querySelector('#preview-hint');
  hint.hidden = !unsavedPage;
  hint.textContent = unsavedPage ? 'Save this personal page before previewing it.' : '';
  const panel = document.querySelector('#personal-preview-panel');
  panel.hidden = kind !== 'personal';
  const frame = document.querySelector('#personal-preview-frame');
  const frameUrl = kind === 'personal' && enabled ? previewState.url + path : '';
  frame.hidden = !frameUrl;
  if (frameUrl) {
    if (frame.getAttribute('src') !== frameUrl) frame.src = frameUrl;
  } else frame.removeAttribute('src');
  document.querySelector('#preview-refresh').disabled = !frameUrl;
  document.querySelector('#personal-preview-note').textContent = unsavedPage ? 'Choose a template, add your text, then select Save and preview.'
    : !enabled ? (previewState.state === 'ready' ? 'Preparing your page preview…' : previewState.message)
    : dirty ? 'Saved version shown. Select Save and preview to see your edits.'
    : 'Your saved page. Changes reload automatically; open the full preview link above for a separate tab.';
}
async function checkPreview() {
  if (previewRequest) return;
  previewRequest = true;
  try {
    previewState = await api('/api/preview');
    if (kind === 'personal' && current.slug && (current.revision || current.personal_page?.enabled) && previewState.state === 'ready') {
      const slug = current.slug;
      const status = await api('/api/preview/personal/' + encodeURIComponent(slug));
      if (kind === 'personal' && current.slug === slug) personalPreviewState = { ...status, slug };
    }
  }
  catch { previewState = { state: 'stopped', message: 'Cannot reach the editor. Restart pixi run editor.' }; }
  finally { previewRequest = false; renderPreview(); }
}
function personalPageStatus() {
  const status = current.personal_page || { kind: 'none' };
  const wrapper = node('div', undefined, 'personal-page-status');
  const label = node('label', 'Personal page on this website'); label.htmlFor = 'personal-page-status';
  const output = node('output', {
    none: 'Not enabled', template: 'Enabled — template page', custom: 'Enabled — custom website',
    conflict: 'Conflict — both a template and custom website exist',
  }[status.kind]);
  output.id = 'personal-page-status';
  wrapper.append(label, output);
  if (status.url) wrapper.append(node('p', status.url, 'help'));
  return wrapper;
}
function render() {
  const container = document.querySelector('#fields'); container.replaceChildren(); readers = new Map();
  const personal = kind === 'personal';
  const custom = personal && current.personal_page?.kind === 'custom';
  document.querySelector('#personal-options').hidden = !personal;
  document.querySelector('#personal-mode-note').textContent = custom
    ? 'This member has a custom website. Preview it below and edit its files in the repository.'
    : 'Choose a template below for a simple page with ready-made styling. For full control, you can build your own website instead.';
  document.querySelector('#custom-site-guide').open = custom;
  document.querySelector('#custom-site-folder').textContent = 'static/~' + (current.slug || 'your-member-identifier') + '/';
  document.querySelector('#custom-site-url').textContent = '/~' + (current.slug || 'your-member-identifier') + '/';
  saveButton.hidden = custom;
  saveButton.textContent = personal ? 'Save and preview' : 'Save changes';
  const identity = document.querySelector('#record-identifier');
  identity.hidden = kind === 'people' || custom;
  document.querySelector('#record-slug').required = !identity.hidden;
  document.querySelector('#record-slug').value = current.slug;
  document.querySelector('#record-slug').readOnly = Boolean(current.slug) || kind === 'personal';
  if (custom) { renderPreview(); return; }
  let section;
  for (const field of definition.fields) {
    if (!section || field.section) {
      section = node('fieldset'); section.append(node('legend', field.section || collections[kind].label)); container.append(section);
    }
    const control = fieldControl(field, current.data[field.key] ?? initialValues[field.key]);
    section.append(control.wrapper); readers.set(field.key, control.read);
    if (kind === 'people' && field.key === 'homepage') control.wrapper.append(personalPageStatus());
  }
  if (kind === 'people' || kind === 'publications' || kind === 'data-sets') {
    const slug = kind === 'people' ? document.querySelector('#slug') : document.querySelector('#record-slug');
    slug.readOnly = kind !== 'people' && Boolean(current.slug);
    if (kind === 'people' && current.slug) {
      const warning = node('p', undefined, 'rename-warning');
      warning.id = 'rename-warning'; warning.setAttribute('role', 'status');
      slug.after(warning);
      slug.setAttribute('aria-describedby', 'slug-help rename-warning');
      function updateWarning() {
        warning.hidden = slug.value.trim() === current.slug;
        warning.textContent = 'Changing this identifier renames your member record and personal-site folder, and updates local links. Previously shared URLs will change. Custom sites with generated paths may need rebuilding. You will confirm before saving.';
      }
      slug.addEventListener('input', updateWarning); updateWarning();
    }
    if (!current.slug) {
      const name = document.querySelector(kind === 'people' ? '#name' : '#title');
      let manual = false; slug.oninput = () => { manual = Boolean(slug.value); };
      name.addEventListener('input', () => { if (!manual) slug.value = slugify(name.value); });
    }
  }
  if (collections[kind].body) bodyControl(container);
  renderPreview();
}
async function refreshList() {
  const records = await api('/api/records/' + kind);
  picker.replaceChildren();
  if (kind === 'personal') {
    const members = await api('/api/profiles');
    members.forEach(member => picker.add(new Option(member.name + (records.some(record => record.slug === member.slug) ? '' : ' — create page'), member.slug)));
  } else {
    picker.add(new Option('New entry', ''));
    records.forEach(record => picker.add(new Option(record.name, record.slug)));
  }
  picker.value = current.slug;
}
async function loadRecord(slug) {
  let record = { data: {}, body: '', revision: null };
  if (slug) {
    const records = await api('/api/records/' + kind);
    if (records.some(item => item.slug === slug)) record = await api('/api/records/' + kind + '/' + encodeURIComponent(slug));
    else if (kind !== 'personal') throw new Error('Record not found');
    if (kind === 'personal') record.personal_page = (await api('/api/profiles/' + encodeURIComponent(slug))).personal_page;
  }
  personalPreviewState = null;
  current = { ...record, slug }; dirty = false; picker.value = slug; render();
  notify(kind === 'personal' && record.personal_page?.kind === 'custom' ? 'Custom website selected. Its source files remain fully under your control.'
    : kind === 'personal' && !record.revision ? 'Choose a template and write your page. Save to add a Personal website link to your member card.' : 'Edit the form, save, then check the local preview.');
  if (kind === 'personal') await checkPreview();
}
async function changeKind(next) {
  const config = await api('/api/schema/' + next);
  kind = next; definition = config.schema; initialValues = config.defaults;
  current = { data: {}, body: '', revision: null, slug: '' };
  await refreshList();
  document.querySelector('#new-profile').hidden = kind === 'personal';
  await loadRecord(kind === 'personal' ? picker.options[0]?.value || '' : '');
}
async function run(action) {
  if (busy) return;
  setBusy(true);
  try { await action(); } catch (error) { notify(error.message, true); }
  finally { setBusy(false); kindPicker.value = kind; picker.value = current.slug; }
}
picker.addEventListener('change', () => { if (canLeave()) run(() => loadRecord(picker.value)); else picker.value = current.slug; });
kindPicker.addEventListener('change', () => { if (canLeave()) run(() => changeKind(kindPicker.value)); else kindPicker.value = kind; });
document.querySelector('#new-profile').addEventListener('click', () => { if (canLeave()) run(() => loadRecord('')); });
document.querySelector('#reload').addEventListener('click', () => { if (canLeave()) run(() => loadRecord(current.slug)); });
document.querySelector('#preview-start').addEventListener('click', async event => {
  event.target.disabled = true;
  try { previewState = await post('/api/preview/start', {}); }
  catch (error) { previewState = { state: 'failed', message: error.message }; }
  finally { event.target.disabled = false; renderPreview(); }
});
for (const [id, phone] of [['preview-wide', false], ['preview-phone', true]]) {
  document.querySelector('#' + id).addEventListener('click', () => {
    document.querySelector('#personal-preview-viewport').classList.toggle('phone', phone);
    document.querySelector('#preview-wide').setAttribute('aria-pressed', String(!phone));
    document.querySelector('#preview-phone').setAttribute('aria-pressed', String(phone));
  });
}
document.querySelector('#preview-refresh').addEventListener('click', () => {
  const frame = document.querySelector('#personal-preview-frame');
  if (frame.hasAttribute('src')) frame.src = frame.getAttribute('src');
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (kind === 'personal' && current.personal_page?.kind === 'custom') return;
  run(async () => {
    const values = Object.fromEntries(Array.from(readers, ([key, read]) => [key, read()]));
    const data = Object.fromEntries(Object.entries(values).filter(([key, value]) => key in current.data || JSON.stringify(value) !== JSON.stringify(initialValues[key]) || !current.revision));
    const slug = identifier();
    const payload = { kind, slug, data, revision: current.revision };
    if (kind === 'people' && current.slug && slug !== current.slug) {
      if (!window.confirm('Change member identifier from "' + current.slug + '" to "' + slug + '"?\n\nThis renames your member record and any matching personal-site folder, and updates local references. Old shared URLs and bookmarks will change. Custom sites may need rebuilding.\n\nSave these changes?')) return;
      payload.original_slug = current.slug;
      payload.confirm_rename = true;
    }
    if (collections[kind].body) payload.body = document.querySelector('#body').value;
    const result = await post('/api/records', payload);
    current = { ...await api('/api/records/' + kind + '/' + encodeURIComponent(slug)), slug };
    dirty = false; render(); await refreshList();
    notify('Saved ' + result.path + (result.moved ? '. Identifier changed; preview the profile and personal site, and update any shared old URLs.' : '.') + ' Preview your changes, then submit a pull request.');
    if (kind === 'personal') {
      await checkPreview();
      document.querySelector('#personal-preview-panel').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });
});
(async () => {
  setBusy(true);
  try {
    const [config, photos] = await Promise.all([api('/api/config'), api('/api/portraits')]);
    token = config.token; portraits = photos; collections = config.collections;
    kindPicker.replaceChildren();
    Object.entries(collections).forEach(([key, value]) => kindPicker.add(new Option(value.label, key)));
    await changeKind('people');
    await checkPreview();
    setInterval(checkPreview, 2000);
  } catch (error) { notify(error.message, true); }
  finally { setBusy(false); }
})();
