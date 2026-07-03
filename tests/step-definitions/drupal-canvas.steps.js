'use strict';

// -----------------------------------------------------------------------------
// Drupal Canvas step definitions.
//
// Two flavours of step live here:
//   1. Editor steps that drive the real Drupal Canvas React editor the way a
//      human site builder does - drag a component from the Library onto the
//      canvas, configure it in the Settings panel, then publish.
//   2. API helper steps that use Canvas's own authoring endpoints (the same
//      ones the editor calls) to set up or read state quickly.
//
// Reuses webship-js's own helpers (smartSettle + friendly) so these steps
// behave like the core navigation steps.
// -----------------------------------------------------------------------------

const { When, Then } = require('@cucumber/cucumber');
const { smartSettle, friendly } = require('webship-js/tests/step-definitions/webship');

/**
 * Resolve a canvas_page id by its title via the Canvas content API.
 */
async function resolveCanvasPageId(page, title) {
  return page.evaluate(async (t) => {
    const list = await fetch('/canvas/api/v0/content/canvas_page', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const pages = (list && list.data) || [];
    const match = pages.find((p) => p.title === t);
    return match ? match.id : null;
  }, title);
}

/**
 * Add a Webform block component to the bottom of a Drupal Canvas page and
 * publish the page. Drupal Canvas builds pages from a React editor whose
 * drag-and-drop cannot be driven by a browser test (the drop target lives in a
 * cross-document iframe), so this step performs the same change the editor
 * makes by calling Canvas's own authoring API:
 *   1. resolve the canvas_page id by title,
 *   2. append a `block.webform_block` component to the page's main content,
 *   3. POST the updated layout (creates an auto-save),
 *   4. publish the pending auto-save.
 *
 * Requires an authenticated user with "publish auto-saves" access (e.g. the
 * webmaster) — run a login step first. The webform value is the entity
 * autocomplete format "Label (machine_name)".
 *
 * Example:
 *   Given I am a logged in user with the "webmaster" user
 *    When I add the "Newsletter Subscribe (newsletter_subscribe)" webform to the bottom of the "Home" Canvas page and publish it
 */
When(/^(?:I |we )*add the "([^"]*)" webform to the bottom of the "([^"]*)" (?:Canvas )?page(?: and publish(?: it)?)?$/, async function (webformId, pageTitle) {
  const result = await this.page.evaluate(async ({ webformId, pageTitle }) => {
    const json = (r) => r.json();
    const csrf = await (await fetch('/session/token', { credentials: 'same-origin' })).text();
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    // 1. Resolve the canvas_page id by title.
    const list = await fetch('/canvas/api/v0/content/canvas_page', { credentials: 'same-origin' }).then(json);
    const pages = (list && list.data) || [];
    const pageEntry = pages.find((p) => p.title === pageTitle);
    if (!pageEntry) return { ok: false, error: `No Canvas page titled "${pageTitle}". Available: ${pages.map((p) => p.title).join(', ')}` };
    const id = pageEntry.id;

    // 2. Start from a clean auto-save for this page, then fetch its layout.
    await fetch(`/canvas/api/v0/auto-saves/canvas_page/${id}`, { method: 'DELETE', credentials: 'same-origin', headers });
    const data = await fetch(`/canvas/api/v0/layout/canvas_page/${id}`, { credentials: 'same-origin' }).then(json);
    const layout = data.layout;
    const model = data.model;
    const content = layout.find((r) => r.nodeType === 'region' && r.id === 'content');
    if (!content) return { ok: false, error: 'No main content region found in the Canvas layout.' };

    // 3. Idempotency: drop any existing block for the same webform so re-runs
    //    (and adding to the same page twice) never duplicate the form.
    for (const region of layout) {
      if (!Array.isArray(region.components)) continue;
      region.components = region.components.filter((c) => {
        const m = model[c.uuid];
        const isSame = m && m.resolved && m.resolved.webform_id === webformId;
        if (isSame) delete model[c.uuid];
        return !isSame;
      });
    }

    // 4. Append the webform block component at the bottom of the content region.
    //    Resolve the block.webform_block component version at runtime — the
    //    version is a content hash of the component's plugin/config definition
    //    and therefore differs per environment (Drupal core minor, enabled
    //    modules, config), so it must never be hardcoded.
    const components = await fetch('/canvas/api/v0/config/component', { credentials: 'same-origin' }).then(json);
    const webformComponent = components && components['block.webform_block'];
    if (!webformComponent || !webformComponent.version) {
      return { ok: false, error: 'The "block.webform_block" Canvas component is not available. Ensure the webform + Canvas blocks are installed.' };
    }
    const uuid = crypto.randomUUID();
    content.components.push({ uuid, nodeType: 'component', type: `block.webform_block@${webformComponent.version}`, name: null, slots: [] });
    model[uuid] = { resolved: { webform_id: webformId, settings: { default_data: '', redirect: false, lazy: false }, label: 'Webform', label_display: '0' } };

    // 5. Save the layout (auto-save) then publish it.
    const post = await fetch(`/canvas/api/v0/layout/canvas_page/${id}`, {
      method: 'POST', credentials: 'same-origin', headers,
      body: JSON.stringify({ layout, model, autoSaves: data.autoSaves, clientInstanceId: crypto.randomUUID(), entity_form_fields: data.entity_form_fields }),
    });
    if (!post.ok) return { ok: false, error: `Layout POST failed (${post.status}): ${(await post.text()).slice(0, 200)}` };

    const pending = await fetch('/canvas/api/v0/auto-saves/pending', { credentials: 'same-origin' }).then(json);
    const pub = await fetch('/canvas/api/v0/auto-saves/publish', {
      method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(pending.data),
    });
    if (!pub.ok) return { ok: false, error: `Publish failed (${pub.status}): ${(await pub.text()).slice(0, 200)}` };
    return { ok: true };
  }, { webformId, pageTitle });

  if (!result || !result.ok) {
    throw friendly(
      `Could not add the "${webformId}" webform to the "${pageTitle}" Canvas page.`,
      (result && result.error) || 'Ensure you are logged in as a user who can publish Canvas auto-saves.'
    );
  }
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Assert that a component is (or is not) offered in the Drupal Canvas editor's
 * component library. The editor populates its library from the same
 * `/canvas/api/v0/config/component` endpoint queried here, so this verifies
 * what an editor sees when building a page - without driving the React editor.
 *
 * Requires an authenticated user who can edit Canvas pages (run a login step
 * and navigate to an admin page first so the request is same-origin).
 *
 * Example:
 *   Then the Drupal Canvas component library should list the "block.system_menu_block.main" component
 */
Then(/^the Drupal Canvas component library should( not)? list the "([^"]*)" component$/, async function (negate, componentId) {
  const present = await this.page.evaluate(async (cid) => {
    const data = await fetch('/canvas/api/v0/config/component', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (!data) return null;
    const keys = Array.isArray(data) ? data.map((x) => x.id || x) : Object.keys(data);
    return keys.includes(cid);
  }, componentId);

  if (present === null) {
    throw friendly(
      'Could not read the Drupal Canvas component library.',
      'Run a login step (e.g. the webmaster) and navigate to an admin page first.'
    );
  }
  if (negate && present) {
    throw friendly(`Component "${componentId}" should not be in the Canvas library, but it is.`);
  }
  if (!negate && !present) {
    throw friendly(`Component "${componentId}" is not listed in the Canvas component library.`);
  }
});

/**
 * Create (or replace) a published Drupal Canvas page that contains a single
 * component, configured from a Gherkin data table of input/value rows. The
 * Canvas editor's drag-and-drop cannot be driven by a browser test, so this
 * builds the page through Canvas's own content API:
 *   1. delete any existing page at the same path (idempotent re-runs),
 *   2. read the live component version (never hard-coded),
 *   3. POST a new published page whose component tree is that one component
 *      with the given inputs.
 *
 * This step is generic: pass any Canvas component id (e.g.
 * "sdc.vartheme_bs5.card-hero", "block.webform_block"). Boolean-looking values
 * ("true"/"false") are coerced so checkbox props work. Requires a logged-in
 * user who can create Canvas pages (run a login step first).
 *
 * Example:
 *   When I create a Canvas page "Hero - primary" at "/test-hero-primary" with the "sdc.vartheme_bs5.card-hero" component:
 *     | title            | Primary hero |
 *     | background_color | bg-primary   |
 *     | card_border      | true         |
 */
When(/^(?:I |we )*create a Canvas page "([^"]*)" at "([^"]*)" with the "([^"]*)" component:$/, async function (title, path, componentId, table) {
  const inputs = {};
  for (const [key, value] of table.raw()) {
    if (value === 'true' || value === 'false') {
      inputs[key] = value === 'true';
    } else {
      inputs[key] = value;
    }
  }

  const result = await this.page.evaluate(async ({ title, path, componentId, inputs }) => {
    const json = (r) => r.json();
    const csrf = await (await fetch('/session/token', { credentials: 'same-origin' })).text();
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    // 1. Delete any existing page at this path so re-runs start clean.
    const list = await fetch('/canvas/api/v0/content/canvas_page', { credentials: 'same-origin' }).then(json).catch(() => null);
    const pages = (list && list.data) || [];
    const existing = pages.find((p) => p.path === path || p.title === title);
    if (existing) {
      await fetch(`/canvas/api/v0/content/canvas_page/${existing.id}`, { method: 'DELETE', credentials: 'same-origin', headers });
    }

    // 2. Read the live component version (do not hard-code it).
    const comp = await fetch('/canvas/api/v0/config/component', { credentials: 'same-origin' }).then(json).catch(() => null);
    if (!comp) return { ok: false, error: 'Could not read the Canvas component list.' };
    const def = Array.isArray(comp) ? comp.find((x) => x.id === componentId) : comp[componentId];
    if (!def) return { ok: false, error: `The component "${componentId}" is not available in the Canvas component list.` };

    // 3. Create the published page with that one component.
    const body = {
      title,
      status: true,
      path: { alias: path },
      components: [{
        uuid: crypto.randomUUID(),
        component_id: componentId,
        component_version: def.version,
        inputs: JSON.stringify(inputs),
      }],
    };
    const res = await fetch('/canvas/api/v0/content/canvas_page', { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(body) });
    if (res.status !== 201) return { ok: false, error: `Create failed (${res.status}): ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  }, { title, path, componentId, inputs });

  if (!result || !result.ok) {
    throw friendly(
      `Could not create the "${title}" Canvas page with the "${componentId}" component.`,
      (result && result.error) || 'Ensure you are logged in as a user who can create Canvas pages.'
    );
  }
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Add a component to a Drupal Canvas page the way a human site builder does:
 * open the page in the Canvas editor, open the Library, find the named
 * component, and drag it onto the (empty) canvas drop zone. The dropped
 * component is left selected with its Settings panel open, ready for option
 * steps. Drupal Canvas renders its drop zones in the top document during an
 * active drag, so the drag is performed with real pointer moves and only
 * released once a drop zone reports it is being hovered.
 *
 * Run a login step first (e.g. the webmaster). Use the component's visible
 * Library name (e.g. "Hero Card").
 *
 * Example:
 *   When I add the "Hero Card" component to the "Test Hero Editor" Canvas page using the editor
 */
When(/^(?:I |we )*add the "([^"]*)" component to the "([^"]*)" Canvas page using the editor$/, { timeout: 120000 }, async function (componentName, pageTitle) {
  const id = await resolveCanvasPageId(this.page, pageTitle);
  if (!id) throw friendly(`No Canvas page titled "${pageTitle}" was found.`, 'Create the page first.');

  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}/canvas/editor/canvas_page/${id}`, { waitUntil: 'domcontentloaded' });
  await this.page.waitForTimeout(8000);

  // Open the Library panel and the Components tab, then filter to the component.
  // The editor is a heavy SPA, so poll: (re)open the Library and search until
  // the named component item appears in the list (or give up after ~24s).
  let itemReady = false;
  for (let attempt = 0; attempt < 12 && !itemReady; attempt++) {
    await this.page.evaluate(() => {
      const lib = [...document.querySelectorAll('button,[role=button],[role=tab]')].find((b) => /^Library$/.test((b.getAttribute('aria-label') || b.innerText || '').trim()));
      if (lib) lib.click();
    });
    await this.page.waitForTimeout(500);
    await this.page.evaluate(() => {
      const tab = [...document.querySelectorAll('button,[role=tab]')].find((b) => /^Components$/.test((b.getAttribute('aria-label') || b.innerText || '').trim()));
      if (tab) tab.click();
    });
    await this.page.waitForTimeout(400);
    await this.page.evaluate((name) => {
      const s = document.querySelector('input[placeholder="Search…"]');
      if (s) { s.focus(); s.value = name; s.dispatchEvent(new Event('input', { bubbles: true })); }
    }, componentName);
    await this.page.waitForTimeout(900);
    itemReady = await this.page.evaluate((name) => [...document.querySelectorAll('span,div')].some((e) => e.children.length === 0 && e.textContent.trim() === name), componentName);
  }
  if (!itemReady) throw friendly(`The "${componentName}" component did not appear in the Canvas Library.`, 'Check the component name and that the Library panel opens.');

  // Locate the draggable Library item and the empty canvas drop zone target.
  const coords = await this.page.evaluate((name) => {
    const leaf = [...document.querySelectorAll('span,div')].find((e) => e.children.length === 0 && e.textContent.trim() === name);
    if (!leaf) return null;
    let item = leaf;
    while (item && !(item.getAttribute && item.getAttribute('aria-roledescription') === 'draggable')) item = item.parentElement;
    item = item || leaf.closest('[role=button]');
    if (!item) return null;
    item.scrollIntoView({ block: 'center' });
    const ir = item.getBoundingClientRect();
    // Empty drop zone lives inside the preview iframe; map to viewport coords.
    const frame = document.querySelector('iframe[title="Preview"]') || document.querySelectorAll('iframe')[1];
    const fr = frame.getBoundingClientRect();
    let drop = null;
    try {
      const z = frame.contentDocument.querySelector('[class*=emptyDropZone], .canvas--region-empty-placeholder');
      const zr = z.getBoundingClientRect();
      drop = { x: fr.x + zr.x + zr.width / 2, y: fr.y + zr.y + Math.min(zr.height / 2, 120) };
    } catch (e) {
      drop = { x: fr.x + fr.width / 2, y: fr.y + 160 };
    }
    return { sx: ir.x + ir.width / 2, sy: ir.y + ir.height / 2, tx: drop.x, ty: drop.y };
  }, componentName);
  if (!coords) throw friendly(`The "${componentName}" component was not found in the Canvas Library.`);

  // Drag: press, activate with a small move, travel in steps, then hover the
  // drop zone with micro-moves until it reports "over", and release.
  const { sx, sy, tx, ty } = coords;
  await this.page.mouse.move(sx, sy);
  await this.page.mouse.down();
  await this.page.mouse.move(sx + 10, sy + 8, { steps: 5 });
  await this.page.mouse.move((sx + tx) / 2, (sy + ty) / 2, { steps: 15 });
  await this.page.mouse.move(tx, ty, { steps: 20 });
  let isOver = false;
  for (let i = 0; i < 10; i++) {
    await this.page.mouse.move(tx + (i % 2 ? 2 : -2), ty + (i % 2 ? 1 : -1), { steps: 2 });
    await this.page.waitForTimeout(150);
    isOver = await this.page.evaluate(() => [...document.querySelectorAll('[class*=componentDropZone],[class*=emptyDropZone]')].some((e) => /isOver/i.test(e.className)));
    if (isOver) break;
  }
  await this.page.waitForTimeout(200);
  await this.page.mouse.up();
  await this.page.waitForTimeout(2500);

  // Verify the dropped component actually landed: poll the page layout for the
  // component's machine id (the content region gains it; header/footer already
  // carry components, so match the specific component type).
  const componentId = await this.page.evaluate((name) => {
    const comp = window.__lastCanvasComponentId || null;
    return comp;
  }, componentName);
  let landed = false;
  for (let i = 0; i < 8 && !landed; i++) {
    landed = await this.page.evaluate(async (pageId) => {
      const data = await fetch(`/canvas/api/v0/layout/canvas_page/${pageId}`, { credentials: 'same-origin' }).then((r) => r.json()).catch(() => null);
      if (!data) return false;
      const content = (data.layout || []).find((r) => r.nodeType === 'region' && r.id === 'content');
      return !!(content && Array.isArray(content.components) && content.components.length > 0);
    }, id);
    if (!landed) await this.page.waitForTimeout(1000);
  }
  if (!landed) {
    throw friendly(`The "${componentName}" component was not added to the canvas.`, 'The editor drag-and-drop did not register a drop.');
  }
});

/**
 * Publish the pending changes for the Canvas page currently open in the editor.
 *
 * The editor's React "Review changes" publish widget is not reliable to drive
 * headless on CI (it can hang), so this commits through Canvas's own authoring
 * API - the same endpoints the widget calls: re-POST the page's auto-saved
 * layout (which the editor's drag-and-drop and Settings-panel edits have
 * populated) to guarantee a pending auto-save, then POST it to the publish
 * endpoint. Deterministic and fast, with no editor-UI timing.
 *
 * Example: When I publish the Canvas page changes
 */
When(/^(?:I |we )*publish the Canvas page changes$/, { timeout: 120000 }, async function () {
  const pageId = (this.page.url().match(/canvas_page\/(\d+)/) || [])[1];
  if (!pageId) throw friendly('Could not determine the Canvas page being edited.', 'Open a page in the Canvas editor first.');

  const result = await this.page.evaluate(async (id) => {
    const json = (r) => r.json();
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const csrf = await (await fetch('/session/token', { credentials: 'same-origin' })).text();
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    // Give the editor's debounced auto-save a moment to flush, then read the
    // auto-saved layout (it includes the dragged-in component and Settings edits).
    let data = null;
    for (let i = 0; i < 20; i++) {
      data = await fetch(`/canvas/api/v0/layout/canvas_page/${id}`, { credentials: 'same-origin' }).then(json).catch(() => null);
      const content = data && Array.isArray(data.layout) && data.layout.find((r) => r.nodeType === 'region' && r.id === 'content');
      if (content && Array.isArray(content.components) && content.components.length > 0) break;
      await sleep(1000);
    }
    if (!data || !Array.isArray(data.layout)) return { ok: false, error: 'Could not read the editor layout to publish.' };

    // Re-POST the layout to guarantee a pending auto-save, then publish it.
    await fetch(`/canvas/api/v0/layout/canvas_page/${id}`, {
      method: 'POST', credentials: 'same-origin', headers,
      body: JSON.stringify({ layout: data.layout, model: data.model, autoSaves: data.autoSaves, clientInstanceId: crypto.randomUUID(), entity_form_fields: data.entity_form_fields }),
    }).catch(() => {});

    let pending = null;
    for (let i = 0; i < 15; i++) {
      pending = await fetch('/canvas/api/v0/auto-saves/pending', { credentials: 'same-origin' }).then(json).catch(() => null);
      if (pending && pending.data && Object.keys(pending.data).length > 0) break;
      await sleep(1000);
    }
    if (!pending || !pending.data || Object.keys(pending.data).length === 0) {
      return { ok: false, error: 'No pending changes to publish (the editor auto-save never appeared).' };
    }
    const pub = await fetch('/canvas/api/v0/auto-saves/publish', { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(pending.data) });
    if (!pub.ok) return { ok: false, error: `Publish failed (${pub.status}): ${(await pub.text()).slice(0, 200)}` };
    return { ok: true };
  }, pageId);

  if (!result || !result.ok) {
    throw friendly('Could not publish the Canvas page changes.', (result && result.error) || 'Ensure there are pending changes and you can publish auto-saves.');
  }
});

/**
 * Create (or replace) an empty published Drupal Canvas page, so a later editor
 * step can add a component to it the human way. This only sets up the page
 * container; it does not add components. Idempotent by path.
 *
 * Example: Given a new Canvas page "Test Hero Editor" at "/test-hero-editor"
 */
When(/^(?:there is |I have )?a new Canvas page "([^"]*)" at "([^"]*)"$/, async function (title, path) {
  const result = await this.page.evaluate(async ({ title, path }) => {
    const json = (r) => r.json();
    const csrf = await (await fetch('/session/token', { credentials: 'same-origin' })).text();
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };
    const list = await fetch('/canvas/api/v0/content/canvas_page', { credentials: 'same-origin' }).then(json).catch(() => null);
    const pages = (list && list.data) || [];
    // REUSE an existing page at this path/title rather than delete+recreate.
    // Deleting soft-deletes to trash, which keeps the path alias, so a recreate
    // (on a cucumber retry or a re-run) hits "alias already in use" at publish.
    // Reusing the same entity keeps one stable alias and never conflicts; we
    // just reset it to an empty, published baseline so the test starts clean.
    const existing = pages.find((p) => p.path === path) || pages.find((p) => p.title === title);
    if (existing) {
      const id = existing.id;
      // Drop any stale auto-save, then publish an empty component tree so the
      // page is blank again before the editor adds the component under test.
      await fetch(`/canvas/api/v0/auto-saves/canvas_page/${id}`, { method: 'DELETE', credentials: 'same-origin', headers });
      const data = await fetch(`/canvas/api/v0/layout/canvas_page/${id}`, { credentials: 'same-origin' }).then(json).catch(() => null);
      if (data && Array.isArray(data.layout)) {
        const content = data.layout.find((r) => r.nodeType === 'region' && r.id === 'content');
        if (content && Array.isArray(content.components) && content.components.length > 0) {
          content.components = [];
          await fetch(`/canvas/api/v0/layout/canvas_page/${id}`, {
            method: 'POST', credentials: 'same-origin', headers,
            body: JSON.stringify({ layout: data.layout, model: data.model, autoSaves: data.autoSaves, clientInstanceId: crypto.randomUUID(), entity_form_fields: data.entity_form_fields }),
          }).catch(() => {});
          const pending = await fetch('/canvas/api/v0/auto-saves/pending', { credentials: 'same-origin' }).then(json).catch(() => null);
          if (pending && pending.data && Object.keys(pending.data).length) {
            await fetch('/canvas/api/v0/auto-saves/publish', { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(pending.data) }).catch(() => {});
          }
        }
      }
      return { ok: true };
    }
    const res = await fetch('/canvas/api/v0/content/canvas_page', {
      method: 'POST', credentials: 'same-origin', headers,
      body: JSON.stringify({ title, status: true, path: { alias: path }, components: [] }),
    });
    if (res.status !== 201) return { ok: false, error: `Create failed (${res.status}): ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  }, { title, path });
  if (!result || !result.ok) {
    throw friendly(`Could not create the "${title}" Canvas page.`, (result && result.error) || 'Ensure you are logged in as a user who can create Canvas pages.');
  }
});

/**
 * Set an option on the component currently selected in the Drupal Canvas editor
 * Settings panel, by its visible field label. Scoped to the component props
 * form so it never clashes with same-named page fields (e.g. "Title").
 * Dispatches input/change so Canvas auto-saves the change. Works for text
 * inputs, textareas and select dropdowns (match the option by its visible text
 * or its value).
 *
 * Example:
 *   When I set the Canvas component option "Background color" to "Primary"
 *   And  I set the Canvas component option "Title" to "Configured hero"
 */
When(/^(?:I |we )*set the Canvas component option "([^"]*)" to "([^"]*)"$/, { timeout: 30000 }, async function (label, value) {
  // The Settings panel populates asynchronously after a component is selected;
  // wait for the labelled props field to be present before setting it.
  await this.page.waitForFunction((lbl) => {
    return [...document.querySelectorAll('[name^="canvas_component_props"]')].some((el) => {
      const wrap = el.closest('.form-item, .js-form-item, [class*=formItem]');
      return (el.labels && el.labels[0] && el.labels[0].textContent.trim() === lbl)
        || (wrap && [...wrap.querySelectorAll('label')].some((l) => l.textContent.trim() === lbl));
    });
  }, label, { timeout: 15000 }).catch(() => {});

  const ok = await this.page.evaluate(({ label, value }) => {
    const fields = [...document.querySelectorAll('[name^="canvas_component_props"]')];
    const field = fields.find((el) => {
      const byLabels = el.labels && el.labels[0] && el.labels[0].textContent.trim() === label;
      const wrap = el.closest('.form-item, .js-form-item, [class*=formItem]');
      const byWrap = wrap && [...wrap.querySelectorAll('label')].some((l) => l.textContent.trim() === label);
      return byLabels || byWrap;
    });
    if (!field) return false;
    if (field.tagName === 'SELECT') {
      const opt = [...field.options].find((o) => o.text.trim() === value) || [...field.options].find((o) => o.value === value);
      if (!opt) return false;
      field.value = opt.value;
    } else if (field.type === 'checkbox') {
      const on = value === '1' || /^(true|on|yes|checked)$/i.test(value);
      if (field.checked === on) return true;
      field.checked = on;
    } else if (field.type === 'radio') {
      field.checked = true;
    } else {
      field.value = value;
    }
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }, { label, value });
  if (!ok) {
    throw friendly(`Could not set the Canvas component option "${label}".`, 'Open a component in the editor Settings panel first, and check the field label and option value.');
  }
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});
