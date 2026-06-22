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
