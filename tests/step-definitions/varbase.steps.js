'use strict';

const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const path = require('path');

// Reuse webship-js's own helpers so these custom steps behave like the core
// ones: `smartSettle` (the smart "wait for a quiet edge" used by every
// navigation step) and `friendly` (tester-friendly error formatting).
const { smartSettle, friendly } = require('webship-js/tests/step-definitions/webship');

/**
 * Authenticate a Varbase user defined in cucumber.js worldParameters.users.
 *
 * Example #1: Given I am a logged in user with the "webmaster" user
 * Example #2: Given I am a logged in user with the "Content admin" user
 * Example #3: Given I am a logged in user with the username "editor"
 * Example #4: Given I am a logged in user with "admin"
 * Example #5: And I am a logged in user with the "webmaster" user
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
 * Example #1: And wait
 * Example #2: When wait
 * Example #3: Then wait
 * Example #4: Given wait
 * Example #5: But wait
 */
When(/^wait$/, async function () {
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Performance budget — assert the current page's full load time (Navigation
 * Timing `duration` = navigationStart → loadEventEnd) is under a budget.
 * No equivalent ships in webship-js.
 *
 * Example #1: Then the page should load in less than 3 seconds
 * Example #2: And the page should load in less than 5 seconds
 * Example #3: Then the page should respond in less than 800 ms
 * Example #4: Then the page should load in less than 1500 milliseconds
 * Example #5: And the page should respond in less than 2 seconds
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
 * Example #1: When I submit by id "edit-submit"
 * Example #2: And I submit by id "edit-submit"
 * Example #3: When we submit by id "edit-submit"
 * Example #4: And we submit by id "edit-submit"
 * Example #5: Given I submit by id "edit-submit"
 */
When(/^(?:I |we )*submit by id "([^"]*)"$/, async function (id) {
  await this.page.evaluate((sel) => {
    // Drupal often suffixes the DOM id (e.g. "edit-submit--AbC123") and Gin's
    // sticky action bar CLONES the submit: the original is hidden and a visible
    // copy carries the same data-drupal-selector. Gather every candidate (by id,
    // data-drupal-selector, name), prefer the VISIBLE one (the sticky clone),
    // and native-click it so the button's #submit fires with its op value.
    const cands = [
      ...document.querySelectorAll(
        `#${sel}, [data-drupal-selector="${sel}"], [name="${sel}"]`
      ),
    ];
    const el = cands.find((e) => e.offsetParent !== null) || cands[0];
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
 * Example #1: When I open the "Edit" link in the "Test Unpublished Page" row
 * Example #2: And I open the "Delete" link in the "Draft article" row
 * Example #3: When we open the "Edit" link in the "Homepage" row
 * Example #4: And we open the "Translate" link in the "About" row
 * Example #5: Given I open the "Edit" link in the "News" row
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
 * Example #1: When I fill in the international phone field with "+14155552671"
 * Example #2: And I fill in the international phone number with "+442071838750"
 * Example #3: When we fill in the international phone field with "+14155552671"
 * Example #4: And I fill in the international phone field "Phone" with "+14155552671"
 * Example #5: Given I fill in the international phone number with "+12025550143"
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

// -----------------------------------------------------------------------------
// Default theme — sticky header.
//
// The default theme exposes a "Sticky header" setting. When enabled it attaches
// the sticky-header library (CSS `position: sticky` plus a behavior that adds a
// `scrolled` class once the page is scrolled past a small threshold).
//
// The steps stay theme-agnostic so a site running a custom subtheme is also
// covered: the settings page is resolved by machine name, and the assertions
// resolve named selectors from the registry (tests/selectors/default-theme.json).
// -----------------------------------------------------------------------------

/**
 * Resolve the default theme's settings path (e.g. /admin/appearance/settings/THEME)
 * from the Appearance page, so tests stay theme-agnostic — a site may run a
 * custom subtheme as its default theme.
 */
async function defaultThemeSettingsPath(page, launchUrl) {
  await page.goto(`${launchUrl.replace(/\/$/, '')}/admin/appearance`, { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => {
    const link = [...document.querySelectorAll('a[href*="/admin/appearance/settings/"]')]
      .map((a) => new URL(a.href, location.origin).pathname)
      .find((p) => /\/admin\/appearance\/settings\/[a-z0-9_]+$/.test(p));
    return link || null;
  });
}

/**
 * Go to the default theme's settings page, resolved by machine name (not
 * hard-coded), so the test works whatever the default theme is.
 *
 * Example #1: When I go to the default theme settings page
 * Example #2: And I go to the default theme settings
 * Example #3: When we go to the default theme settings page
 * Example #4: And we go to the default theme settings
 * Example #5: Given I go to the default theme settings page
 */
When(/^(?:I |we )*go to the default theme settings(?: page)?$/, async function () {
  const path = await defaultThemeSettingsPath(this.page, this.launchUrl);
  if (!path) throw friendly('Could not find the default theme settings link.', 'Open /admin/appearance as a user who can administer themes.');
  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}${path}`, { waitUntil: 'domcontentloaded' });
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Enable or disable the default theme's "Sticky header" setting and save.
 * The Gin-styled checkbox is visually hidden, so it is toggled in-page. Opens
 * the default theme's settings form, sets the checkbox, and submits.
 *
 * Run a login step first (e.g. the webmaster).
 *
 * Example #1: When I enable the sticky header theme setting
 * Example #2: And I disable the sticky header theme setting
 * Example #3: When we enable the sticky header theme setting
 * Example #4: And we disable the sticky header theme setting
 * Example #5: Given I enable the sticky header theme setting
 */
When(/^(?:I |we )*(enable|disable) the sticky header theme setting$/, async function (action) {
  const want = action === 'enable';
  const settingsPath = await defaultThemeSettingsPath(this.page, this.launchUrl);
  if (!settingsPath) throw friendly('Could not find the default theme settings link.', 'Open /admin/appearance as a user who can administer themes.');
  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}${settingsPath}`, { waitUntil: 'domcontentloaded' });
  const ok = await this.page.evaluate((on) => {
    const cb = document.querySelector('input[name="sticky_header"]');
    if (!cb) return false;
    if (cb.checked !== on) cb.click();
    const submit = document.getElementById('edit-submit') || [...document.querySelectorAll('input[type="submit"]')].find((b) => /save configuration/i.test(b.value));
    if (!submit) return false;
    submit.click();
    return true;
  }, want);
  if (!ok) throw friendly('Could not toggle the "Sticky header" theme setting.', 'Open the default theme settings as a user who can administer the theme.');
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Flush all caches from the back end as an administrator.
 *
 * Drives the Drupal core Performance page and clicks its "Clear all caches"
 * button, mirroring what an administrator does after changing configuration so
 * a following anonymous request renders fresh from the real homepage. Uses the
 * core form only (no contrib Tools page), targeting the core submit selector.
 *
 * The click is dispatched in-page: Gin moves the primary submit into a sticky
 * action bar that overlays the original button, so a Playwright click can be
 * intercepted by the overlay and silently not submit (the cache is then never
 * cleared). A native in-page click submits the form regardless.
 *
 * Example #1: When I flush all caches
 * Example #2: And I flush all caches
 * Example #3: When we flush all caches
 * Example #4: Given I flush all caches
 * Example #5: And we flush all caches
 */
When(/^(?:I |we )*flush all caches$/, async function () {
  const base = this.launchUrl.replace(/\/$/, '');
  await this.page.goto(`${base}/admin/config/development/performance`, { waitUntil: 'domcontentloaded' });
  const ok = await this.page.evaluate(() => {
    const btn = document.querySelector('[data-drupal-selector="edit-clear"]') || document.getElementById('edit-clear');
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!ok) throw friendly('Could not find "Clear all caches" on the Performance page.', 'Open /admin/config/development/performance as a user who can administer the site.');
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
});

/**
 * Assert a named element gains (or loses) a CSS class, with auto-retry.
 *
 * Resolves a named selector from the registry (falling back to a raw CSS
 * selector) and polls its class list. Use this instead of the raw-selector
 * web-first step when the feature should read with a registered name.
 *
 * Example #1: Then the "site header" should have the "scrolled" class within 5 seconds
 * Example #2: And the "site header" should have the "scrolled" class
 * Example #3: Then the "site header" should not have the "scrolled" class
 * Example #4: And the "main content" should have the "is-active" class within 3 seconds
 * Example #5: Then the "footer" should not have the "scrolled" class
 */
Then(/^the "([^"]*)" should( not)? have the "([^"]*)" class(?: within (\d+) seconds?)?$/, async function (name, negate, cls, sec) {
  const selector = (this.__selectorsCss && this.__selectorsCss[name]) || name;
  const loc = this.page.locator(selector).first();
  const timeout = (sec ? parseInt(sec, 10) : 5) * 1000;
  const want = !negate;
  const start = Date.now();
  let classes = '';
  do {
    classes = (await loc.getAttribute('class')) || '';
    if (classes.split(/\s+/).includes(cls) === want) {
      return;
    }
    await this.page.waitForTimeout(100);
  } while (Date.now() - start < timeout);
  throw friendly(`Expected "${name}" ${want ? 'to have' : 'not to have'} the "${cls}" class within ${timeout / 1000}s; last class was "${classes}".`);
});

/**
 * Assert an element renders as a sticky element (CSS position: sticky).
 *
 * Resolves a named selector from the registry (falling back to a raw CSS
 * selector) and checks its computed position. Reads better in a feature than
 * asserting on a raw "position:sticky;" CSS property string.
 *
 * Example #1: Then the "site header" should be sticky
 * Example #2: And the "site header" should be sticky
 * Example #3: Then the "site header" should not be sticky
 * Example #4: And the "footer" should not be sticky
 * Example #5: Then the "main content" should be sticky
 */
Then(/^the "([^"]*)" should( not)? be sticky$/, async function (name, negate) {
  const selector = (this.__selectorsCss && this.__selectorsCss[name]) || name;
  const position = await this.page.locator(selector).first().evaluate((el) => window.getComputedStyle(el).position);
  if (negate) {
    assert.notStrictEqual(position, 'sticky', friendly(`Expected "${name}" not to be sticky, but its computed position is "${position}".`));
  } else {
    assert.strictEqual(position, 'sticky', friendly(`Expected "${name}" to be sticky, but its computed position is "${position}".`));
  }
});

/**
 * Warm up a page across every viewport breakpoint in the testing settings.
 *
 * The default theme renders responsive images via drimage_improved, which builds
 * a different WebP derivative per rendered width. This visits the page once at
 * each breakpoint from worldParameters.selectors.breakpoints (scrolling to the
 * bottom to trigger lazy images) so every derivative is generated and cached to
 * disk before the health checks assert on console errors. It makes no
 * assertions; it only primes the cache.
 *
 * Example #1: When I warm up "/" at all testing breakpoints
 * Example #2: And I warm up "/features" at all testing breakpoints
 * Example #3: When we warm up "/blog" at all testing breakpoints
 * Example #4: And I warm up "/contact-us" at all testing breakpoints
 * Example #5: Given I warm up "/about-varbase" at all testing breakpoints
 */
When(/^(?:I |we )*warm up "([^"]*)" at all testing breakpoints$/, async function (path) {
  const base = this.launchUrl.replace(/\/$/, '');
  const url = path.startsWith('http') ? path : base + (path.startsWith('/') ? path : '/' + path);
  const configured = (this.parameters.selectors && this.parameters.selectors.breakpoints) || {};
  const breakpoints = Object.values(configured);
  if (!breakpoints.length) {
    breakpoints.push({ width: 1920, height: 1080 });
  }
  const budget = (this.minWaitTime && this.minWaitTime.page) || 8000;
  for (const breakpoint of breakpoints) {
    await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await smartSettle(this.page, budget);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await smartSettle(this.page, budget);
  }
});

// =============================================================================
// Steps ported from the Varbase profile Behat suite (merged from
// varbase_ported.steps.js). Web-first re-implementations resolving elements by
// visible label / role / machine name rather than fragile theme markup.
// =============================================================================
// The webship World defaults `assetsFolder` to its own bundled
// node_modules/webship-js/tests/assets/. The Varbase suite ships its file
// fixtures (e.g. flag-earth.jpg) in the project's own tests/assets/, so point
// the per-scenario assets folder there for the "I attach the file ..." steps.
Before(function () {
  this.assetsFolder = path.join(process.cwd(), 'tests', 'assets');
});

// --- small shared helpers ----------------------------------------------------

/** Per-page settle budget configured in cucumber.js worldParameters. */
function budget(world) {
  return (world.minWaitTime && world.minWaitTime.page) || 8000;
}

/**
 * Click the first element matching an XPath. Tries a real Playwright click
 * (actionability checks) and falls back to an in-page native click for
 * visually-hidden / Gin-overlaid controls (checkbox labels, off-canvas radios).
 */
async function clickXpath(page, xpath, what) {
  const loc = page.locator(`xpath=${xpath}`).first();
  if (!(await loc.count())) {
    throw friendly(`${what || 'Element'} was not found or not visible.`, `XPath: ${xpath}`);
  }
  try {
    await loc.click({ timeout: 8000 });
  } catch (e) {
    const clicked = await page.evaluate((xp) => {
      const node = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!node) return false;
      node.click();
      return true;
    }, xpath);
    if (!clicked) throw friendly(`${what || 'Element'} could not be clicked.`, `XPath: ${xpath}`);
  }
}

/**
 * Resolve a form field by its visible label, placeholder, name, id, aria-label
 * or title — mirroring Behat's Mink findField(). Returns a Locator or null.
 */
async function resolveField(page, field) {
  const candidates = [
    page.getByLabel(field, { exact: false }),
    page.getByPlaceholder(field, { exact: false }),
    page.locator(`[name="${field}"]`),
    page.locator(`#${field}`),
    page.locator(`[aria-label="${field}"]`),
    page.locator(`[title="${field}"]`),
  ];
  for (const loc of candidates) {
    try {
      if (await loc.first().count()) return loc.first();
    } catch (e) {
      // Invalid CSS (e.g. a label with spaces used as an id) — skip.
    }
  }
  return null;
}

/**
 * Read a checkbox's checked state, resolving it by its visible label text.
 * Handles all common Drupal/Gin/Claro markups: label[for=id], wrapping label,
 * and sibling label. Returns true / false / null (not found).
 */
async function checkboxStateByLabel(page, label) {
  return page.evaluate((labelText) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const labels = [...document.querySelectorAll('label')]
      .filter((l) => norm(l.textContent).includes(norm(labelText)));
    for (const l of labels) {
      // label[for] -> input#id
      const forId = l.getAttribute('for');
      if (forId) {
        const byFor = document.getElementById(forId);
        if (byFor && byFor.type === 'checkbox') return byFor.checked;
      }
      // wrapping label
      const inner = l.querySelector('input[type="checkbox"]');
      if (inner) return inner.checked;
      // sibling input (preceding or following)
      const prev = l.previousElementSibling;
      if (prev && prev.matches && prev.matches('input[type="checkbox"]')) return prev.checked;
      const next = l.nextElementSibling;
      if (next && next.matches && next.matches('input[type="checkbox"]')) return next.checked;
    }
    return null;
  }, label);
}

/**
 * Read a checkbox's checked state, resolving it by a machine handle that may be
 * a DOM id, a data-drupal-selector, or a name attribute. Returns true / false /
 * null (not found).
 */
async function checkboxStateByHandle(page, handle) {
  return page.evaluate((h) => {
    const el =
      document.getElementById(h) ||
      document.querySelector(`[data-drupal-selector="${h}"]`) ||
      document.querySelector(`input[name="${h}"]`) ||
      document.querySelector(`input[name="${h}[value]"]`);
    if (!el) return null;
    return !!el.checked;
  }, handle);
}

// =============================================================================
// Checkbox state assertions (resolve by label or by machine handle)
// =============================================================================

/**
 * Assert a checkbox is checked / unchecked, found by its visible label text.
 *
 * Example #1: Then I should see the "Allow site to show welcome message" checkbox checked
 * Example #2: And I should see the "Allow custom account name" checkbox unchecked
 */
Then(/^(?:I |we )*should see the "([^"]*)" checkbox (checked|unchecked)$/, async function (label, state) {
  const want = state === 'checked';
  const actual = await checkboxStateByLabel(this.page, label);
  if (actual === null) {
    throw friendly(`No checkbox with the label "${label}" was found on the page.`);
  }
  assert.strictEqual(actual, want, friendly(`The "${label}" checkbox is ${actual ? 'checked' : 'unchecked'}, expected ${state}.`));
});

/**
 * Assert a checkbox is checked / unchecked, found by its visible label text
 * (alternate phrasing).
 *
 * Example #1: And the "Editor" checkbox should be checked
 * Example #2: And the "Site Admin" checkbox should be unchecked
 */
Then(/^the checkbox labeled "([^"]*)" should be (checked|unchecked)$/, async function (label, state) {
  const want = state === 'checked';
  const actual = await checkboxStateByLabel(this.page, label);
  if (actual === null) {
    throw friendly(`No checkbox with the label "${label}" was found on the page.`);
  }
  assert.strictEqual(actual, want, friendly(`The "${label}" checkbox is ${actual ? 'checked' : 'unchecked'}, expected ${state}.`));
});

/**
 * Assert a checkbox is checked / unchecked, resolved by a machine handle
 * (DOM id, data-drupal-selector, or name attribute).
 *
 * Example #1: And the "edit-enable" checkbox is checked
 * Example #2: And the "entity_json" checkbox is checked
 */
Then(/^the Drupal checkbox "([^"]*)" is (checked|unchecked)$/, async function (handle, state) {
  const want = state === 'checked';
  const actual = await checkboxStateByHandle(this.page, handle);
  if (actual === null) {
    throw friendly(`No checkbox resolvable from "${handle}" (id / data-drupal-selector / name) was found.`);
  }
  assert.strictEqual(actual, want, friendly(`The "${handle}" checkbox is ${actual ? 'checked' : 'unchecked'}, expected ${state}.`));
});

// =============================================================================
// Entity operation presence in an admin listing row
// =============================================================================

/**
 * Assert that a named entity-operation link (View JSON, View API Docs, Edit,
 * Layout, Edit items, Clone, Delete ...) is present / absent in the operations
 * dropbutton of the admin-listing row whose label matches the given entity.
 *
 * The trailing entity-type word (content | media | term | entity | file | user)
 * is descriptive only — the row is matched by its visible label text.
 *
 * Example #1: And I should see the "View API Docs" operation for the "Homepage" content
 * Example #2: And I should not see the "View JSON" operation for the "space" term
 */
Then(/^(?:I |we )*should( not)? see the "([^"]*)" operation for the "([^"]*)" (?:entity|content|media|file|term|user)$/, async function (negate, operation, entity) {
  const present = await this.page.evaluate(({ operation, entity }) => {
    const rows = [...document.querySelectorAll('tr')].filter((tr) => tr.textContent.includes(entity));
    if (!rows.length) return { rowFound: false, opFound: false };
    for (const row of rows) {
      // Prefer the dedicated operations column when present.
      const opCells = [...row.querySelectorAll('[headers*="view-operations-table-column"], td.views-field-operations, .dropbutton')];
      const scope = opCells.length ? opCells : [row];
      for (const cell of scope) {
        const hit = [...cell.querySelectorAll('a, button')].some((el) => el.textContent.replace(/\s+/g, ' ').trim() === operation);
        if (hit) return { rowFound: true, opFound: true };
      }
    }
    return { rowFound: true, opFound: false };
  }, { operation, entity });

  if (!present.rowFound) {
    throw friendly(`No listing row containing "${entity}" was found on the page.`);
  }
  if (negate) {
    assert.ok(!present.opFound, friendly(`Row "${entity}" unexpectedly has the "${operation}" operation.`));
  } else {
    assert.ok(present.opFound, friendly(`Row "${entity}" is missing the "${operation}" operation.`));
  }
});

// =============================================================================
// Generic "click text inside an element matched by tag + attribute contains"
// =============================================================================

/**
 * Click the element of a given HTML tag whose <attr> attribute contains <value>
 * and whose visible text matches <text>. Covers the Shepherd tour "Next"
 * button (tag=button, class "... shepherd-button"), the moderation-sidebar
 * Translate link (tag=a, class "moderation-sidebar-link ...") and the Linkit
 * autocomplete suggestion (tag=ul, class "ui-autocomplete").
 *
 * Example #1: When I click "Next" in the "button" element with the "class" attribute set to "shepherd-button"
 * Example #2: When I click "Translate" in the "a" element with the "class" attribute set to "moderation-sidebar-link button use-ajax"
 */
When(/^(?:I |we )*click "([^"]*)" in the "([^"]*)" element with the "([^"]*)" attribute set to "([^"]*)"$/, async function (text, tag, attr, value) {
  const clicked = await this.page.evaluate(({ text, tag, attr, value }) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const wantText = norm(text);
    const els = [...document.querySelectorAll(tag)];
    for (const el of els) {
      const a = el.getAttribute(attr) || '';
      if (!a.includes(value)) continue;
      // For a list container (e.g. ui-autocomplete) the visible text lives in a
      // descendant <li>/<a>; click the deepest matching descendant if present.
      if (norm(el.textContent).includes(wantText)) {
        const descendant = [...el.querySelectorAll('*')].find((d) => norm(d.textContent) === wantText && d.children.length === 0);
        (descendant || el).click();
        return true;
      }
    }
    return false;
  }, { text, tag, attr, value });
  if (!clicked) {
    throw friendly(`"${text}" was not found in a <${tag}> whose ${attr} contains "${value}".`);
  }
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// Image attribute assertions (title / alt contains)
// =============================================================================

/** Poll until at least one element matches the locator, or time out. */
async function waitForImage(page, selector, timeout) {
  const start = Date.now();
  do {
    if (await page.locator(selector).count()) return true;
    await page.waitForTimeout(150);
  } while (Date.now() - start < timeout);
  return false;
}

/**
 * Assert an <img> whose title attribute contains the given text exists.
 *
 * Example #1: Then I should see image with the "Flag Earth all earth in space" title text
 */
Then(/^(?:I |we )*should see image with the "([^"]*)" title text$/, async function (titleText) {
  const ok = await waitForImage(this.page, `img[title*="${titleText}"]`, budget(this));
  if (!ok) throw friendly(`No image with a title containing "${titleText}" was found on the page.`);
});

/**
 * Assert an <img> whose alt attribute contains the given text exists.
 *
 * Example #1: And I should see image with the "Embed Flag Earth in space" alt text
 */
Then(/^(?:I |we )*should see image with the "([^"]*)" alt text$/, async function (altText) {
  const ok = await waitForImage(this.page, `img[alt*="${altText}"]`, budget(this));
  if (!ok) throw friendly(`No image with an alt containing "${altText}" was found on the page.`);
});

// =============================================================================
// Expand a collapsed details/fieldset by id
// =============================================================================

/**
 * Open a collapsed <details>/fieldset by its element id so its inner fields
 * become interactable (e.g. the node form "Menu settings", the entityqueue
 * form widget).
 *
 * Example #1: And I expand the field "edit-menu"
 * Example #2: And I expand the field "edit-entityqueue-form-widget"
 */
When(/^(?:I |we )*expand the field "([^"]*)"$/, async function (fieldId) {
  const ok = await this.page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const details = el.tagName.toLowerCase() === 'details' ? el : el.closest('details');
    if (details) {
      details.setAttribute('open', '');
      const summary = details.querySelector('summary');
      if (summary) summary.setAttribute('aria-expanded', 'true');
      return true;
    }
    // Fallback: a non-details collapsible — remove a "collapsed" class.
    el.classList.remove('collapsed');
    el.setAttribute('open', '');
    return true;
  }, fieldId);
  if (!ok) throw friendly(`Could not find a collapsible field with id "${fieldId}".`);
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// Paragraphs add-component widget
// =============================================================================

/**
 * In the Paragraphs "Add Component" widget / dialog, add a paragraph of the
 * given bundle machine name (e.g. bp_block, bp_columns, text_and_image).
 *
 * Example #1: And I select the "bp_block" paragraph component
 * Example #2: And I select the "text_and_image" paragraph component
 */
When(/^(?:I |we )*select the "([^"]*)" paragraph component$/, async function (bundle) {
  // The add button's name attribute contains the bundle (Behat matched
  // [contains(@name, bundle)] inside .paragraphs-add-dialog). Try the dialog
  // first, then the inline add-more widget.
  const xpaths = [
    `//*[contains(@class,"paragraphs-add-dialog") and contains(@class,"ui-dialog-content")]//*[contains(@name,"${bundle}")]`,
    `//*[contains(@class,"paragraphs-add-dialog")]//*[contains(@name,"${bundle}")]`,
    `//*[contains(@name,"${bundle}_add_more")]`,
    `//input[contains(@name,"${bundle}")] | //button[contains(@name,"${bundle}")]`,
  ];
  let done = false;
  for (const xp of xpaths) {
    if (await this.page.locator(`xpath=${xp}`).first().count()) {
      await clickXpath(this.page, xp, `The "${bundle}" paragraph component`);
      done = true;
      break;
    }
  }
  if (!done) throw friendly(`The "${bundle}" paragraph component add button was not found.`);
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// Moderation sidebar + Editoria11y accessibility checker
// =============================================================================

/**
 * Open the Moderation Sidebar off-canvas panel from the admin toolbar
 * (moderation_sidebar "Tasks" tab).
 *
 * Example #1: When I open the moderation sidebar
 */
When(/^(?:I |we )*open (?:the )?moderation sidebar$/, async function () {
  const tab = this.page.locator('#toolbar-bar .moderation-sidebar-toolbar-tab a').first();
  if (!(await tab.count())) {
    throw friendly('The moderation sidebar "Tasks" toolbar tab was not found.', 'It is provided by the moderation_sidebar module on moderated content.');
  }
  // The tab is a Drupal toolbar control that loads the moderation off-canvas
  // dialog over AJAX. Click it (real click first; native in-page click as a
  // fallback for overlay/timing) and poll until the off-canvas
  // (#drupal-off-canvas) has actually rendered its content.
  const opened = async () => this.page.evaluate(() => {
    const oc = document.querySelector('#drupal-off-canvas');
    return !!(oc && oc.textContent && oc.textContent.trim().length > 0);
  });
  const fire = async () => {
    try {
      await tab.click({ timeout: 8000 });
    } catch (e) {
      await this.page.evaluate(() => {
        const a = document.querySelector('#toolbar-bar .moderation-sidebar-toolbar-tab a');
        if (a) a.click();
      });
    }
  };
  const deadline = Date.now() + Math.max(20000, budget(this));
  await fire();
  while (Date.now() < deadline && !(await opened())) {
    await smartSettle(this.page, 2000);
    if (await opened()) break;
    await this.page.waitForTimeout(700);
    if (await opened()) break;
    await fire();
  }
  if (!(await opened())) {
    throw friendly('The moderation sidebar off-canvas did not open.');
  }
  await smartSettle(this.page, budget(this));
});

/**
 * Assert an action IS / IS NOT offered in the open moderation sidebar
 * (#drupal-off-canvas). Scoped to the sidebar so it is not confused by hidden
 * Layout Builder / block contextual "Delete" links elsewhere on the page (the
 * page-wide "I should not see" reads textContent, which includes those hidden
 * links). Case-insensitive substring, so "Revisions" matches "Show revisions"
 * and "Delete" matches "Delete content".
 *
 * Example #1: Then the moderation sidebar should show "Edit content"
 * Example #2: And the moderation sidebar should not show "Delete"
 */
async function moderationSidebarText(page) {
  const oc = page.locator('#drupal-off-canvas');
  if (!(await oc.count())) {
    throw friendly('The moderation sidebar off-canvas is not open.');
  }
  return ((await oc.first().innerText()) || '').toLowerCase();
}

Then(/^(?:the )?moderation sidebar should show "([^"]*)"$/, async function (text) {
  const body = await moderationSidebarText(this.page);
  assert.ok(
    body.includes(text.toLowerCase()),
    friendly(`The moderation sidebar does not show "${text}".`)
  );
});

Then(/^(?:the )?moderation sidebar should not show "([^"]*)"$/, async function (text) {
  const body = await moderationSidebarText(this.page);
  assert.ok(
    !body.includes(text.toLowerCase()),
    friendly(`The moderation sidebar unexpectedly shows "${text}".`)
  );
});

/**
 * Assert the Editoria11y accessibility checker is present on the page.
 *
 * Example #1: Then I should see the a11y checker
 */
Then(/^(?:I |we )*should see (?:the )?(?:accessibility |a11y )?checker$/, async function () {
  const ok = await waitForImage(this.page, 'ed11y-element-panel', budget(this));
  if (!ok) throw friendly('The Editoria11y (a11y) checker was not found on the page.');
});

/**
 * Assert the Editoria11y accessibility checker is NOT present on the page.
 *
 * Example #1: Then I should not see the a11y checker
 */
Then(/^(?:I |we )*should not see (?:the )?(?:accessibility |a11y )?checker$/, async function () {
  // Give it the same grace period the positive check waits, then assert absence.
  await this.page.waitForTimeout(Math.min(4000, budget(this)));
  const count = await this.page.locator('ed11y-element-panel').count();
  assert.strictEqual(count, 0, friendly('The Editoria11y (a11y) checker was unexpectedly present on the page.'));
});

/**
 * Close / dismiss the Editoria11y accessibility checker so it does not overlay
 * the off-canvas / moderation UI. Clicks the toggle inside its shadow root.
 *
 * Example #1: And I close the a11y checker
 */
When(/^(?:I |we )*close (?:the )?(?:accessibility |a11y )?checker$/, async function () {
  const closed = await this.page.evaluate(() => {
    const panel = document.querySelector('ed11y-element-panel');
    if (!panel || !panel.shadowRoot) return false;
    const toggle = panel.shadowRoot.querySelector('#ed11y-toggle');
    if (!toggle) return false;
    toggle.click();
    return true;
  });
  if (!closed) {
    throw friendly('The Editoria11y (a11y) checker toggle was not found to close.');
  }
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// CKEditor 5 rich text editor — fill (model-aware)
// =============================================================================

/**
 * Fill a CKEditor 5 rich-text field with HTML, updating the editor MODEL (so the
 * content survives form submit) — not just the contenteditable DOM. Resolves the
 * field by its source <textarea> id / name, or by its visible label, then calls
 * the bound CKEditor 5 instance's setData(). Falls back to writing the
 * contenteditable + textarea value when no instance is registered.
 *
 * Example #1: And I fill in the rich text editor field "Body" with the "<p>Hello</p>"
 * Example #2: And I fill in the rich text editor field "edit-body-0-value" with the "Text"
 */
When(/^(?:I |we )*fill in the rich text editor field "([^"]*)" with the "([^"]*)"$/, async function (field, html) {
  const ok = await this.page.evaluate(({ field, html }) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    // Resolve the source textarea for the field.
    let ta =
      document.getElementById(field) ||
      document.querySelector(`textarea[name="${field}"]`) ||
      document.querySelector(`textarea[data-drupal-selector="${field}"]`);
    if (!ta) {
      // Resolve by visible label -> for -> element.
      const label = [...document.querySelectorAll('label')].find((l) => norm(l.textContent).includes(norm(field)));
      if (label) {
        const forId = label.getAttribute('for');
        if (forId) {
          const el = document.getElementById(forId);
          if (el && el.tagName === 'TEXTAREA') ta = el;
          // The text-format widget wraps the textarea; find it nearby.
          if (!ta) {
            const wrap = label.closest('.js-form-item, .form-item, .field--type-text-long, .text-format-wrapper');
            if (wrap) ta = wrap.querySelector('textarea');
          }
        }
      }
    }
    // Try the CKEditor 5 instance bound to this textarea.
    const instances = window.Drupal && window.Drupal.CKEditor5Instances;
    if (ta && instances && ta.dataset && ta.dataset.ckeditor5Id) {
      const inst = instances.get(ta.dataset.ckeditor5Id);
      if (inst && typeof inst.setData === 'function') {
        inst.setData(html.indexOf('<') === 0 ? html : `<p>${html}</p>`);
        return true;
      }
    }
    // Fallback: search all instances for the one whose source element is ta.
    if (instances && typeof instances.forEach === 'function') {
      let hit = false;
      instances.forEach((inst) => {
        if (hit) return;
        const src = inst && inst.sourceElement;
        if ((ta && src === ta) || (!ta && src)) {
          if (typeof inst.setData === 'function') {
            inst.setData(html.indexOf('<') === 0 ? html : `<p>${html}</p>`);
            hit = true;
          }
        }
      });
      if (hit) return true;
    }
    // Last resort: write the contenteditable + the textarea value directly.
    const ce = document.querySelector('.ck-editor__editable[contenteditable="true"]');
    if (ce) ce.innerHTML = html.indexOf('<') === 0 ? html : `<p>${html}</p>`;
    if (ta) ta.value = html;
    return !!(ce || ta);
  }, { field, html });
  if (!ok) throw friendly(`Could not fill the rich text editor field "${field}".`);
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// CKEditor 5 rich text editor — toolbar command + link insert
// =============================================================================

/**
 * Click a CKEditor 5 toolbar command button (e.g. Link, Bold) within the
 * WYSIWYG editor bound to the named field label.
 *
 * Example #1: And I click on "Link" command button in the rich text editor field "Body"
 */
When(/^(?:I |we )*click on "([^"]*)" command button in the rich text editor field "([^"]*)"$/, async function (command, field) {
  // CKEditor 5 toolbar buttons expose the command name as the button label
  // (aria-label / .ck-button__label). Scope to the editor of the named field
  // when resolvable, otherwise search the whole toolbar.
  const fieldLoc = await resolveField(this.page, field);
  let root = this.page;
  if (fieldLoc) {
    const wrapper = this.page.locator('.field--type-text-long, .form-item, .js-form-item').filter({ has: fieldLoc }).first();
    if (await wrapper.count()) root = wrapper;
  }
  let btn = root.getByRole('button', { name: command, exact: false }).first();
  if (!(await btn.count())) {
    btn = this.page.locator(`xpath=//button[.//span[normalize-space()="${command}"] or @aria-label="${command}"]`).first();
  }
  if (!(await btn.count())) {
    throw friendly(`The "${command}" command button in the "${field}" rich text editor was not found.`);
  }
  await btn.click({ timeout: 8000 });
  await smartSettle(this.page, budget(this));
});

/**
 * Click the insert / save button of the CKEditor 5 link (Drupal entity link)
 * dialog associated with the named WYSIWYG field.
 *
 * Example #1: And I click on the insert button in "Body" rich text editor field
 */
When(/^(?:I |we )*click on(?: the)?(?: save| insert| action| apply)? button in "([^"]*)" rich text editor field$/, async function (field) {
  let btn = this.page.locator('button.ck-button-save').first();
  if (!(await btn.count())) {
    btn = this.page.locator('button.ck-button-action.ck-button_with-text, button.ck-button-action').first();
  }
  if (!(await btn.count())) {
    throw friendly(`No save / insert button was found for the "${field}" rich text editor field.`);
  }
  await btn.click({ timeout: 8000 });
  await smartSettle(this.page, budget(this));
});

/**
 * Type a query into the open CKEditor 5 Drupal-link balloon's "Link URL" field
 * so Linkit's autocomplete (ul.ui-autocomplete) searches for internal content.
 *
 * The balloon holds several inputs (Displayed text, Title, ARIA label, CSS
 * classes … from editor_advanced_link), so target the one whose label is
 * "Link URL". CKEditor 5's input reacts only to real per-character typing (a
 * value assignment is ignored), so type with a small delay to let Linkit
 * debounce and query. This replaces the CKEditor-4-era "fill in … for
 * 'Link URL'" + keypress steps.
 *
 * Example #1: When I fill in the link URL "Linking to"
 */
When(/^(?:I |we )*fill in the link URL "([^"]*)"$/, async function (query) {
  const input = this.page
    .locator('.ck-balloon-panel .ck-labeled-field-view, .ck-link-form .ck-labeled-field-view')
    .filter({ has: this.page.getByText('Link URL', { exact: true }) })
    .locator('input')
    .first();
  if (!(await input.count())) {
    throw friendly('The CKEditor 5 link balloon "Link URL" field was not found.');
  }
  await input.click();
  await input.fill('');
  await input.pressSequentially(query, { delay: 80 });
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// Keypress in a field (drives autocomplete, e.g. Linkit)
// =============================================================================

/**
 * Dispatch a single keystroke / character into a field located by label, to
 * drive autocomplete (e.g. Linkit). " " inserts a space, single letters type
 * the character, named keys (enter, tab, escape ...) press that key.
 *
 * Example #1: And I keypress " " in "Link URL" field
 * Example #2: And I keypress "enter" in "Link URL" field
 */
When(/^(?:I |we )*keypress "([^"]*)" in "([^"]*)" field$/, async function (key, field) {
  const field_loc = await resolveField(this.page, field);
  if (!field_loc) throw friendly(`Field "${field}" was not found.`);
  await field_loc.focus();
  const special = {
    enter: 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape',
    backspace: 'Backspace', delete: 'Delete', up: 'ArrowUp', down: 'ArrowDown',
    left: 'ArrowLeft', right: 'ArrowRight', home: 'Home', end: 'End',
    pageup: 'PageUp', pagedown: 'PageDown',
  };
  const named = special[key.toLowerCase().replace(/\s+/g, '')];
  if (named && key.trim() !== '') {
    await this.page.keyboard.press(named);
  } else {
    // A literal character (including a single space) — type it so the
    // autocomplete input/keyup handlers fire.
    await this.page.keyboard.type(key);
  }
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// Layout Builder — Bootstrap section settings (off-canvas)
// =============================================================================

/** Move to the section "Appearance"/styles tab of the off-canvas form. */
async function openStylesTab(page) {
  await page.evaluate(() => {
    const tab = document.querySelector('a[data-target*="appearance"], a[href*="appearance"]');
    if (tab) tab.click();
  });
}

/** Open a named styles sub-menu (Background / Typography / ...) via its details. */
async function openSectionMenu(page, menu) {
  await openStylesTab(page);
  await page.evaluate((title) => {
    const xpath = `//span[contains(text(),'${title}')]`;
    const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (node) {
      const details = node.closest('details');
      if (details) details.setAttribute('open', '');
    }
  }, menu);
}

/**
 * Add a basic section at the end of the layout, choosing the named Bootstrap
 * layout (e.g. "2 Cols"), then opening its section settings form.
 *
 * Example #1: When I add a basic "2 Cols" section at the end of layout
 */
When(/^(?:I |we )*add a basic "([^"]*)" section at the end of layout$/, async function (cols) {
  await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await clickXpath(
    this.page,
    `//a[contains(@class,"layout-builder__link--add") and contains(.,"at end of layout")]`,
    'The "Add section at end of layout" link'
  );
  await smartSettle(this.page, budget(this));
  await clickXpath(
    this.page,
    `//*[contains(@class,"use-ajax") and contains(normalize-space(.),"${cols}")]`,
    `The "${cols}" layout option`
  );
  await smartSettle(this.page, budget(this));

  // On Drupal 11.4 / newer Bootstrap Layout Builder the layout option adds the
  // section directly instead of opening its settings in the off-canvas. When
  // the section settings form (container type, breakpoints, background) did not
  // open, click the newly added (highest-delta) section's "Configure" link. It
  // is a use-ajax link that opens the settings in the #drupal-off-canvas dialog,
  // where the following section-settings steps run.
  const hasSettingsForm = await this.page.locator('[id*="layout-container-type"]').count();
  if (!hasSettingsForm) {
    const links = this.page.locator(
      'a.layout-builder__link--configure[href*="/layout_builder/configure-form/section/"]'
    );
    const count = await links.count();
    let bestLink = null;
    let bestDelta = -1;
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      const delta = parseInt(href.split('/').pop(), 10);
      if (delta > bestDelta) {
        bestDelta = delta;
        bestLink = links.nth(i);
      }
    }
    if (bestLink) {
      await bestLink.click();
      await smartSettle(this.page, budget(this));
    }
  }
});

/**
 * Submit the Layout Builder section settings off-canvas form (the
 * "Add section" / "Update" button).
 *
 * Example #1: And I save the section
 */
When(/^(?:I |we )*save the section$/, async function () {
  await clickXpath(
    this.page,
    `//*[contains(@value,"Add section") or contains(@value,"Update")]`,
    'The section "Add section" / "Update" button'
  );
  await smartSettle(this.page, budget(this));
});

/**
 * Select a section container type, and (for "Boxed") its width.
 *
 * Example #1: And I select the "Boxed" container type with a "Medium" width
 */
When(/^(?:I |we )*select the "([^"]*)" container type(?: with a "([^"]*)" width)?$/, async function (type, width) {
  await clickXpath(
    this.page,
    `//label[contains(.,"${type}") and contains(@for,"edit-layout-settings-ui-tab-content-layout-container-type")]`,
    `The "${type}" container type`
  );
  await smartSettle(this.page, budget(this));
  if (width) {
    await clickXpath(
      this.page,
      `//label[contains(.,"${width}") and contains(@for,"edit-layout-settings-ui-tab-content-layout-container-width")]`,
      `The "${width}" container width`
    );
    await smartSettle(this.page, budget(this));
  }
});

/**
 * Select a section column ratio for a breakpoint (e.g. md -> 33% 67%).
 *
 * Example #1: And I select the "md" "33% 67%" section breakpoint
 */
When(/^(?:I |we )*select the "([^"]*)" "([^"]*)" section breakpoint$/, async function (size, ratio) {
  await clickXpath(
    this.page,
    `//*[contains(@class,"${size}") and contains(normalize-space(.),"${ratio}")]`,
    `The "${ratio}" ratio for the "${size}" breakpoint`
  );
  await smartSettle(this.page, budget(this));
});

/**
 * Toggle the section "With Gutters" (keep gutters between columns) option.
 *
 * Example #1: And I add section gutters
 */
When(/^(?:I |we )*add section gutters$/, async function () {
  await clickXpath(this.page, `//label[contains(.,"With Gutters")]`, 'The "With Gutters" option');
  await smartSettle(this.page, budget(this));
});

/**
 * Select the section background colour (opens Background menu + colour tab).
 *
 * Example #1: And I select the "Light" section background color
 */
When(/^(?:I |we )*select the "([^"]*)" section background color$/, async function (color) {
  await openSectionMenu(this.page, 'Background');
  await this.page.evaluate(() => {
    const node = document.querySelector('label[for*="edit-layout-settings-ui-tab-content-appearance-background-background-type-color"]');
    if (node) node.click();
  });
  await smartSettle(this.page, budget(this));
  await clickXpath(
    this.page,
    `//label[contains(.,"${color}") and contains(@for,"edit-layout-settings-ui-tab-content-appearance-background-background-color")]`,
    `The "${color}" background colour`
  );
  await smartSettle(this.page, budget(this));
});

/**
 * Uncheck the section "Edge to Edge Background" option.
 *
 * Example #1: And I uncheck the Edge to Edge Background
 */
When(/^(?:I |we )*uncheck the Edge to Edge Background$/, async function () {
  await openSectionMenu(this.page, 'Background');
  await clickXpath(
    this.page,
    `//input[contains(@class,"field-background-edge-to-edge")]`,
    'The "Edge to Edge Background" checkbox'
  );
  await smartSettle(this.page, budget(this));
});

/**
 * Select the section text colour (opens Typography menu).
 *
 * Example #1: And I select the "Dark" section text color
 */
When(/^(?:I |we )*select the "([^"]*)" section text color$/, async function (color) {
  await openSectionMenu(this.page, 'Typography');
  await clickXpath(
    this.page,
    `//label[contains(.,"${color}") and contains(@for,"edit-layout-settings-ui-tab-content-appearance-typography-text-color-text")]`,
    `The "${color}" text colour`
  );
  await smartSettle(this.page, budget(this));
});

/**
 * Set the section content alignment (Start / Center / End / Justify).
 *
 * Example #1: And I set the alignment to "End"
 */
When(/^(?:I |we )*set the alignment to "([^"]*)"$/, async function (align) {
  await openSectionMenu(this.page, 'Typography');
  await clickXpath(
    this.page,
    `//label[contains(.,"${align}") and contains(@for,"edit-layout-settings-ui-tab-content-appearance-typography-text-alignment")]`,
    `The "${align}" alignment`
  );
  await smartSettle(this.page, budget(this));
});

// =============================================================================
// Select an option from a <select> resolved by its visible LABEL
// =============================================================================

/**
 * Select an option (by its visible option text, falling back to value) from a
 * <select> resolved by its visible label, or a partial name / id when the label
 * is ambiguous. Needed for paragraph subform selects whose label is a single
 * word (e.g. "Block", "Webform") — the webship core "select from" step treats a
 * single-word target as a name/id, never a label, and the subform select's DOM
 * id carries a random "--XXXX" suffix so it cannot be addressed by a fixed #id.
 *
 * Example #1: And I select "Site branding" from the "Block" dropdown
 * Example #2: And I select "Contact" from the "Webform" dropdown
 */
When(/^(?:I |we )*select "([^"]*)" from the "([^"]*)" dropdown$/, async function (option, target) {
  const candidates = [
    this.page.getByLabel(target, { exact: true }),
    this.page.getByLabel(target, { exact: false }),
    this.page.locator(`select[name="${target}"]`),
    this.page.locator(`select[name*="${target}"]`),
    this.page.locator(`select[id*="${target}"]`),
  ];
  let loc = null;
  for (const c of candidates) {
    try {
      if (await c.first().count()) { loc = c.first(); break; }
    } catch (e) { /* invalid selector — skip */ }
  }
  if (!loc) throw friendly(`No <select> resolvable from "${target}" (label / name / id) was found.`);
  try {
    await loc.selectOption({ label: option }, { timeout: 5000 });
  } catch (e) {
    try {
      // Fall back to matching by the option's value attribute.
      await loc.selectOption(option, { timeout: 3000 });
    } catch (e2) {
      // Last resort: partial (contains) option-text match. Drupal sometimes
      // suffixes the option label (e.g. Views Bulk Operations renders "Delete
      // selected entities / translations" once content_translation is enabled).
      const value = await loc.first().evaluate((sel, text) => {
        const opt = [...sel.options].find((o) => o.textContent.trim().includes(text));
        return opt ? opt.value : null;
      }, option);
      if (value === null) {
        throw friendly(`No option matching "${option}" was found in the "${target}" dropdown.`);
      }
      await loc.selectOption(value);
    }
  }
  await smartSettle(this.page, budget(this));
});

/**
 * Open the Media Library widget of a specific field by its machine name.
 *
 * On Drupal 11.4 the media-library "Add media" open button renders with a
 * random "--XXXX" id suffix, and a single paragraph subform can contain several
 * "Add media" buttons (e.g. the text_and_image bundle has both field_image and
 * a bp_image field), so neither the old fixed id nor the "Add media" label is
 * unique. Match the visible open button whose id contains "<field>-open-button".
 *
 * Example #1: And I open the "field_image" media library
 * Example #2: And I open the "field_media_single" media library
 */
When(/^(?:I |we )*open the "([^"]*)" media library$/, async function (field) {
  const frag = field.replace(/_/g, '-');
  const btn = this.page
    .locator(`input[id*="${frag}-open-button"]:visible, button[id*="${frag}-open-button"]:visible`)
    .first();
  if (!(await btn.count())) {
    throw friendly(`No media library open button for the "${field}" field was found.`);
  }
  await btn.click({ timeout: 8000 });
  await smartSettle(this.page, budget(this));
});

/**
 * Select a Media Library grid item by its "Select <name>" checkbox, tolerating
 * duplicate items. A retried upload scenario (cucumber `retry: 1`) can leave two
 * media with the same name, so webship's built-in "I check" would strict-fail on
 * two identically labelled checkboxes — pick the first.
 *
 * Example #1: And I select the media "Embed Flag Earth"
 * Example #2: And I select the media "Flag Earth"
 */
When(/^(?:I |we )*select the media "([^"]*)"$/, async function (name) {
  const cb = this.page.getByLabel(`Select ${name}`, { exact: true }).first();
  if (!(await cb.count())) {
    throw friendly(`No media library item labelled "Select ${name}" was found.`);
  }
  await cb.check({ timeout: 8000 });
  await smartSettle(this.page, budget(this));
});

/**
 * Check the first checkbox matching a label, tolerating duplicates. A retried
 * scenario (cucumber `retry: 1`) can leave two identically titled nodes, so
 * two checkboxes carry the same label (e.g. the entityqueue widget) and the
 * built-in "I check" strict-fails; the duplicates are equivalent - pick the
 * first.
 *
 * Example #1: When I check the first "Test hero slider #1"
 */
When(/^(?:I |we )*check the first "([^"]*)"$/, async function (label) {
  const cb = this.page.getByLabel(label, { exact: true }).first();
  if (!(await cb.count())) {
    throw friendly(`No checkbox labelled "${label}" was found.`);
  }
  await cb.check({ timeout: 8000 });
  await smartSettle(this.page, budget(this));
});

/**
 * Insert the currently selected item(s) in the open Media Library dialog.
 * The dialog submit ("Insert selected") is cloned by jQuery UI into the dialog
 * button pane, so the original form button is hidden; target the visible one.
 * Replaces the old `press "dialog-submit" by its "id"` which no longer resolves
 * on Drupal 11.4 (the media dialog button has no "dialog-submit" id).
 *
 * Example #1: And I insert the selected media
 */
When(/^(?:I |we )*insert the selected media$/, async function () {
  const btn = this.page
    .locator('button:has-text("Insert selected"):visible, input[value="Insert selected"]:visible')
    .first();
  if (!(await btn.count())) {
    throw friendly('No "Insert selected" button was found in the media library dialog.');
  }
  await btn.click({ timeout: 8000 });
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Varbase reference steps: "a working header" / "a working footer".
// Verify the Varbase Drupal Canvas global Header / Footer regions render the
// expected Main navigation, Secondary / Footer / Social menus, credits and logos.
// Moved here from custom.steps.js — see that file for how to add your own steps.
// -----------------------------------------------------------------------------

/**
 * Verify the page header is "working".
 *
 * On a Varbase site the Main navigation menu is rendered through the Drupal
 * Canvas global Header region, so a working header means those primary links
 * are present. Alter the links below to match your own site's main menu.
 *
 * Example: Then the page should have a working header
 */
Then(/^(?:the page should have|(?:I |we )*should have) a working header$/, async function () {
  // Smart-wait for the page to reach a quiet edge before reading the header.
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);

  // `banner` is the ARIA role of the site header (<header role="banner">).
  const header = this.page.getByRole('banner').first();
  const text = (await header.textContent().catch(() => '')) || '';

  // Main navigation menu links expected in the header (one per line):
  if (!text.includes('About Varbase')) throw friendly('Header is missing the "About Varbase" link.', 'Check the Main navigation menu in the Canvas Header region.');
  if (!text.includes('Features')) throw friendly('Header is missing the "Features" link.', 'Check the Main navigation menu in the Canvas Header region.');
  if (!text.includes('Blog')) throw friendly('Header is missing the "Blog" link.', 'Check the Main navigation menu in the Canvas Header region.');
  if (!text.includes('Contact Us')) throw friendly('Header is missing the "Contact Us" link.', 'Check the Main navigation menu in the Canvas Header region.');
});

/**
 * Verify the page footer is "working".
 *
 * On a Varbase site the Secondary, Footer and Social media menus are rendered
 * through the Drupal Canvas global Footer region. A working footer means the
 * footer link text is present, the social profiles are linked, and the credits
 * and logos show. Alter the lines below to match your own site.
 *
 * Example: Then the page should have a working footer
 */
Then(/^(?:the page should have|(?:I |we )*should have) a working footer$/, async function () {
  // Smart-wait for the page to reach a quiet edge before reading the footer.
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);

  // `contentinfo` is the ARIA role of the site footer (<footer role="contentinfo">).
  // Scope to the role so card/section <footer> elements elsewhere are ignored.
  const footer = this.page.getByRole('contentinfo').first();
  const text = (await footer.textContent().catch(() => '')) || '';

  // Secondary menu (Footer sitemap / Quicklinks) link text (one per line):
  if (!text.includes('Quicklinks')) throw friendly('Footer is missing the "Quicklinks" heading.', 'Check the Secondary menu in the Canvas Footer region.');
  if (!text.includes('Features')) throw friendly('Footer is missing the "Features" link.', 'Check the Secondary menu in the Canvas Footer region.');
  if (!text.includes('About Varbase')) throw friendly('Footer is missing the "About Varbase" link.', 'Check the Secondary menu in the Canvas Footer region.');

  // Footer menu (Support) link text (one per line):
  if (!text.includes('Support')) throw friendly('Footer is missing the "Support" heading.', 'Check the Footer menu in the Canvas Footer region.');
  if (!text.includes('Documentation')) throw friendly('Footer is missing the "Documentation" link.', 'Check the Footer menu in the Canvas Footer region.');
  if (!text.includes('Get Professional Support')) throw friendly('Footer is missing the "Get Professional Support" link.', 'Check the Footer menu in the Canvas Footer region.');
  if (!text.includes('Community Support')) throw friendly('Footer is missing the "Community Support" link.', 'Check the Footer menu in the Canvas Footer region.');

  // Footer credit and legal text (one per line):
  if (!text.includes('Enjoy the free software, or')) throw friendly('Footer is missing the "Enjoy the free software, or get a quote ..." credit.');
  if (!text.includes('get a quote')) throw friendly('Footer is missing the "get a quote" link text.');
  if (!text.includes('Terms and Conditions')) throw friendly('Footer is missing the "Terms and Conditions" link.');
  if (!text.includes('Powered by')) throw friendly('Footer is missing the "Powered by" credit.');

  // Social media menu profiles - full links (one per line):
  if ((await footer.locator('a[href="https://www.linkedin.com/company/vardot"]').count()) === 0) throw friendly('Footer is missing the LinkedIn link (https://www.linkedin.com/company/vardot).', 'Check the Social media menu in the Canvas Footer region.');
  if ((await footer.locator('a[href="https://www.facebook.com/vardotters/"]').count()) === 0) throw friendly('Footer is missing the Facebook link (https://www.facebook.com/vardotters/).', 'Check the Social media menu in the Canvas Footer region.');
  if ((await footer.locator('a[href="https://www.instagram.com/vardotters/"]').count()) === 0) throw friendly('Footer is missing the Instagram link (https://www.instagram.com/vardotters/).', 'Check the Social media menu in the Canvas Footer region.');
  if ((await footer.locator('a[href="https://x.com/Vardot"]').count()) === 0) throw friendly('Footer is missing the X link (https://x.com/Vardot).', 'Check the Social media menu in the Canvas Footer region.');

  // Footer logos (one per line):
  if ((await footer.locator('img[alt="Varbase logo"]').count()) === 0) throw friendly('Footer is missing the Varbase logo.');
  if ((await footer.locator('img[alt="Vardot"]').count()) === 0) throw friendly('Footer is missing the Vardot logo next to "Powered by".');
});
