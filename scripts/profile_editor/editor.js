'use strict';
const form = document.querySelector('#editor');
const picker = createEntryPicker(async value => {
  if (canLeave()) await run(() => loadRecord(value));
  else picker.value = current.slug;
});
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
function createEntryPicker(select) {
  const input = document.querySelector('#profile');
  const toggle = document.querySelector('#entry-toggle');
  const wrapper = input.closest('.entry-picker');
  const control = wrapper.querySelector('.entry-control');
  const menu = document.querySelector('#entry-menu');
  const list = document.querySelector('#entry-options');
  const empty = document.querySelector('#entry-empty');
  let options = [], matches = [], value = '', active = -1;
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().trim();
  function resetText() {
    input.value = options.find(option => option.value === value)?.label || '';
    input.title = input.value;
  }
  function close() {
    menu.hidden = true;
    input.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Show entries');
    input.removeAttribute('aria-activedescendant');
    resetText();
  }
  function position() {
    if (menu.hidden) return;
    const rect = control.getBoundingClientRect();
    const parent = wrapper.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0;
    const height = viewport?.height || window.innerHeight;
    const left = viewport?.offsetLeft || 0;
    const width = viewport?.width || window.innerWidth;
    if (rect.bottom <= top || rect.top >= top + height || rect.right <= left || rect.left >= left + width) {
      close(); return;
    }
    // Pinch zoom can make the visible viewport narrower than the control.
    // Keep the popup inside it while the control is at least partly visible.
    const menuWidth = Math.min(rect.width, Math.max(0, width - 16));
    const menuLeft = Math.max(left + 8, Math.min(rect.left, left + width - 8 - menuWidth));
    menu.style.left = menuLeft - parent.left + 'px';
    menu.style.right = 'auto';
    menu.style.width = menuWidth + 'px';
    const below = top + height - rect.bottom - 8;
    const above = rect.top - top - 8;
    const limit = Math.min(320, height * .45);
    const upward = below < limit && above > below;
    menu.style.maxHeight = Math.max(0, Math.min(limit, upward ? above : below)) + 'px';
    menu.style.top = upward ? 'auto' : rect.bottom - parent.top + 4 + 'px';
    menu.style.bottom = upward ? parent.bottom - rect.top + 4 + 'px' : 'auto';
  }
  function activate(index, scroll = true) {
    active = index;
    for (const [i, row] of Array.from(list.children).entries()) {
      row.classList.toggle('active', i === active);
      row.setAttribute('aria-selected', String(i === active));
    }
    const row = list.children[active];
    if (!row) { input.removeAttribute('aria-activedescendant'); return; }
    input.setAttribute('aria-activedescendant', row.id);
    if (!scroll) return;
    const bounds = list.getBoundingClientRect(), item = row.getBoundingClientRect();
    // Scroll the list only; selecting an option must not jump the whole page.
    if (item.height > bounds.height || item.top < bounds.top) list.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom) list.scrollTop += item.bottom - bounds.bottom;
  }
  async function choose(index) {
    const option = matches[index];
    if (!option || input.disabled) return;
    close(); input.focus();
    if (option.value !== value) await select(option.value);
    if (document.activeElement === document.body) input.focus();
  }
  function open(query = '') {
    if (input.disabled) return;
    const words = normalize(query).split(/\s+/).filter(Boolean);
    matches = options.filter(option => words.every(word => normalize(option.label).includes(word)));
    list.replaceChildren();
    matches.forEach((option, index) => {
      const row = node('li', option.label); row.id = 'entry-option-' + index;
      row.setAttribute('role', 'option'); row.setAttribute('aria-selected', 'false');
      row.dataset.value = option.value;
      row.addEventListener('pointerdown', event => { if (event.button === 0) event.preventDefault(); });
      row.addEventListener('click', () => choose(index));
      row.addEventListener('pointerenter', () => activate(index, false));
      list.append(row);
    });
    empty.hidden = matches.length !== 0;
    menu.hidden = false; list.scrollTop = 0;
    input.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Hide entries');
    position();
    if (menu.hidden) return;
    const selected = query ? 0 : matches.findIndex(option => option.value === value);
    activate(matches.length ? Math.max(0, selected) : -1);
  }
  input.addEventListener('focus', () => input.select());
  input.addEventListener('click', () => { if (menu.hidden) { open(); input.select(); } });
  input.addEventListener('input', () => {
    input.title = '';
    // Focus scrolling may finish after input in Firefox; anchor typed results
    // before positioning them, especially when returning from a long form.
    control.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    open(input.value);
  });
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      if (!menu.hidden) { event.preventDefault(); event.stopPropagation(); }
      close();
    } else if (event.key === 'Tab') close();
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.altKey && event.key === 'ArrowUp') close();
      else if (menu.hidden) open();
      else if (matches.length) activate(Math.max(0, Math.min(matches.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))));
    } else if ((event.key === 'PageDown' || event.key === 'PageUp') && !menu.hidden) {
      event.preventDefault();
      list.scrollTop += list.clientHeight * .8 * (event.key === 'PageDown' ? 1 : -1);
      const top = list.getBoundingClientRect().top;
      activate(Array.from(list.children).findIndex(row => row.getBoundingClientRect().bottom > top + 4), false);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (menu.hidden) open(); else choose(active);
    }
  });
  toggle.addEventListener('pointerdown', event => { if (event.button === 0) event.preventDefault(); });
  toggle.addEventListener('click', () => { input.focus(); if (menu.hidden) open(); else close(); });
  wrapper.addEventListener('focusout', event => { if (!wrapper.contains(event.relatedTarget)) close(); });
  document.addEventListener('pointerdown', event => { if (!wrapper.contains(event.target)) close(); });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, { capture: true, passive: true });
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
  return {
    get value() { return value; },
    set value(next) { value = next; close(); },
    get options() { return options; },
    setOptions(next) { options = next; close(); },
    set disabled(disabled) { input.disabled = disabled; toggle.disabled = disabled; if (disabled) close(); },
  };
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
  for (const control of [picker, kindPicker, saveButton, document.querySelector('#reload')]) control.disabled = value;
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
function itemControl(field, value, id, helpId) {
  const container = node('div', undefined, 'item-control');
  const items = node('ul', undefined, 'items');
  items.setAttribute('aria-label', field.label + ' added items');
  const entry = node('div', undefined, 'item-entry');
  const input = node('input'); input.type = 'text'; input.id = id;
  input.autocomplete = 'off';
  input.placeholder = field.suggestions_source === 'member_names' ? 'Search members or type an author' : 'Type an item';
  input.setAttribute('aria-describedby', helpId);
  const add = node('button', 'Add', 'secondary'); add.type = 'button';
  add.setAttribute('aria-label', 'Add to ' + field.label.toLowerCase());
  const suggestions = node('datalist'); suggestions.id = id + '-suggestions';
  if (field.suggestions?.length) input.setAttribute('list', suggestions.id);
  let values = [...(value || [])];
  function validate() {
    input.required = Boolean(field.required) && values.length === 0;
    input.setCustomValidity(input.required && input.value && !input.value.trim() ? 'Add at least one item.' : '');
  }
  function updateSuggestions() {
    const normalize = text => text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    const selected = new Set(values.map(normalize));
    const query = normalize(input.value);
    suggestions.replaceChildren();
    for (const suggestion of field.suggestions || []) {
      const names = [suggestion.value, ...(suggestion.aliases || [])];
      if (names.some(name => selected.has(normalize(name)))) continue;
      // Offer one spelling per person, matching a published variant when searched.
      const value = names.find(name => normalize(name).includes(query));
      if (value === undefined) continue;
      const option = node('option'); option.value = value; option.label = suggestion.label;
      suggestions.append(option);
    }
  }
  function renderItems() {
    items.replaceChildren(); items.hidden = values.length === 0;
    values.forEach((value, index) => {
      const item = node('li', undefined, 'item');
      const remove = node('button', '×', 'secondary'); remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + value);
      remove.addEventListener('click', () => {
        values.splice(index, 1); renderItems(); markDirty(); input.focus();
      });
      item.append(node('span', value), remove); items.append(item);
    });
    updateSuggestions(); validate();
  }
  function append(text) {
    const added = text.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (!added.length) return;
    values.push(...added); input.value = ''; renderItems(); markDirty();
  }
  input.addEventListener('input', () => { validate(); updateSuggestions(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault(); append(input.value);
    }
  });
  input.addEventListener('paste', event => {
    const text = event.clipboardData.getData('text');
    if (!/[\r\n]/.test(text)) return;
    event.preventDefault();
    append(input.value.slice(0, input.selectionStart) + text + input.value.slice(input.selectionEnd));
  });
  add.addEventListener('click', () => { append(input.value); input.focus(); });
  entry.append(input, add); container.append(items, entry, suggestions); renderItems();
  // Include unfinished input when saving, even if Enter or Add was not used.
  return { container, read: () => [...values, ...input.value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)] };
}
function fieldControl(field, value, prefix = '') {
  const wrapper = node(field.templates ? 'fieldset' : 'div', undefined, field.templates ? 'field template-field' : 'field');
  const id = prefix + field.key;
  const label = node('label', field.label + (field.required ? ' *' : '')); label.htmlFor = id; wrapper.append(label);
  const helpText = [field.help, field.type === 'strings' && !field.choices
    ? 'Type an item and press Enter or choose Add. Remove an item with its × button.' : ''].filter(Boolean).join(' ');
  const help = node('p', helpText, 'help'); help.id = id + '-help';
  if (helpText) wrapper.append(help);
  let input, read;
  if (field.type === 'objects' || field.type === 'object') {
    label.removeAttribute('for');
    const rows = node('div');
    const add = node('button', field.add_label || 'Add ' + field.label.toLowerCase(), 'secondary'); add.type = 'button';
    if (helpText) add.setAttribute('aria-describedby', help.id);
    function updateOrderControls() {
      Array.from(rows.children).forEach((row, index) => {
        if (!field.reorderable) return;
        row.querySelector('legend').textContent = field.label + ' ' + (index + 1);
        row.querySelector('[data-move="up"]').disabled = index === 0;
        row.querySelector('[data-move="down"]').disabled = index === rows.children.length - 1;
      });
    }
    function addRow(item) {
      const row = node('fieldset', undefined, 'award'); row.append(node('legend', field.label));
      const entries = field.fields.map(child => {
        const control = fieldControl(child, item[child.key] ?? child.default, id + '-' + crypto.randomUUID() + '-');
        row.append(control.wrapper); return [child.key, control.read];
      });
      row.readValue = () => ({ ...item, ...Object.fromEntries(entries.map(([key, get]) => [key, get()])) });
      const actions = node('div', undefined, 'row-actions');
      if (field.reorderable) {
        row.tabIndex = -1;
        for (const direction of ['up', 'down']) {
          const move = node('button', 'Move ' + direction, 'secondary'); move.type = 'button'; move.dataset.move = direction;
          move.addEventListener('click', () => {
            const neighbor = direction === 'up' ? row.previousElementSibling : row.nextElementSibling;
            if (!neighbor) return;
            if (direction === 'up') rows.insertBefore(row, neighbor);
            else rows.insertBefore(neighbor, row);
            updateOrderControls(); markDirty();
            (move.disabled ? row : move).focus();
          });
          actions.append(move);
        }
      }
      const remove = node('button', 'Remove item', 'secondary'); remove.type = 'button';
      remove.addEventListener('click', () => {
        row.remove(); add.hidden = false; updateOrderControls(); markDirty(); add.focus();
      });
      actions.append(remove); row.append(actions); rows.append(row); updateOrderControls();
      if (field.type === 'object') add.hidden = true;
      return row;
    }
    (field.type === 'object' ? (value && Object.keys(value).length ? [value] : []) : value || []).forEach(addRow);
    add.addEventListener('click', () => {
      const row = addRow({}); markDirty();
      row.querySelector('input:not([type="hidden"]):enabled, select:enabled, textarea:enabled, button:enabled:not([hidden])')?.focus();
    });
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
  } else if (field.type === 'strings') {
    const control = itemControl(field, value, id, help.id);
    wrapper.append(control.container); read = control.read;
  } else {
    if (field.type === 'boolean') {
      input = node('input'); input.type = 'checkbox'; input.checked = Boolean(value);
      label.className = 'checkbox'; label.prepend(input); read = () => input.checked;
    } else if (field.choices) {
      input = node('select');
      if (!field.required && field.allow_empty !== false) input.add(new Option('None', ''));
      for (const choice of field.choices) input.add(new Option(choice.label, choice.value));
      input.value = value || ''; read = () => input.value;
    } else if (field.multiline) {
      input = node('textarea'); input.value = value || '';
      read = () => input.value;
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
  hint.hidden = !unsavedPage && !dirty;
  hint.textContent = unsavedPage ? 'Save this personal page before previewing it.'
    : dirty ? 'Save your changes before opening the preview to see your latest edits.' : '';
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
  saveButton.textContent = current.revision ? 'Save changes' : 'Create';
  const identity = document.querySelector('#record-identifier');
  identity.hidden = kind === 'people' || custom;
  document.querySelector('#record-slug').required = !identity.hidden;
  document.querySelector('#record-slug').value = current.slug;
  document.querySelector('#record-slug').readOnly = Boolean(current.slug) || kind === 'personal';
  document.querySelector('#record-slug-help').textContent = kind === 'publications'
    ? 'Assigned automatically from the original title when you create the entry. A number is added if needed. Later title changes keep this identifier and add an alias URL pointing to the original page.'
    : 'Generated from the title. Keep it stable so existing links keep working.';
  document.querySelector('#record-aliases').hidden = kind !== 'publications';
  const aliases = kind === 'publications' ? current.data.aliases || [] : [];
  const aliasList = document.querySelector('#record-alias-list');
  aliasList.replaceChildren(...aliases.map(alias => {
    const item = node('li'); item.append(node('code', alias)); return item;
  }));
  aliasList.hidden = aliases.length === 0;
  document.querySelector('#record-aliases-empty').hidden = aliases.length > 0;
  if (custom) { renderPreview(); return; }
  let section;
  for (const field of definition.fields) {
    if (!section || field.section) {
      section = node('fieldset'); section.append(node('legend', field.section || collections[kind].label)); container.append(section);
    }
    const control = fieldControl(field, current.data[field.key] ?? initialValues[field.key]);
    control.wrapper.id = 'field-' + field.key;
    section.append(control.wrapper); readers.set(field.key, control.read);
    if (kind === 'people' && field.key === 'homepage') control.wrapper.append(personalPageStatus());
  }
  if (personal) {
    function updateTemplateFields() {
      const template = readers.get('layout')();
      for (const field of definition.fields) {
        if (!field.templates) continue;
        const wrapper = document.querySelector('#field-' + field.key);
        wrapper.hidden = !field.templates.includes(template);
        wrapper.disabled = wrapper.hidden;
      }
    }
    document.querySelector('#layout').addEventListener('change', updateTemplateFields);
    updateTemplateFields();
  }
  if (kind === 'people' || kind === 'publications' || kind === 'data-sets') {
    const slug = kind === 'people' ? document.querySelector('#slug') : document.querySelector('#record-slug');
    slug.readOnly = kind === 'publications' || (kind !== 'people' && Boolean(current.slug));
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
      name.addEventListener('input', () => {
        if (kind === 'publications') slug.value = slugify(name.value).slice(0, 180).replace(/-$/, '') || (name.value.trim() ? 'publication' : '');
        else if (!manual) slug.value = slugify(name.value);
      });
    }
  }
  if (collections[kind].body) bodyControl(container);
  renderPreview();
}
async function refreshList() {
  const records = await api('/api/records/' + kind);
  if (kind === 'personal') {
    const members = await api('/api/profiles');
    picker.setOptions(members.map(member => ({ label: member.name + (records.some(record => record.slug === member.slug) ? '' : ' — create page'), value: member.slug })));
  } else {
    picker.setOptions([{ label: 'New entry', value: '' }, ...records.map(record => ({ label: record.name, value: record.slug }))]);
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
    : kind === 'personal' && !record.revision ? 'Choose a template and write your page. Save to add an MSRG personal page link to your member card, alongside any external personal website.' : 'Edit the form, save, then check the local preview.');
  if (kind === 'personal') await checkPreview();
}
async function changeKind(next) {
  const config = await api('/api/schema/' + next);
  kind = next; definition = config.schema; initialValues = config.defaults;
  current = { data: {}, body: '', revision: null, slug: '' };
  await refreshList();
  await loadRecord(kind === 'personal' ? picker.options[0]?.value || '' : '');
}
async function run(action) {
  if (busy) return;
  setBusy(true);
  try { await action(); } catch (error) { notify(error.message, true); }
  finally { setBusy(false); kindPicker.value = kind; picker.value = current.slug; }
}
kindPicker.addEventListener('change', () => { if (canLeave()) run(() => changeKind(kindPicker.value)); else kindPicker.value = kind; });
document.querySelector('#reload').addEventListener('click', () => { if (canLeave()) run(() => loadRecord(current.slug)); });
document.querySelector('#preview-start').addEventListener('click', async event => {
  event.target.disabled = true;
  try { previewState = await post('/api/preview/start', {}); }
  catch (error) { previewState = { state: 'failed', message: error.message }; }
  finally { event.target.disabled = false; renderPreview(); }
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (kind === 'personal' && current.personal_page?.kind === 'custom') return;
  run(async () => {
    const values = Object.fromEntries(Array.from(readers)
      .filter(([key]) => !document.querySelector('#field-' + key).hidden)
      .map(([key, read]) => [key, read()]));
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
    const savedSlug = result.slug || slug;
    current = { ...await api('/api/records/' + kind + '/' + encodeURIComponent(savedSlug)), slug: savedSlug };
    const config = await api('/api/schema/' + kind);
    definition = config.schema; initialValues = config.defaults;
    dirty = false; render(); await refreshList();
    notify('Saved ' + result.path + (result.moved ? '. Identifier changed; preview the profile and personal site, and update any shared old URLs.' : '.') + ' Preview your changes, then submit a pull request.');
    if (kind === 'personal') await checkPreview();
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
