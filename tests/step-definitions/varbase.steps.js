'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Reuse webship-js's own helpers so these custom steps behave like the core
// ones: `smartSettle` (the smart "wait for a quiet edge" used by every
// navigation step) and `friendly` (tester-friendly error formatting).
const { smartSettle, friendly } = require('webship-js/tests/step-definitions/webship');

/**
 * Authenticate a Varbase user defined in cucumber.js worldParameters.users.
 *
 * Example: Given I am a logged in user with the "Content admin" user
 * Example: Given I am a logged in user with the "webmaster" user
 */
Given(/^I am a logged in user with( the)*( username)* "([^"]*)?"( user)*$/, async function (theCase, usernameCase, username, userCase) {
  const users = this.parameters.users;

  if (!(username in users)) {
    throw friendly(
      `User "${username}" is not configured.`,
      `Add it to worldParameters.users in cucumber.js. Known users: ${Object.keys(users).join(', ')}.`
    );
  }

  const loginName = users[username].username || username;
  const password = users[username].password;
  if (password == null) return;

  await this.page.goto(this.launchUrl + '/user/login', { waitUntil: 'domcontentloaded' });
  // Wait for the username field to be actionable, fill, then submit by
  // triggering the button's native click in-page. The Varbase login form is
  // a standard POST; an in-page submit cannot be intercepted by the floating
  // AI chatbot widget (a Playwright click would hit a 30s actionability
  // timeout when the widget overlaps the button).
  await this.page.waitForSelector('#edit-name', { state: 'visible', timeout: 15000 });
  await this.page.fill('#edit-name', loginName);
  await this.page.fill('#edit-pass', password);
  await Promise.all([
    this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    this.page.evaluate(() => {
      const submit = document.querySelector('#edit-submit');
      if (submit) { submit.click(); return; }
      const form = document.querySelector('#user-login-form') || document.forms[0];
      if (form) form.submit();
    }),
  ]);
  // Smart-settle the post-login page so the next step sees a stable page.
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Smart wait for the current page to reach a quiet edge — the same
 * `smartSettle` used by webship-js navigation steps (DOM ready + network
 * idle + no pending AJAX/timers). Replaces the bare "And wait" used
 * throughout the suite after a navigation or action.
 *
 * Example: And wait
 */
When(/^wait$/, async function () {
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Performance budget — assert the current page's full load time (Navigation
 * Timing `duration` = navigationStart → loadEventEnd) is under a budget.
 * No equivalent ships in webship-js.
 *
 * Example: Then the page should load in less than 8000 ms
 * Example: Then the page should load in less than 10 seconds
 */
Then(/^the page should (?:load|respond) in less than (\d+) (ms|milliseconds?|seconds?)$/, async function (amount, unit) {
  const budgetMs = /^s/.test(unit) ? Number(amount) * 1000 : Number(amount);
  const loadMs = await this.page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation');
    if (nav && nav.duration > 0) return nav.duration;
    const t = performance.timing;
    return t.loadEventEnd > 0 ? t.loadEventEnd - t.navigationStart : 0;
  });
  assert.ok(
    loadMs > 0 && loadMs < budgetMs,
    `Page load time ${Math.round(loadMs)}ms exceeded the ${budgetMs}ms budget.`
  );
});

/**
 * Submit a form by triggering the in-page native click on a button id.
 * Gin moves the primary submit into a sticky action bar that overlays the
 * original button, so a Playwright click on it times out on actionability.
 * Dispatching the click in-page bypasses the overlay.
 *
 * Example: When I submit by id "edit-submit"
 */
When(/^(?:I |we )*submit by id "([^"]*)"$/, async function (id) {
  await this.page.evaluate((sel) => {
    const el = document.getElementById(sel);
    if (el) { el.click(); return; }
    const form = document.querySelector('form');
    if (form) form.submit();
  }, id);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Open a row action link (e.g. "Edit") by navigating to its href rather than
 * clicking it. A Playwright click waits for the heavy node-edit page (CKEditor
 * 5 + AI widgets) `load` event which can exceed the step timeout; reading the
 * href and `goto` with domcontentloaded avoids that hang.
 *
 * Example: When I open the "Edit" link in the "Test Unpublished Page" row
 */
When(/^(?:I |we )*open the "([^"]*)" link in the "([^"]*)" row$/, async function (linkText, rowText) {
  // Read the link's href in-page. Drupal/Gin puts row actions (Edit, Delete…)
  // inside a collapsed operations dropdown, so the anchor is present in the DOM
  // but hidden - getByRole().getAttribute() would hang on actionability. We
  // match the anchor by visible text (or, for Edit, an /edit href) and read its
  // href directly, then navigate with domcontentloaded (no heavy load wait).
  const href = await this.page.evaluate(({ rowText, linkText }) => {
    const rows = [...document.querySelectorAll('tr')]
      .filter((tr) => tr.textContent.includes(rowText));
    for (const tr of rows) {
      const links = [...tr.querySelectorAll('a[href]')];
      let a = links.find((x) => x.textContent.trim() === linkText);
      if (!a && linkText.toLowerCase() === 'edit') {
        a = links.find((x) => /\/edit(\?|$)/.test(x.getAttribute('href')));
      }
      if (a) return a.getAttribute('href');
    }
    return null;
  }, { rowText, linkText });
  if (!href) throw friendly(`No "${linkText}" link found in the "${rowText}" row.`);
  const url = href.startsWith('http') ? href : this.launchUrl.replace(/\/$/, '') + href;
  await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Fill an international telephone field (Webform `tel` element with
 * `#international`, rendered by the intl-tel-input library). Setting the raw
 * value with a plain "fill in" step is not enough: intl-tel-input validates
 * the number with libphonenumber and rejects anything it cannot parse, so the
 * webform's clientside/serverside validation fails. This step drives the
 * intl-tel-input instance itself (`setNumber`) and dispatches input/blur so
 * both the widget and the webform see a valid, formatted number.
 *
 * Pass the number in E.164 form (e.g. "+14155552671") for deterministic
 * results regardless of the field's selected country.
 *
 * Example: When I fill in the international phone field with "+14155552671"
 */
When(/^(?:I |we )*fill in the international phone (?:field|number)(?: "[^"]*")? with "([^"]*)"$/, async function (number) {
  const valid = await this.page.evaluate((num) => {
    const g = window.intlTelInputGlobals;
    if (!g || !g.instances) return null;
    const keys = Object.keys(g.instances);
    if (!keys.length) return null;
    const inst = g.instances[keys[0]];
    inst.setNumber(num);
    const input = inst.telInput || document.querySelector('input[type="tel"]');
    if (input) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }
    return inst.isValidNumber();
  }, number);

  if (valid === null) {
    throw friendly(
      'No intl-tel-input phone field was found on the page.',
      'This step only works on a Webform "tel" element with #international enabled.'
    );
  }
  if (!valid) {
    throw friendly(
      `"${number}" is not a valid phone number for this field.`,
      'Pass a libphonenumber-valid number in E.164 form, e.g. "+14155552671".'
    );
  }
});

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
    const uuid = crypto.randomUUID();
    content.components.push({ uuid, nodeType: 'component', type: 'block.webform_block@75298500addde82f', name: null, slots: [] });
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
