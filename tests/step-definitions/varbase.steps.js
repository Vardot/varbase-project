'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Reuse webship-js's own helpers so these custom steps behave like the core
// ones: `smartSettle` (the smart "wait for a quiet edge" used by every
// navigation step) and `friendly` (tester-friendly error formatting).
const { smartSettle, friendly, fillField, gotoUrl, waitForPageLoad } = require('webship-js/tests/step-definitions/webship');
const path = require('path');
const fs = require('fs');
const { Before, BeforeStep, AfterStep } = require('@cucumber/cucumber');

// TEMP DIAGNOSTIC: collect every raw (unfiltered) console/page error per
// scenario so the CK-DIAG dump in setCkeditorData can show the real reason the
// editor failed to boot. Attaches once, the first step that has a live page.
BeforeStep(function () {
  if (this.page && !this.__jsErrHooked) {
    this.__jsErrHooked = true;
    this.__rawJsErrors = [];
    this.page.on('pageerror', (e) => this.__rawJsErrors.push('[pageerror] ' + String(e.message || '').split('\n')[0]));
    this.page.on('console', (m) => { if (m.type() === 'error') this.__rawJsErrors.push('[console] ' + m.text().split('\n')[0]); });
  }
});

// Resolve step-definition ambiguity with webship-js core: drop ONLY the 3 core
// defs that collide with Varbase-specific steps in this file (probe-based,
// fail-open, never removes a repo step — guarded on uri under webship-js).
(function dropConflictingWebshipCoreSteps() {
  let builder;
  try {
    builder = require('@cucumber/cucumber/lib/support_code_library_builder').default;
  } catch (e) {
    return; // internal path moved -> fail open, ambiguity re-surfaces visibly.
  }
  const configs = builder && builder.stepDefinitionConfigs;
  if (!Array.isArray(configs)) return;
  const ownedByVarbase = [
    'the "sample" checkbox is checked',
    'the "sample" checkbox should be checked',
    'click next button in tour',
    'click the delete button',
    // Navigation: webship joins launchUrl + path with a bare `+`, so a path
    // without a leading slash (the classic Behat authoring style used across
    // the locked features, e.g. `I am on "user/login"`) collapses into
    // `http://localhostuser/login`. Our overrides normalise the join.
    'I am on "user/login"',
    'I go to "admin/content"',
    // Form field/select resolution: webship's core steps can't reach a
    // single-word <label> select ("Language"), a bracketed field name
    // (`body[0][format]` builds an invalid `#body[0][format]` CSS), a bare
    // Drupal id ("edit-name"), nor a label that differs by a word ("Email"
    // vs "Email address"). Our overrides add those fallbacks.
    'I select "en" from "Language"',
    'I fill in "x" for "Email"',
    'I attach the file "flag-earth.jpg" to "edit-field-media-image-0-upload"',
    // Click: webship matches a clickable only by its exact VISIBLE text, so a
    // control addressed by its accessible name / title (e.g. the people-list
    // profile link `<a title="View user profile.">webmaster</a>`) never
    // resolves. Our override keeps the text path and adds title/aria fallbacks.
    'I click "View user profile."',
    // Press: a fixed-position overlay (the AI chatbot widget most commonly,
    // but also sticky Gin/paragraphs action bars) sits on top of several
    // otherwise-correctly-resolved buttons (the homepage "Tour" toggle, the
    // paragraphs "+ Add" button, admin "Apply"/"Save" buttons); Playwright's
    // pointer-based .click() then hits a 30s actionability timeout even
    // though the locator itself is correct. Our override keeps the same
    // locator resolution and adds a force-click / in-page dispatch fallback
    // (the same technique the login step already uses for this reason).
    'I press "Tour"',
    'I press the "Save" button',
    // In-element text assertion: webship's core step reads ONLY inputValue() for
    // form controls, so on a <select> it matches the option's machine value
    // ("3600") not its visible label ("1 hour") the flood-control scenarios
    // assert. Our override also matches the selected option's text.
    'I should see "50" in the "#edit-ip-limit" element',
    // Field-value assertion: webship's core `the "X" field should contain "Y"`
    // reads inputValue() (the option's machine value for a <select>) and only
    // resolves X as a css selector or a <label> text — it cannot reach a field
    // addressed by its form NAME (`auto_purge[after]`), and asserts the option
    // VALUE not its visible label ("2 months"). Our override adds both.
    'the "auto_purge[after]" field should contain "2 months"',
  ];
  const isWebshipCore = (uri) => /node_modules[\\/]webship-js[\\/]/.test(String(uri || ''));
  for (let i = configs.length - 1; i >= 0; i--) {
    const c = configs[i];
    if (!isWebshipCore(c.uri) || !(c.pattern instanceof RegExp)) continue;
    if (ownedByVarbase.some((text) => c.pattern.test(text))) configs.splice(i, 1);
  }
})();

// -----------------------------------------------------------------------------
// Overrides of a few webship-js core navigation/form steps (dropped above).
// The locked feature files are authored in the classic Behat style that these
// tolerate; the overrides are strict supersets — they behave identically on
// the happy path and only add the missing fallbacks.
// -----------------------------------------------------------------------------

// Resolve the assets folder to the repo's own tests/assets/ (webship-js
// defaults `this.assetsFolder` to its own package dir, so `I attach the file
// "flag-earth.jpg"` looked for node_modules/webship-js/tests/assets/…).
Before({ order: 1 }, function () {
  this.assetsFolder = path.resolve(process.cwd(), 'tests/assets') + path.sep;
});

// Populate the named-selector registry (`this.__selectorsCss`) that the custom
// steps resolve container / child names against. webship-js loads
// worldParameters.selectors.files into its OWN registry, but the custom steps
// here read `this.__selectorsCss`, which nothing ever filled — so a named
// container like "field body" fell back to the literal string "field body"
// (an invalid CSS descendant combinator that matches nothing), making
// `I should see the ".ck.ck-editor__main" element in the "field body"` fail
// with "found none" even though CKEditor had booted correctly. Load the same
// JSON selector files webship-js uses and flatten their `css` maps here so the
// registry the custom steps consult is actually populated.
Before({ order: 2 }, function () {
  // webship-js's OWN Before hook (selectors.steps.js) already populated
  // this.__selectorsCss from the JSON preset files. We must NOT early-return on
  // that being non-empty — the previous guard did, so the "field body" default
  // below was never merged, `field body` resolved to the literal (invalid) CSS
  // string, and every `... in the "field body"` assertion false-failed with
  // "found none" AFTER a 30s wait even though CKEditor had booted correctly.
  // Start from whatever webship populated (fall back to loading the same files
  // ourselves only if it is somehow empty), then always merge our defaults.
  let map = this.__selectorsCss;
  if (!map || !Object.keys(map).length) {
    map = {};
    const cfg = (this.parameters && this.parameters.selectors) || {};
    const dir = cfg.filesPath || './tests/selectors/';
    for (const file of (cfg.files || [])) {
      try {
        const full = path.resolve(process.cwd(), dir, file);
        const json = JSON.parse(fs.readFileSync(full, 'utf8'));
        Object.assign(map, json.css || {}, json.selectors || {});
      } catch (e) { /* a missing/invalid file simply contributes nothing */ }
    }
  }
  // Named selectors the ported feature files reference that are not (or not
  // reliably) present in the shared JSON presets. Kept here so the resolution
  // is self-contained and does not silently regress if a preset changes.
  //   "field body" — the Body field wrapper on the node add/edit form. Drupal
  //   renders each field wrapper with a `field--name-<field>` class; the
  //   text-format widget (and the CKEditor 5 instance it attaches) lives
  //   inside it, so `.ck.ck-editor__main` / `#edit-body-0-value` are children.
  const defaults = {
    // The Body field widget wrapper on the node add/edit form. The CKEditor 5
    // instance (.ck.ck-editor__main) and the raw textarea (#edit-body-0-value)
    // are attached inside the textarea's own form-item wrapper
    // (.form-item--body-0-value / .js-form-item-body-0-value), which sits inside
    // the field wrapper (.field--name-body). On some form renders the outer
    // .field--name-body wrapper is not emitted, so match the widget form-item
    // wrapper too (both contain the editor); Playwright's .first() picks the
    // outermost present. Diagnosed via the CK boot state: the editor boots fine
    // but .field--name-body alone did not always contain it.
    'field body': '.field--name-body, .form-item--body-0-value, .js-form-item-body-0-value, [data-drupal-selector="edit-body-wrapper"]',
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in map)) map[k] = v;
  }
  this.__selectorsCss = map;
});

// Join launchUrl + path with exactly one slash so a path with OR without a
// leading slash resolves correctly (webship uses a bare `launchUrl + url`).
function joinUrl(launchUrl, url) {
  if (!url) return launchUrl;
  if (/^https?:\/\//i.test(url)) return url; // absolute URL, use as-is.
  return String(launchUrl).replace(/\/+$/, '') + '/' + String(url).replace(/^\/+/, '');
}

async function navigate(page, launchUrl, url, budget) {
  await gotoUrl(page, joinUrl(launchUrl, url));
  await page.waitForSelector('body', { state: 'attached', timeout: budget });
  await waitForPageLoad(page, budget);
}

// Given I am on "user/login"  /  Given we are on the "/about" page
Given(/^(?:I am |we are )*on(?: the)* "([^"]*)?"(?: page)*$/, async function (url) {
  await navigate(this.page, this.launchUrl, url, 10000);
});

// When I go to "admin/content"  /  When we navigate to "/admin/dashboard"
When(/^(?:I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$/, async function (url) {
  await navigate(this.page, this.launchUrl, url, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

// When I fill in "value" for "field".
// Delegates to webship's fillField, then adds Drupal-friendly fallbacks:
//  • a bare id ("edit-name")            -> #edit-name
//  • a known label alias ("Email")      -> "Email address"
//  • a unique partial <label> match.
const FIELD_LABEL_ALIASES = {
  'Email': 'Email address',
};
When(/^(?:I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, async function (value, field) {
  // An empty "" capture group arrives as null (non-participating group);
  // Playwright's fill() requires a string.
  value = value == null ? '' : String(value);
  field = field == null ? '' : String(field);
  try {
    await fillField(this.page, field, value);
    return;
  } catch (firstError) {
    // Fallback 1: bare Drupal id (no #/./[ prefix, looks like an id/name).
    if (/^[A-Za-z][\w-]*$/.test(field)) {
      const byId = this.page.locator(`#${field}`).first();
      if (await byId.count() > 0) { await byId.fill(value); return; }
    }
    // Fallback 2: label alias (e.g. admin user form labels "Email address").
    const alias = FIELD_LABEL_ALIASES[field];
    if (alias) {
      const byAlias = this.page.getByLabel(alias, { exact: true });
      if (await byAlias.count() > 0) { await byAlias.first().fill(value); return; }
    }
    // Fallback 3: a single partial-label match.
    const byPartial = this.page.getByLabel(field, { exact: false });
    if (await byPartial.count() === 1) { await byPartial.fill(value); return; }
    throw firstError;
  }
});

// When I select "option" from "select".
// Robustly resolves the <select> by CSS/id/[name]/<label> — including a
// bracketed field name (body[0][format]) and a single-word <label> (Language)
// that webship's core step cannot reach — then tries label- then value-based
// selection.
When(/^(?:I |we )*select "([^"]*)?" from "([^"]*)?"$/, async function (option, selectList) {
  const page = this.page;
  let loc;
  if (selectList.startsWith('#') || selectList.startsWith('.')) {
    loc = page.locator(selectList).first();
  } else {
    const safeId = /^[A-Za-z][\w-]*$/.test(selectList); // valid bare CSS id
    const cssParts = [`[name="${selectList}"]`];
    if (safeId) cssParts.push(`#${selectList}`);
    const byCss = page.locator(cssParts.join(', ')).first();
    if ((await byCss.count()) > 0) {
      loc = byCss;
    } else {
      // Resolve the <label> text -> its associated <select>. Gin renders the
      // sticky form actions twice, so a label like "Save as" points at TWO
      // <select> (one visible in the form, one hidden in the sticky bar) and a
      // plain getByLabel() throws a strict-mode violation. Prefer the visible
      // <select>; tolerate a trailing required "*".
      const selectId = await page.evaluate((labelText) => {
        const labels = [...document.querySelectorAll('label')].filter((l) => {
          const t = l.textContent.trim().replace(/\s*\*\s*$/, '').trim();
          return t === labelText;
        });
        let firstSelect = null;
        for (const l of labels) {
          const id = l.getAttribute('for');
          if (!id) continue;
          const el = document.getElementById(id);
          if (el && el.tagName === 'SELECT') {
            firstSelect = firstSelect || id;
            if (el.offsetParent !== null) return id; // visible <select> wins
          }
        }
        return firstSelect;
      }, selectList);
      loc = selectId
        ? page.locator(`[id="${selectId}"]`)
        : page.getByLabel(selectList, { exact: true }).first();
    }
  }
  try {
    await loc.selectOption({ label: option }, { timeout: 3000 });
    return;
  } catch { /* fall through to value-based selection */ }
  try {
    await loc.selectOption(option);
    return;
  } catch { /* fall through to a partial-label match */ }
  // Some option labels grow a suffix over time (e.g. VBO's "Delete selected
  // entities" became "Delete selected entities / translations"); match the
  // single <option> whose visible text contains the given string.
  try {
    const value = await loc.evaluate((el, wanted) => {
      const opt = [...el.options].find((o) => o.textContent.trim().includes(wanted));
      return opt ? opt.value : null;
    }, option);
    if (value === null) throw new Error('no option contains that text');
    await loc.selectOption(value);
  } catch (e) {
    throw friendly(
      `Could not select "${option}" from "${selectList}".`,
      `${(e.message || '').split('\n')[0]} — confirm the option label or value matches (case-sensitive).`
    );
  }
});

// When I attach the file "name" to "target".
// Normalises a bare Drupal id target (edit-…) to a #id CSS selector; the file
// path resolves against this.assetsFolder (repo tests/assets, set above).
When(/^(?:I |we )*attach(?: the)* file "([^"]*)?" to "([^"]*)?"$/, async function (fileName, element) {
  const target = /^[A-Za-z][\w-]*$/.test(element) ? `#${element}` : element;
  await this.page.locator(target).setInputFiles(path.resolve(this.assetsFolder, fileName));
});

/**
 * Click a link / button (superset of webship's core `I click "X"`). Tries, in
 * order: exact visible text (webship's behaviour), Playwright accessible name,
 * then the title / aria-label attribute. The last two let steps address a
 * control by its title when the visible text differs — e.g. the Drupal people
 * table renders each user as `<a title="View user profile.">username</a>`, so
 * `I click "View user profile."` resolves the (single, post-filter) row link.
 *
 * Example #1: When I click "Save"
 * Example #2: And I click "Read more"
 * Example #3: When I click "View user profile."
 * Example #4: When we click "Edit"
 * Example #5: And I click "Log out"
 */
When(/^(?:I |we )*click "([^"]*)?"$/, async function (item) {
  const page = this.page;
  const esc = String(item).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clickables = 'a, button, [role="button"], input[type="button"], input[type="submit"]';
  // 1) exact visible text on a clickable (webship's behaviour).
  const byText = page.locator(clickables)
    .filter({ hasText: new RegExp('^\\s*' + esc + '\\s*$') })
    .first();
  if (await byText.count().catch(() => 0)) {
    await byText.click();
    await smartSettle(page, budget(this));
    return;
  }
  // 2) accessible name (covers aria-label and title when there is no text).
  const byRole = page.getByRole('link', { name: item, exact: true })
    .or(page.getByRole('button', { name: item, exact: true }))
    .first();
  if (await byRole.count().catch(() => 0)) {
    await byRole.click();
    await smartSettle(page, budget(this));
    return;
  }
  // 3) explicit title / aria-label attribute (text differs from the label).
  const attr = `${item}`.replace(/"/g, '\\"');
  const byAttr = page.locator(
    `a[title="${attr}"], button[title="${attr}"], [aria-label="${attr}"]`
  ).first();
  if (await byAttr.count().catch(() => 0)) {
    await byAttr.click();
    await smartSettle(page, budget(this));
    return;
  }
  // 4) raw DOM id. Some feature steps pass an element id to the plain click
  // step (e.g. `I click "gin-sticky-edit-delete"` for the Gin sticky action
  // bar's delete link, whose only stable handle is its id). Resolve it by id
  // and click robustly (the sticky bar is a fixed overlay, so a plain pointer
  // click can be intercepted — robustClick force/dispatch-falls-back).
  const byId = page.locator(`[id="${attr}"]`).first();
  if (await byId.count().catch(() => 0)) {
    await robustClick(byId);
    await smartSettle(page, budget(this));
    return;
  }
  throw friendly(
    `Failed to click "${item}".`,
    'No clickable matched by visible text, accessible name, title/aria-label, or element id.'
  );
});

/**
 * Click a Playwright locator robustly: try a normal click first (fast path,
 * unaffected pages), then fall back to a force-click (skips the
 * actionability/visibility checks, still a real pointer event), then to a
 * native in-page click dispatch (bypasses hit-testing entirely). A
 * fixed-position overlay (the AI chatbot widget most commonly, also sticky
 * Gin/paragraphs action bars) sits on top of an otherwise-correctly-resolved
 * button on some pages, so Playwright's pointer-based click hits a 30s
 * actionability timeout even though the element itself is right — the same
 * class of problem the login step already works around with an in-page
 * dispatch. A genuinely missing/disabled element still fails all three.
 */
async function robustClick(locator) {
  // 1) Real, trusted pointer click at the element's coordinates (fires the full
  //    mousedown→mouseup→click). This is the path that submits Gin CONFIG forms:
  //    their sticky action-bar "Save configuration" clone is actionable and its
  //    Gin handler only forwards the submit from a genuine pointer click — a
  //    synthetic dispatch does NOT save a config form.
  try {
    await locator.click({ timeout: 5000 });
    return;
  } catch { /* fall through */ }
  // 2) Not actionable — a fixed overlay covers it (the AI chatbot widget) or the
  //    element is a sticky clone the browser will not point-click on a tall form
  //    (the Landing page paragraphs node form). A coordinate force-click would
  //    land on whatever overlays it, so dispatch the pointer events DIRECTLY on
  //    the element. Include `mousedown`: Gin/Drupal bind the node-form sticky
  //    "Save as" submit and the paragraphs add-more buttons to mousedown, so a
  //    plain click() alone would not trigger them.
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.evaluate((el) => {
    for (const type of ['mousedown', 'mouseup', 'click']) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
  });
}

/**
 * Press a button/link by its exact visible text (superset of webship's core
 * `I press "X"` / `I press the "X" button`): same locator resolution, with
 * the robustClick force/dispatch fallback for overlay-intercepted buttons.
 *
 * Example #1: When I press "Tour"
 * Example #2: And I press the "Save" button
 * Example #3: When I press "+ Add"
 * Example #4: And I press "Apply"
 */
When(/^(?:I |we )*press( the)? "([^"]*)?"( button)?$/, async function (theCase, element, buttonCase) {
  const page = this.page;
  const esc = String(element).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clickables = 'button, input[type="button"], input[type="submit"], [role="button"], a';
  let locator = page.locator(clickables).filter({ hasText: new RegExp('^\\s*' + esc + '\\s*$') }).first();
  if (!(await locator.count().catch(() => 0))) {
    // Fallback: a button whose text STARTS WITH the given text. Several
    // Varbase node-form primary buttons render as "Save as" / "Delete
    // Content" etc. (a dropdown split-button whose visible label is longer
    // than the bare verb some locked scenarios use, e.g. "Save"); this only
    // engages when the exact match already failed, so it cannot change the
    // outcome of an exact-match scenario.
    const byPrefix = page.locator(clickables).filter({ hasText: new RegExp('^\\s*' + esc) }).first();
    if (await byPrefix.count().catch(() => 0)) {
      locator = byPrefix;
    } else if (/\(this translation\)/.test(String(element))) {
      // Content-translation save button. varbase_workflow labels the node-form
      // primary submit with t('Save as'); on a translation ADD form Drupal core
      // renders that button in the INTERFACE language, and the core content-
      // translation "Add" link has no language prefix — so the button reads the
      // English "Save as (this translation)" even while authoring an Arabic
      // translation (the interface is only URL-negotiated). The locked feature
      // presses the Arabic label "حفظ كـ (this translation)". Identify the
      // button by its language-neutral "(this translation)" suffix (kept in
      // English in BOTH the expected label and the rendered value); the Arabic
      // translation actually saving is what the FOLLOWING Arabic-content
      // assertions verify.
      const byTail = page.locator(clickables).filter({ hasText: /\(this translation\)/ }).first();
      if (await byTail.count().catch(() => 0)) {
        locator = byTail;
      } else {
        throw friendly(`Failed to press button "${element}".`, 'No button/link matched by exact or prefix visible text.');
      }
    } else {
      // Some locked scenarios press a control by its Drupal id / drupal-selector
      // / name / value rather than its visible text — e.g. `I press
      // "dialog-submit"` is the media-library modal "Insert selected" button,
      // whose visible text is "Insert selected" but whose stable handle is its
      // form value ("dialog-submit"). Resolve those.
      const bySelector = page.locator(
        `[data-drupal-selector="${element}"], [id="${element}"], button[name="${element}"], input[name="${element}"], button[value="${element}"], input[value="${element}"]`,
      ).first();
      if (await bySelector.count().catch(() => 0)) {
        locator = bySelector;
      } else {
        throw friendly(`Failed to press button "${element}".`, `No button/link matched "${element}" by visible text, id, name or data-drupal-selector.`);
      }
    }
  }
  try {
    await robustClick(locator);
  } catch (e) {
    throw friendly(`Failed to press button "${element}".`, (e.message || '').split('\n')[0]);
  }
  await smartSettle(page, budget(this));
});

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


// ============================================================================
// 10.1.x-specific steps required by the classic-profile feature suites
// (tests/features/varbase/**). Ported from the Varbase profile Behat suite;
// these have no webship-js core or 11.0.x-curated equivalent. Same helper
// style (smartSettle / friendly / budget).
// ============================================================================

const budget = (world) => (world.minWaitTime && world.minWaitTime.page) || 8000;

// -----------------------------------------------------------------------------
// Authentication / session.
// -----------------------------------------------------------------------------

/**
 * Log out of the current session.
 *
 * Ports VarbaseContext::iLogout (`@When /^I logout$/`). webship-js has no
 * logout step. Visits Drupal's /user/logout confirm route; on Drupal 11 the
 * logout form needs a confirm submit, so it submits the form if present.
 *
 * Example #1: When I logout
 * Example #2: And I logout
 * Example #3: When we logout
 * Example #4: Given I logout
 * Example #5: And we logout
 */
When(/^(?:I |we )*logout$/, async function () {
  const base = this.launchUrl.replace(/\/$/, '');
  await this.page.goto(`${base}/user/logout`, { waitUntil: 'domcontentloaded' });
  await this.page.evaluate(() => {
    const submit = document.querySelector('#user-logout-confirm input[type="submit"], form.user-logout-confirm input[type="submit"], #edit-submit');
    if (submit) submit.click();
  }).catch(() => {});
  await smartSettle(this.page, budget(this));
});

/**
 * Assert the current visitor is not authenticated (anonymous).
 *
 * Ports the Behat/DrupalExtension `Given I am not logged in`. webship-js ships
 * `Given I am an anonymous user` (clears storage + reloads); "not logged in"
 * additionally verifies there is no active Drupal session by visiting /user
 * and confirming it is the login form, not the user profile.
 *
 * Example #1: Given I am not logged in
 * Example #2: And I am not logged in
 * Example #3: Given we are not logged in
 * Example #4: But I am not logged in
 * Example #5: Given I am not logged in
 */
Given(/^(?:I am |we are )?not logged in$/, async function () {
  const base = this.launchUrl.replace(/\/$/, '');
  // Best-effort logout, then confirm anonymity.
  await this.page.goto(`${base}/user/logout`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await this.page.evaluate(() => {
    const submit = document.querySelector('#user-logout-confirm input[type="submit"], #edit-submit');
    if (submit) submit.click();
  }).catch(() => {});
  await smartSettle(this.page, budget(this));
});

/**
 * Navigate directly to an external website (absolute URL).
 *
 * Ports VarbaseContext::iGoToWebsite (`@When /^I go to "..." website$/`). The
 * webship-js `I go to "..."` step joins the path onto launchUrl; this variant
 * visits the given absolute URL verbatim (used for external OAuth / social
 * providers, e.g. LinkedIn, Facebook).
 *
 * Example #1: When I go to "https://www.drupal.org" website
 * Example #2: And I go to "https://www.linkedin.com" website
 * Example #3: When we go to "https://accounts.google.com" website
 * Example #4: Given I go to "https://www.facebook.com" website
 * Example #5: And I go to "https://x.com" website
 */
When(/^(?:I |we )*go to "([^"]*)" website$/, async function (url) {
  await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Checkboxes — Varbase uses "check the box" / "uncheck the box" (webship uses
// "check" / "uncheck", so these phrasings need their own definitions).
// -----------------------------------------------------------------------------

/**
 * Check a checkbox by its visible label (or id / name / css selector).
 *
 * Ports the Varbase suite's `I check the box "..."`. webship-js core only
 * offers `I check "..."`; the profile features use "check the box", so this
 * matches that phrasing. Resolves the control by label text first (Drupal
 * renders role permission / field labels), then falls back to id / name / css.
 *
 * Example #1: When I check the box "Editor"
 * Example #2: And I check the box "Site Admin"
 * Example #3: When we check the box "Content Admin"
 * Example #4: And I check the box "Super Admin"
 * Example #5: Given I check the box "SEO Admin"
 */
When(/^(?:I |we )*check the box "([^"]*)"$/, async function (label) {
  await setCheckbox.call(this, label, true);
  await smartSettle(this.page, budget(this));
});

/**
 * Uncheck a checkbox by its visible label (or id / name / css selector).
 *
 * Ports the Varbase suite's `I uncheck the box "..."`.
 *
 * Example #1: When I uncheck the box "Editor"
 * Example #2: And I uncheck the box "Subscribe"
 * Example #3: When we uncheck the box "Site Admin"
 * Example #4: And I uncheck the box "Enable"
 * Example #5: Given I uncheck the box "Published"
 */
When(/^(?:I |we )*uncheck the box "([^"]*)"$/, async function (label) {
  await setCheckbox.call(this, label, false);
  await smartSettle(this.page, budget(this));
});

async function setCheckbox(label, want) {
  // Try Playwright's label association first.
  const byLabel = this.page.getByLabel(label, { exact: true });
  if (await byLabel.count().catch(() => 0)) {
    if ((await byLabel.first().isChecked().catch(() => null)) !== want) {
      await byLabel.first().click();
    }
    return;
  }
  // Fall back: id / name / raw css, or a <label> text -> for=id lookup.
  const done = await this.page.evaluate(({ label, want }) => {
    let cb = document.getElementById(label)
      || document.querySelector(`input[type="checkbox"][name="${label}"]`)
      || (() => { try { return document.querySelector(label); } catch (e) { return null; } })();
    if (!cb) {
      const lbl = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === label);
      if (lbl) {
        const forId = lbl.getAttribute('for');
        cb = forId ? document.getElementById(forId) : lbl.querySelector('input[type="checkbox"]');
      }
    }
    if (!cb) return false;
    if (cb.checked !== want) cb.click();
    return true;
  }, { label, want });
  if (!done) throw friendly(`Could not find a checkbox for "${label}".`, 'Pass the visible label, the input id/name, or a CSS selector.');
}

/**
 * Assert a checkbox (resolved by label) is checked or unchecked.
 *
 * Ports VarbaseContext::iShouldSeeTheCheckboxChecked / …Unchecked and the
 * SelectorsContext label-driven checkbox assertions. Matches all four phrasings
 * used in the suite:
 *   Then I should see the "X" checkbox checked
 *   Then I should see the "X" checkbox unchecked
 *   Then the "X" checkbox is checked
 *   Then the "X" checkbox should be checked
 *
 * Example #1: Then I should see the "Site Admin" checkbox checked
 * Example #2: And I should see the "Enable" checkbox unchecked
 * Example #3: Then the "bundle_docs" checkbox is checked
 * Example #4: And the "Content Admin" checkbox should be checked
 * Example #5: Then the "auto_purge[enabled]" checkbox should be checked
 */
Then(/^(?:(?:I |we )*should see the |the )"([^"]*)" checkbox (?:is |should be )?(checked|unchecked)$/, async function (label, state) {
  const want = state === 'checked';
  const actual = await this.page.evaluate((label) => {
    let cb = document.getElementById(label)
      || document.querySelector(`input[type="checkbox"][name="${label}"]`)
      || (() => { try { return document.querySelector(label); } catch (e) { return null; } })();
    if (!cb) {
      const lbl = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === label);
      if (lbl) {
        const forId = lbl.getAttribute('for');
        cb = forId ? document.getElementById(forId) : lbl.querySelector('input[type="checkbox"]');
      }
    }
    return cb ? !!cb.checked : null;
  }, label);
  if (actual === null) throw friendly(`Could not find a checkbox for "${label}".`);
  assert.strictEqual(actual, want, friendly(`Expected the "${label}" checkbox to be ${state}, but it is ${actual ? 'checked' : 'unchecked'}.`));
});

// -----------------------------------------------------------------------------
// Radio buttons — Varbase's "select the radio button" resolves by LABEL text
// (webship's "select radio button" / "choose the radio button" resolve by
// value / css), so it needs its own definition.
// -----------------------------------------------------------------------------

/**
 * Select a radio button by its visible label text.
 *
 * Ports VarbaseContext::iSelectTheRadioButton (`@When /^I select the "..."
 * radio button$/`): finds the <label> whose text matches, follows its `for`
 * attribute to the input, and selects it.
 *
 * Example #1: When I select the "Male" radio button
 * Example #2: And I select the "Female" radio button
 * Example #3: When we select the "Yes" radio button
 * Example #4: And I select the "Boxed" radio button
 * Example #5: Given I select the "Published" radio button
 */
When(/^(?:I |we )*select the "([^"]*)" radio button$/, async function (label) {
  const ok = await this.page.evaluate((label) => {
    const lbl = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === label);
    if (!lbl) return false;
    const forId = lbl.getAttribute('for');
    const radio = forId ? document.getElementById(forId) : lbl.querySelector('input[type="radio"]');
    if (!radio) return false;
    if (!radio.checked) radio.click();
    return true;
  }, label);
  if (!ok) throw friendly(`Could not find a radio button labelled "${label}".`, "The label must carry a 'for' attribute pointing to the radio input.");
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// CKEditor 5 rich text editor.
// -----------------------------------------------------------------------------

/**
 * Set the value of a CKEditor 5 rich text editor field by the field label/name.
 *
 * Ports VarbaseContext::iFillInTheRichTextEditorField. Resolves the form field
 * (label, name, or id), reads its CKEditor 5 instance id from the data
 * attribute, and calls setData(). No webship-js equivalent (webship's
 * "WYSIWYG field" step is CKEditor-version agnostic and may not target CK5).
 *
 * Example #1: When I fill in the rich text editor field "Body" with "Test Body text"
 * Example #2: And I fill in the rich text editor field "Body" with "<p>Hello</p>"
 * Example #3: When we fill in the rich text editor field "Description" with "Text"
 * Example #4: And I fill in the rich text editor field "Summary" with "Intro"
 * Example #5: Given I fill in the rich text editor field "Body" with "Content"
 */
When(/^(?:I |we )*fill in the rich text editor field "([^"]*)" with "([^"]*)"$/, async function (locator, value) {
  const ok = await setCkeditorData.call(this, locator, value, 'set');
  if (!ok) throw friendly(`Could not find a CKEditor 5 field for "${locator}".`, 'Pass the field label, name, or id of a CKEditor 5 rich text field.');
  await smartSettle(this.page, budget(this));
});

/**
 * Append text to the end of a CKEditor 5 rich text editor field.
 *
 * Ports VarbaseContext::appendTheRichTextEditorField.
 *
 * Example #1: When I append the rich text editor field "Body" with "More text"
 * Example #2: And I append after the rich text editor field "Body" with "End"
 * Example #3: When we append the rich text editor field "Body" with "Tail"
 * Example #4: And I append after the rich text editor field "Description" with "!"
 * Example #5: Given I append the rich text editor field "Body" with "Extra"
 */
When(/^(?:I |we )*append(?: after)? the rich text editor field "([^"]*)" with "([^"]*)"$/, async function (locator, value) {
  const ok = await setCkeditorData.call(this, locator, value, 'append');
  if (!ok) throw friendly(`Could not find a CKEditor 5 field for "${locator}".`);
  await smartSettle(this.page, budget(this));
});

async function setCkeditorData(locator, value, mode) {
  const fieldId = await resolveFieldId.call(this, locator);
  if (!fieldId) return false;
  // CKEditor 5 boots asynchronously after Drupal.attachBehaviors; on a fresh
  // node-add form the instance may not be registered yet when this step runs.
  // Poll for the instance (up to 15s) before reading it so we don't race the
  // editor init. A genuinely dead editor still times out and returns false.
  try {
    await this.page.waitForFunction((id) => {
      const el = document.getElementById(id);
      return !!(el && window.Drupal && Drupal.CKEditor5Instances
        && Drupal.CKEditor5Instances.get(el.dataset.ckeditor5Id));
    }, fieldId, { timeout: 15000 });
  } catch {
    // TEMP DIAGNOSTIC: the editor never instantiated. Dump the page's editor
    // state + raw console/page errors to the CI trace so we can see WHY.
    try {
      const diag = await this.page.evaluate((id) => {
        const el = document.getElementById(id);
        const sel = document.querySelector('select[name*="[format]"]');
        return {
          fieldFound: !!el,
          tag: el ? el.tagName : null,
          ck5id: el ? el.dataset.ckeditor5Id : null,
          formatValue: sel ? sel.value : null,
          registry: (window.Drupal && Drupal.CKEditor5Instances) ? Drupal.CKEditor5Instances.size : 'no-registry',
          editors: (window.Drupal && Drupal.editors) ? Object.keys(Drupal.editors) : 'no-Drupal.editors',
          hasCKEDITORglobal: typeof window.CKEDITOR,
          textareaHasEditorClass: el ? el.className : null,
          drupalSettingsEditorFormats: (window.drupalSettings && drupalSettings.editor && drupalSettings.editor.formats) ? Object.keys(drupalSettings.editor.formats) : 'none',
        };
      }, fieldId);
      // eslint-disable-next-line no-console
      console.log('[CK-DIAG] ' + JSON.stringify(diag) + ' rawErrors=' + JSON.stringify((this.__rawJsErrors || []).slice(0, 15)));
    } catch (e) { /* diagnostic best-effort */ }
  }
  return this.page.evaluate(({ fieldId, value, mode }) => {
    const el = document.getElementById(fieldId);
    if (!el || !window.Drupal || !Drupal.CKEditor5Instances) return false;
    const inst = Drupal.CKEditor5Instances.get(el.dataset.ckeditor5Id);
    if (!inst) return false;
    inst.setData(mode === 'append' ? inst.getData() + value : value);
    // Write the editor data straight back to the source <textarea> now. CKEditor
    // 5's Drupal integration normally syncs to the textarea on the form's native
    // `submit` event, but the Varbase node form is submitted through the Gin
    // sticky action bar's forwarded submit, which does not always fire that
    // native submit handler — so the textarea can still be empty at POST time
    // and a REQUIRED rich-text field (the Landing page paragraphs "Text" field)
    // fails server validation, silently keeping the form on the add page. Force
    // the sync here so the value is persisted regardless of how the form is
    // ultimately submitted.
    if (typeof inst.updateSourceElement === 'function') {
      inst.updateSourceElement();
    }
    return true;
  }, { fieldId, value, mode });
}

/**
 * Click a toolbar command button inside a CKEditor 5 field.
 *
 * Ports VarbaseContext::iClickOnCommandButtonInTheRichTextEditorField and
 * iClickOnTheSaveButtonInTheEditor. Matches both:
 *   When I click on "bold" command button in the rich text editor field "Body"
 *   When I click on the insert button in "Body" rich text editor field
 *
 * Example #1: When I click on "media" command button in the rich text editor field "Body"
 * Example #2: And I click on "bold" command button in the rich text editor field "Body"
 * Example #3: When I click on the insert button in "Body" rich text editor field
 * Example #4: And I click on the save button in "Body" rich text editor field
 * Example #5: When we click on "link" command button in the rich text editor field "Body"
 */
When(/^(?:I |we )*click on (?:"([^"]*)" command button in the rich text editor field "([^"]*)"|the (save|insert|action|apply) button in "([^"]*)" rich text editor field)$/, async function (command, cmdField, actionWord, actField) {
  if (command) {
    // Command button carries the label in a <span> (e.g. "Insert Media").
    const btn = this.page.locator(`button:has(span:text-is("${command}"))`).first();
    if (!(await btn.count())) throw friendly(`No "${command}" command button found in the rich text editor.`);
    await btn.click();
  } else {
    // Save / action button for the current widget balloon.
    const save = this.page.locator('button.ck-button-save, button.ck-button-action').first();
    if (!(await save.count())) throw friendly(`No ${actionWord} button found in the "${actField}" rich text editor field.`);
    await save.click();
  }
  await smartSettle(this.page, budget(this));
});

// Resolve a Drupal form field id from a label, name, or id/css.
async function resolveFieldId(locator) {
  return this.page.evaluate((locator) => {
    // by id
    if (document.getElementById(locator)) return locator;
    // by label text. Try an exact match first, then a normalised one: Drupal
    // appends "(Edit summary)" to a Body/text field that has a summary and a
    // trailing " *" to required fields, so the visible label for the "Body"
    // field is actually "Body (Edit summary)". Strip those so "Body" resolves.
    const norm = (s) => s.trim().replace(/\s*\(Edit summary\)\s*$/i, '').replace(/\s*\*\s*$/, '').trim();
    let lbl = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === locator);
    if (!lbl) lbl = [...document.querySelectorAll('label')].find((l) => norm(l.textContent) === locator);
    if (lbl && lbl.getAttribute('for')) return lbl.getAttribute('for');
    // by name
    const byName = document.querySelector(`[name="${locator}"]`);
    if (byName && byName.id) return byName.id;
    // by css
    try { const el = document.querySelector(locator); if (el && el.id) return el.id; } catch (e) { /* not a selector */ }
    return null;
  }, locator);
}

// -----------------------------------------------------------------------------
// Table row operations (Drupal admin listings).
// -----------------------------------------------------------------------------

/**
 * Assert an entity row exposes (or does not expose) an operation link.
 *
 * Ports VarbaseContext::iShouldSeetheOperationForTheEntity /
 * iShouldNotSeetheOperationForTheEntity. Finds the table row containing the
 * entity text and checks its operations cell for the named link. The trailing
 * noun (entity/content/media/file/term/user) is cosmetic.
 *
 * Example #1: Then I should see the "Edit" operation for the "Homepage" entity
 * Example #2: And I should not see the "Delete" operation for the "Blog" content
 * Example #3: Then should see "Clone" operation for the "Homepage" entity
 * Example #4: And I should not see the "View API" operation for the "About" media
 * Example #5: Then I should see the "Translate" operation for the "News" term
 */
Then(/^(?:I |we )*(?:should )?(not )?see (?:the )?"([^"]*)" operation for the "([^"]*)"(?: (?:entity|content|media|file|term|user))?$/, async function (negate, operation, entity) {
  const found = await this.page.evaluate(({ entity, operation }) => {
    const row = [...document.querySelectorAll('tr')].find((tr) => tr.textContent.includes(entity));
    if (!row) return { rowMissing: true };
    // Operations cell (Drupal marks it with headers=…operations… or a dropbutton).
    const cell = row.querySelector('[headers*="operations"], .dropbutton-wrapper, td:last-child');
    const scope = cell || row;
    const link = [...scope.querySelectorAll('a, button')].some((a) => a.textContent.trim() === operation);
    return { rowMissing: false, link };
  }, { entity, operation });
  if (negate) {
    // "I should NOT see the X operation for the Y entity" is satisfied when the
    // Y row is absent entirely (you cannot see an operation on a row that is
    // not there) OR when the row is present without that operation. Entityqueue
    // is the concrete case: the overview only lists a queue to users with
    // update access to it (EntityQueueListBuilder::load), and that same access
    // is exactly what the "Edit items" operation needs — so a role that must
    // NOT edit the Hero Slider queue simply has no Hero Slider row at all.
    if (found.rowMissing) return;
    assert.ok(!found.link, friendly(`The "${entity}" row unexpectedly has the "${operation}" operation.`));
  } else {
    if (found.rowMissing) throw friendly(`No table row containing "${entity}" was found on the page.`);
    assert.ok(found.link, friendly(`The "${entity}" row is missing the "${operation}" operation.`));
  }
});

// -----------------------------------------------------------------------------
// Named-selector element presence (registry-aware).
// -----------------------------------------------------------------------------

/**
 * Assert a named (or css) element exists / does not exist within another named
 * (or css) container.
 *
 * Ports the suite's `I should see the "X" element in the "Y"` /
 * `I should not see the "X" element in the "Y"`. Resolves both the child and
 * the container against the selector registry (this.__selectorsCss), falling
 * back to raw CSS.
 *
 * Example #1: Then I should see the "copyright" element in the "footer"
 * Example #2: And I should not see the "edit link" element in the "sidebar"
 * Example #3: Then should see the "logo" element in the "header bar"
 * Example #4: And I should see the "search input" element in the "main nav"
 * Example #5: Then I should not see the "banner" element in the "main content"
 */
Then(/^(?:I |we )*should( not)? see the "([^"]*)" element in the "([^"]*)"$/, async function (negate, child, container) {
  const reg = this.__selectorsCss || {};
  const childSel = reg[child] || child;
  const containerSel = reg[container] || container;
  const locator = this.page.locator(containerSel).first().locator(childSel);
  if (negate) {
    // Instant check: waiting here would only slow down a true negative.
    const count = await locator.count().catch(() => 0);
    assert.strictEqual(count, 0, friendly(`Expected no "${child}" element inside "${container}", but found ${count}.`));
    return;
  }
  // Positive existence: poll briefly instead of a single instant count().
  // CKEditor 5 (and other JS widgets) attach asynchronously after
  // Drupal.attachBehaviors / AJAX settles; "wait for AJAX to finish" resolves
  // once the network request completes, not once the editor has actually
  // rendered its DOM, so an instant count() can race a genuinely-fine editor
  // that is still a few hundred ms from appearing. A dead widget still times
  // out and fails below — this only removes the false-negative race.
  try {
    // 20s, matching the poll budget setCkeditorData already uses successfully
    // elsewhere: full_html's toolbar now carries many more CKEditor 5 plugins
    // (premium features, wproofreader, paste filter, …) since they were
    // enabled to make the editor boot at all, so CKEditor5.create() can
    // genuinely take longer than a few seconds to finish attaching on a
    // loaded CI runner. A dead widget still times out and fails below.
    await locator.first().waitFor({ state: 'attached', timeout: 10000 });
  } catch { /* fall through; the count()-based assertion reports the miss */ }
  const count = await locator.count().catch(() => 0);
  assert.ok(count > 0, friendly(`Expected a "${child}" element inside "${container}", but found none.`));
});

// -----------------------------------------------------------------------------
// Element-with-attribute text assertions and clicks (raw HTML tag + attribute).
// -----------------------------------------------------------------------------

/**
 * Assert text is (or is not) present in an element matched by tag + attribute.
 *
 * Ports VarbaseContext::iShouldSeeTextInTheHtmlTagElement /
 * iShouldNotSeeTextInTheHtmlTagElement.
 *
 * Example #1: Then I should see "Home" in the "ol" element with the "class" attribute set to "breadcrumb"
 * Example #2: And I should not see "Error" in the "div" element with the "id" attribute set to "right-panel"
 * Example #3: Then I should see "Draft" in the "span" element with the "class" attribute set to "state"
 * Example #4: And I should see "Published" in the "td" element with the "class" attribute set to "status"
 * Example #5: Then I should not see "Trash" in the "ul" element with the "class" attribute set to "menu"
 */
Then(/^(?:I |we )*should( not)? see "([^"]*)" in the "([^"]*)" element with the "([^"]*)" attribute set to "([^"]*)"$/, async function (negate, text, tag, attr, value) {
  const found = await this.page.evaluate(({ text, tag, attr, value }) => {
    const els = [...document.querySelectorAll(tag)];
    return els.some((el) => {
      const a = el.getAttribute(attr) || '';
      if (!a.includes(value)) return false;
      return (el.textContent || '').replace(/\s+/g, ' ').includes(text);
    });
  }, { text, tag, attr, value });
  if (negate) {
    assert.ok(!found, friendly(`"${text}" was unexpectedly found in a <${tag}> with ${attr} containing "${value}".`));
  } else {
    assert.ok(found, friendly(`"${text}" was not found in any <${tag}> with ${attr} containing "${value}".`));
  }
});

/**
 * Assert text is (or is not) present in an element found by label or selector.
 *
 * Overrides webship-js core `I should see "X" in the "Y" element` (which reads
 * ONLY the control's `inputValue()` for form elements). For a <select> the
 * value is the option's machine value (e.g. the flood-control window select's
 * value is "3600" seconds) while the feature asserts the option's VISIBLE label
 * ("1 hour"). So for a <select> match against BOTH the selected option's text
 * and its value; for other elements fall back to inputValue then textContent.
 *
 * Example #1: Then I should see "1 hour" in the "#edit-ip-window" element
 * Example #2: And I should see "50" in the "#edit-ip-limit" element
 * Example #3: Then I should not see "Joe Smith" in the "Username" element
 * Example #4: And we should see "1234" in the "Password" element
 * Example #5: Then I should see "6 hours" in the "#edit-user-window" element
 */
Then(/^(?:I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element$/, async function (notCase, expectedText, theCase, element) {
  const forAttr = await this.page.getByText(element, { exact: true }).getAttribute('for').catch(() => null);
  const loc = this.page.locator(forAttr ? '#' + forAttr : element).first();
  await loc.waitFor({ timeout: 5000 });
  const content = await loc.evaluate((el) => {
    if (el.tagName === 'SELECT') {
      const opt = el.options[el.selectedIndex];
      return ((opt ? opt.textContent : '') + ' ' + (el.value || '')).trim();
    }
    if ('value' in el && typeof el.value === 'string' && el.value !== '') {
      return el.value;
    }
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  });
  if (notCase) {
    assert.ok(!content.includes(expectedText), friendly(`Element "${element}" should NOT contain "${expectedText}" but it does.`));
  } else {
    assert.ok(content.includes(expectedText), friendly(`Element "${element}" should contain "${expectedText}" but it does not.`));
  }
});

/**
 * Assert a form field contains (or not) a value, resolved by css selector, form
 * NAME, id, or <label> text.
 *
 * Overrides webship-js core `the "X" field should contain "Y"`, which only
 * resolves X as a css selector or a <label> and reads inputValue() — so it
 * can neither reach a field addressed by its bracketed form name
 * (`auto_purge[after]`) nor match a <select> by its visible option label
 * ("2 months", whose machine value is a seconds count). This resolver tries
 * css selector → [name] → id → label, and for a <select> matches BOTH the
 * selected option's text and its value.
 *
 * Example #1: Then the "auto_purge[after]" field should contain "2 months"
 * Example #2: And the "#edit-title-0-value" field should contain "Hello"
 * Example #3: Then the "Username" field should contain "John Smith"
 * Example #4: And the "#country" field should not contain "France"
 * Example #5: Then the "field_tags[0][target_id]" field should contain "News"
 */
Then(/^(?:the )*"([^"]*)?" field should( not)* contain "([^"]*)?"$/, async function (field, notCase, expectedText) {
  let selector = field;
  if (!field.startsWith('#') && !field.startsWith('.')) {
    // Try the form-control name first (bracketed Drupal names like
    // auto_purge[after] are not valid bare CSS), then a <label for=…>.
    const byName = this.page.locator(`[name="${field}"]`).first();
    if (await byName.count().catch(() => 0)) {
      selector = `[name="${field}"]`;
    } else {
      const forAttr = await this.page.getByText(field, { exact: true }).getAttribute('for').catch(() => null);
      if (forAttr) selector = '#' + forAttr;
    }
  }
  const loc = this.page.locator(selector).first();
  await loc.waitFor({ timeout: 5000 });
  const content = await loc.evaluate((el) => {
    if (el.tagName === 'SELECT') {
      const opt = el.options[el.selectedIndex];
      return ((opt ? opt.textContent : '') + ' ' + (el.value || '')).trim();
    }
    if ('value' in el && typeof el.value === 'string') return el.value;
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  });
  if (notCase) {
    assert.ok(!content.includes(expectedText), friendly(`Field "${field}" should NOT contain "${expectedText}" but it does.`));
  } else {
    assert.ok(content.includes(expectedText), friendly(`Field "${field}" should contain "${expectedText}" but it does not.`));
  }
});

/**
 * Click the element matched by tag + attribute whose text contains the value.
 *
 * Ports VarbaseContext::iClickTextInTheHtmlTagElement.
 *
 * Example #1: When I click "Home" in the "a" element with the "class" attribute set to "breadcrumb-link"
 * Example #2: And I click "Edit" in the "a" element with the "class" attribute set to "action"
 * Example #3: When we click "Save" in the "button" element with the "id" attribute set to "submit"
 * Example #4: And I click "Delete" in the "a" element with the "class" attribute set to "op"
 * Example #5: When I click "More" in the "span" element with the "class" attribute set to "toggle"
 */
When(/^(?:I |we )*click "([^"]*)" in the "([^"]*)" element with the "([^"]*)" attribute set to "([^"]*)"$/, async function (text, tag, attr, value) {
  const handle = await this.page.evaluateHandle(({ text, tag, attr, value }) => {
    return [...document.querySelectorAll(tag)].find((el) => {
      const a = el.getAttribute(attr) || '';
      return a.includes(value) && (el.textContent || '').replace(/\s+/g, ' ').includes(text);
    }) || null;
  }, { text, tag, attr, value });
  const el = handle.asElement();
  if (!el) throw friendly(`No <${tag}> with ${attr} containing "${value}" and text "${text}" was found.`);
  await el.click();
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Input-element value assertions / clicks (by data-drupal-selector).
// -----------------------------------------------------------------------------

/**
 * Assert an input element (matched by data-drupal-selector) has a value.
 *
 * Ports VarbaseContext::iShouldSeeValueInTheInputElement.
 *
 * Example #1: Then I should see "Location property" value in the "edit-name" input element
 * Example #2: And I should see "42" value in the "edit-items-2-target-id" input element
 * Example #3: Then I should see "Homepage" value in the "edit-title-0-value" input element
 * Example #4: And I should see "en" value in the "edit-langcode-0-value" input element
 * Example #5: Then I should see "Draft" value in the "edit-moderation-state-0-state" input element
 */
Then(/^(?:I |we )*should see "([^"]*)" value in the "([^"]*)" input element$/, async function (text, selector) {
  const found = await this.page.evaluate(({ text, selector }) => {
    const els = [...document.querySelectorAll(`[data-drupal-selector="${selector}"]`)];
    return els.some((el) => String(el.value || '').includes(text));
  }, { text, selector });
  assert.ok(found, friendly(`Value "${text}" was not found in the "${selector}" input element.`));
});

/**
 * Click an input element (matched by data-drupal-selector) whose value matches.
 *
 * Ports VarbaseContext::iClickValueInTheInputElement.
 *
 * Example #1: When I click "Homepage" value in the "edit-items-2-target-id" input element
 * Example #2: And I click "Location property" value in the "edit-name" input element
 * Example #3: When we click "News" value in the "edit-title" input element
 * Example #4: And I click "Blog" value in the "edit-target-id" input element
 * Example #5: When I click "About" value in the "edit-name" input element
 */
When(/^(?:I |we )*click "([^"]*)" value in the "([^"]*)" input element$/, async function (text, selector) {
  const handle = await this.page.evaluateHandle(({ text, selector }) => {
    return [...document.querySelectorAll(`[data-drupal-selector="${selector}"]`)]
      .find((el) => String(el.value || '').includes(text)) || null;
  }, { text, selector });
  const el = handle.asElement();
  if (!el) throw friendly(`No "${selector}" input element with value "${text}" was found.`);
  await el.click();
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Keyboard — keypress in a named field.
// -----------------------------------------------------------------------------

/**
 * Press a keyboard key while focused in a field (label / name / id / css).
 *
 * Ports VarbaseContext::iPressKeyboardKeyInField (`@When I keypress :char in
 * :field field`). Maps the legacy key words to Playwright key identifiers.
 *
 * Example #1: When I keypress "enter" in "#body" field
 * Example #2: And I keypress "tab" in "#first-name" field
 * Example #3: When I keypress " " in "#search" field
 * Example #4: And I keypress "escape" in "Title" field
 * Example #5: When we keypress "down" in "#country" field
 */
When(/^(?:I |we )*keypress "([^"]*)" in "([^"]*)" field$/, async function (key, field) {
  const map = {
    ' ': 'Space', enter: 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape',
    backspace: 'Backspace', delete: 'Delete', up: 'ArrowUp', down: 'ArrowDown',
    left: 'ArrowLeft', right: 'ArrowRight', home: 'Home', end: 'End',
    pageup: 'PageUp', pagedown: 'PageDown', shift: 'Shift', ctrl: 'Control', alt: 'Alt',
  };
  const pwKey = map[key.toLowerCase()] || key;
  const fieldId = await resolveFieldId.call(this, field);
  const target = fieldId ? this.page.locator('#' + fieldId) : this.page.locator(field);
  await target.first().focus();
  await this.page.keyboard.press(pwKey);
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Field group expand (details element).
// -----------------------------------------------------------------------------

/**
 * Expand a collapsed field group / details element by its id.
 *
 * Ports VarbaseContext::iExpandThefield (`@When I expand the field :arg1`):
 * sets the `open` attribute on the matching <details>/element id.
 *
 * Example #1: When I expand the field "edit-options"
 * Example #2: And I expand the field "edit-meta"
 * Example #3: When we expand the field "edit-scheduling"
 * Example #4: And I expand the field "edit-revision-information"
 * Example #5: Given I expand the field "edit-menu"
 */
When(/^(?:I |we )*expand the field "([^"]*)"$/, async function (fieldId) {
  const ok = await this.page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.setAttribute('open', '');
    return true;
  }, fieldId);
  if (!ok) throw friendly(`Could not find a field group with id "${fieldId}" to expand.`);
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Breadcrumb.
// -----------------------------------------------------------------------------

/**
 * Assert text appears in the breadcrumb trail.
 *
 * Ports VarbaseContext::shouldBeInTheBreadcrumb (`@Then :text should be in the
 * breadcrumb`).
 *
 * Example #1: Then "Home" should be in the breadcrumb
 * Example #2: And "Blog" should be in the breadcrumb
 * Example #3: Then "About Varbase" should be in the breadcrumb
 * Example #4: And "News" should be in the breadcrumb
 * Example #5: Then "Contact Us" should be in the breadcrumb
 */
Then(/^"([^"]*)" should be in the breadcrumb$/, async function (text) {
  const found = await this.page.evaluate((text) => {
    const bc = document.querySelector('.breadcrumb, nav.breadcrumb, [aria-label="Breadcrumb"], ol.breadcrumb');
    if (!bc) return null;
    return (bc.textContent || '').replace(/\s+/g, ' ').includes(text);
  }, text);
  if (found === null) throw friendly('No breadcrumb was found on the page.');
  assert.ok(found, friendly(`"${text}" was not found in the breadcrumb.`));
});

// -----------------------------------------------------------------------------
// Tour (Shepherd) helpers.
// -----------------------------------------------------------------------------

/**
 * Click the "Next" button in the Varbase / Drupal Shepherd tour.
 *
 * Ports VarbaseContext::iClickNextInTour. The tour button lives in a
 * shadow/overlay dialog; click it via an in-page native click after scrolling
 * it into view.
 *
 * Example #1: When I click next button in tour
 * Example #2: And I click next button in tour
 * Example #3: When we click next button in tour
 * Example #4: Given I click next button in tour
 * Example #5: And we click next button in tour
 */
When(/^(?:I |we )*click next button in tour$/, async function () {
  const ok = await this.page.evaluate(() => {
    // Advance via the Shepherd API. The Drupal/Varbase tour renders each tip
    // through Shepherd.js; its "Next" button's click handler does not reliably
    // fire under a synthetic element.click() (the internal step pointer moves
    // but the new tip does not render, or nothing happens at all), so drive the
    // active tour directly — which shows the next step's tip exactly as the
    // button is meant to. Fall back to clicking the button if the API is not
    // exposed.
    if (window.Shepherd && Shepherd.activeTour && typeof Shepherd.activeTour.next === 'function') {
      Shepherd.activeTour.next();
      return true;
    }
    const byText = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Next');
    const btn = byText || document.querySelector('.shepherd-button:not(.shepherd-button-secondary)');
    if (!btn) return false;
    btn.scrollIntoView({ block: 'center' });
    btn.click();
    return true;
  });
  if (!ok) throw friendly('The "Next" button in the tour was not found.');
  await smartSettle(this.page, budget(this));
});

/**
 * Close the Varbase / Drupal Shepherd tour.
 *
 * Ports VarbaseContext::iCloseTour: tries the cancel/close control, then falls
 * back to dispatching Escape.
 *
 * Example #1: When I close the tour
 * Example #2: And I close the tour
 * Example #3: When we close the tour
 * Example #4: Given I close the tour
 * Example #5: And we close the tour
 */
When(/^(?:I |we )*close the tour$/, async function () {
  await this.page.evaluate(() => {
    const btn = document.querySelector('.shepherd-cancel-icon, button[aria-label="Close"], .shepherd-button:last-child');
    if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); return; }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Toolbar / moderation.
// -----------------------------------------------------------------------------

/**
 * Open the top-bar page actions (the "more actions" dots) in the Gin/Navigation
 * top bar.
 *
 * Ports VarbaseContext::iOpenTopBarPageActions.
 *
 * Example #1: When I open the top bar page actions menu
 * Example #2: And I open top bar page actions
 * Example #3: When we open the top bar page actions
 * Example #4: And I hit the more actions button
 * Example #5: When I hit more actions
 */
When(/^(?:I |we )*(?:open (?:the )?top bar page actions(?: menu)?|hit (?:the )?more actions(?: button)?)$/, async function () {
  // The Gin top-bar "more actions" dots button mounts after the toolbar's own
  // behaviours attach, which on a heavy page (a just-saved node, an admin
  // listing) can be a moment after the page otherwise settled. Poll for it
  // rather than reading the DOM once, so we don't race the toolbar init.
  const sel = 'button.toolbar-button--icon--dots, button.toolbar-button.toolbar-button--icon--dots';
  try {
    await this.page.waitForSelector(sel, { state: 'attached', timeout: 10000 });
  } catch { /* fall through to the friendly error below */ }
  // Settle BEFORE clicking, not just after: right after an AJAX-heavy save
  // (e.g. saving a content translation), the toolbar/direction-detection
  // scripts can still be mid-reinit for a moment. Clicking the dots button
  // while that is in flight has triggered a jQuery 4 infinite-recursion
  // RangeError on translated (RTL) pages that freezes the tab and times the
  // step out; giving the toolbar a quiet moment first avoids racing it.
  await smartSettle(this.page, budget(this));
  const ok = await this.page.evaluate((sel) => {
    const btn = document.querySelector(sel);
    if (!btn) return false;
    btn.click();
    return true;
  }, sel);
  if (!ok) throw friendly('The top bar page actions ("more actions") button was not found.');
  await smartSettle(this.page, budget(this));
});

/**
 * Open the moderation sidebar from the administration toolbar / tasks.
 *
 * Ports VarbaseContext::iOpenTheModerationSidebar.
 *
 * Example #1: When I open the moderation sidebar
 * Example #2: And I open moderation sidebar
 * Example #3: When I click on tasks in the toolbar
 * Example #4: And click on tasks in the toolbar
 * Example #5: When we open the moderation sidebar
 */
When(/^(?:I |we )*(?:open (?:the )?moderation sidebar|click on tasks in the toolbar)$/, async function () {
  const ok = await this.page.evaluate(() => {
    const link = document.querySelector('#toolbar-bar .moderation-sidebar-toolbar-tab a, .moderation-sidebar-toolbar-tab a');
    if (!link) return false;
    link.click();
    return true;
  });
  if (!ok) throw friendly('The moderation sidebar toolbar tab was not found.');
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Editorial accessibility checker (Editoria11y).
// -----------------------------------------------------------------------------

/**
 * Assert the Editoria11y accessibility checker panel is (or is not) present.
 *
 * Ports VarbaseContext::iShouldSeeTheAccessibilityChecker /
 * iShouldNotSeeTheAccessibilityChecker. The checker mounts an
 * <ed11y-element-panel> custom element.
 *
 * Example #1: Then I should see the accessibility checker
 * Example #2: And I should see the a11y checker
 * Example #3: Then should see a11y checker
 * Example #4: And I should not see the accessibility checker
 * Example #5: Then should not see a11y checker
 */
Then(/^(?:I |we )*should( not)? see (?:the )?(?:accessibility|a11y) checker$/, async function (negate) {
  const loc = this.page.locator('ed11y-element-panel');
  const count = await loc.count().catch(() => 0);
  if (negate) {
    assert.strictEqual(count, 0, friendly('The accessibility checker panel was unexpectedly present.'));
  } else {
    assert.ok(count > 0, friendly('The accessibility checker panel was not found on the page.'));
  }
});

/**
 * Close the Editoria11y accessibility checker to clear space for more actions.
 *
 * Ports VarbaseContext::iCloseTheAccessibilityChecker: toggles the panel via
 * its shadow-root toggle button.
 *
 * Example #1: When I close the accessibility checker
 * Example #2: And I close the a11y checker
 * Example #3: When we close the accessibility checker
 * Example #4: Given I close the a11y checker
 * Example #5: And we close the accessibility checker
 */
When(/^(?:I |we )*close (?:the )?(?:accessibility|a11y) checker$/, async function () {
  const ok = await this.page.evaluate(() => {
    const panel = document.querySelector('ed11y-element-panel');
    if (!panel || !panel.shadowRoot) return false;
    const toggle = panel.shadowRoot.querySelector('#ed11y-toggle');
    if (!toggle) return false;
    toggle.click();
    return true;
  });
  if (!ok) throw friendly('The accessibility checker toggle was not found.');
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Paragraphs (Landing page component add dialog).
// -----------------------------------------------------------------------------

/**
 * Select a paragraph component in the "Add component" dialog.
 *
 * Ports VarbaseContext::iSelectTheParagraphComponent: clicks the add button in
 * the paragraphs-add-dialog whose name matches the component.
 *
 * Example #1: When I select the "Text" paragraph component
 * Example #2: And I select the "Modal" paragraph component
 * Example #3: When we select the "Drupal block" paragraph component
 * Example #4: And I select the "Rich Text" paragraph component
 * Example #5: Given I select the "Accordion" paragraph component
 */
When(/^(?:I |we )*select the "([^"]*)" paragraph component$/, async function (component) {
  const ok = await this.page.evaluate((component) => {
    const dialog = document.querySelector('.paragraphs-add-dialog.ui-dialog-content, .paragraphs-add-dialog');
    const scope = dialog || document;
    const btn = [...scope.querySelectorAll('input, button')]
      .find((b) => (b.getAttribute('name') || '').includes(component) || (b.value || '').includes(component) || (b.textContent || '').includes(component));
    if (!btn) return false;
    // The paragraphs "Add <type>" buttons are Drupal AJAX submit buttons whose
    // handler is bound to the `mousedown` event (Drupal core ajax.js binds form
    // buttons on mousedown), so a bare element.click() fires only a `click`
    // event and the AJAX that inserts the paragraph subform never runs — the
    // dialog just sits there and the subform (and its CKEditor field) never
    // appears. Dispatch the full pointer sequence so the mousedown-bound AJAX
    // fires and the subform is added.
    btn.scrollIntoView({ block: 'center' });
    for (const type of ['mousedown', 'mouseup', 'click']) {
      btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
    return true;
  }, component);
  if (!ok) throw friendly(`Could not find the "${component}" paragraph component in the add dialog.`);
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Modal / dialog confirm & delete.
// -----------------------------------------------------------------------------

/**
 * Press the confirm (Restore / OK / primary) button in a jQuery UI modal.
 *
 * Ports VarbaseContext::iPressTheConfirmButton (used by trash restore).
 *
 * Example #1: When I press the confirm button in modal
 * Example #2: And I press the confirm button in modal
 * Example #3: When we press the confirm button in modal
 * Example #4: Given I press the confirm button in modal
 * Example #5: And we press the confirm button in modal
 */
When(/^(?:I |we )*press the confirm button in modal$/, async function () {
  const ok = await this.page.evaluate(() => {
    const scope = document.querySelector('.ui-dialog, [role="dialog"]') || document;
    const candidates = [...scope.querySelectorAll('button, input[type="submit"]')];
    const btn = candidates.find((b) => /^(Restore|OK|Confirm|Yes)$/i.test((b.textContent || b.value || '').trim()))
      || scope.querySelector('.button--primary, .ui-dialog-buttonset button');
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!ok) throw friendly('No confirm button was found in the modal.');
  await smartSettle(this.page, budget(this));
});

/**
 * Click the first "Delete" button on the page (action link or submit).
 *
 * Ports VarbaseContext::iClickTheDeleteButton.
 *
 * Example #1: When I click the delete button
 * Example #2: And I click the delete button
 * Example #3: When we click the delete button
 * Example #4: Given I click the delete button
 * Example #5: And we click the delete button
 */
When(/^(?:I |we )*click the delete button$/, async function () {
  const ok = await this.page.evaluate(() => {
    const label = (b) => (b.value || b.textContent || '').trim();
    // The Varbase/Gin media & content delete confirm renders as an AJAX modal
    // whose actual "Delete" control is a form SUBMIT button (input[type=submit]
    // / button[type=submit]). The same page also carries several `use-ajax`
    // "Delete" ACTION LINKS (the Gin sticky action bar #gin-sticky-edit-delete,
    // the top-bar dropdown link, the edit-form #edit-delete link) which only
    // (re)open that confirm dialog — clicking one of those never submits the
    // deletion. So target the real submit button, preferring the one inside the
    // open dialog, and never a use-ajax/action-link.
    const isSubmit = (b) =>
      (b.tagName === 'INPUT' && b.type === 'submit') ||
      (b.tagName === 'BUTTON' && (b.type === 'submit' || !b.type));
    const openDialog = [...document.querySelectorAll('.ui-dialog, [role="dialog"]')]
      .find((d) => d.offsetParent !== null || getComputedStyle(d).display !== 'none');
    const scopes = openDialog ? [openDialog, document] : [document];
    for (const scope of scopes) {
      const submit = [...scope.querySelectorAll('input[type="submit"], button')]
        .find((b) => isSubmit(b) && label(b) === 'Delete');
      if (submit) { submit.click(); return true; }
    }
    // Fallback: any "Delete" element that is not a use-ajax/action link (a
    // plain full-page confirm form, e.g. the trash purge confirm).
    const other = [...document.querySelectorAll('button, input[type="submit"], a')]
      .find((b) => label(b) === 'Delete'
        && !b.classList.contains('use-ajax')
        && !b.classList.contains('action-link'));
    if (other) { other.click(); return true; }
    return false;
  });
  if (!ok) throw friendly('No "Delete" submit button was found on the page.');
  await smartSettle(this.page, budget(this));
});

/**
 * Submit the Media Library dialog (the "Insert selected" action).
 *
 * Ports VarbaseContext::iSubmitMediaLibraryDialog.
 *
 * Example #1: When I submit the media library dialog
 * Example #2: And I submit the media library dialog
 * Example #3: When we submit the media library dialog
 * Example #4: Given I submit the media library dialog
 * Example #5: And we submit media library dialog
 */
When(/^(?:I |we )*submit (?:the )?media library dialog$/, async function () {
  const ok = await this.page.evaluate(() => {
    const btn = document.querySelector(".media-library-select[value='dialog-submit'], .ui-dialog button.media-library-select");
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!ok) throw friendly('The Media Library "Insert selected" button was not found.');
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Responsive preview.
// -----------------------------------------------------------------------------

/**
 * Press a responsive-preview device button (Drupal core Responsive preview).
 *
 * Ports VarbaseContext::iPressResponsivePreviewDeviceButton: clicks the control
 * carrying data-responsive-preview-name.
 *
 * Example #1: When I press the "desktop" responsive preview device button
 * Example #2: And I press the "mobile" responsive preview device button
 * Example #3: When we press the "tablet" responsive preview device button
 * Example #4: And I press the "widescreen" responsive preview device button
 * Example #5: When I press the "mobile" responsive preview device button
 */
When(/^(?:I |we )*press the "([^"]*)" responsive preview device button$/, async function (deviceName) {
  const ok = await this.page.evaluate((deviceName) => {
    const btn = document.querySelector(`[data-responsive-preview-name="${deviceName}"]`);
    if (!btn) return false;
    btn.click();
    return true;
  }, deviceName);
  if (!ok) throw friendly(`The "${deviceName}" responsive preview device option was not found.`);
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Landing page Layout Builder — section & block helpers.
// -----------------------------------------------------------------------------

/**
 * Add a basic section (with an optional layout, default "1 Col") at the end of
 * the Layout Builder layout.
 *
 * Ports VarbaseContext::iAddABasicSectionAtTheEndOfLayout.
 *
 * Example #1: When I add a basic "4 Cols" section at the end of layout
 * Example #2: And I add a basic section at the end of layout
 * Example #3: When I add a basic "2 Cols" section at the end of layout
 * Example #4: And we add a basic section at the end of layout
 * Example #5: When I add a basic "3 Cols" section at the end of layout
 */
When(/^(?:I |we )*add a basic(?: "([^"]*)")? section at the end of layout$/, async function (cols) {
  const layout = cols || '1 Col';
  await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const addLink = this.page.locator("a.layout-builder__link--add:has-text('at end of layout'), a.layout-builder__link--add").last();
  await addLink.click();
  await smartSettle(this.page, budget(this));
  const layoutLink = this.page.locator(`a.use-ajax:has-text("${layout}")`).first();
  if (!(await layoutLink.count())) throw friendly(`The "${layout}" layout option was not found in the Add section list.`);
  await layoutLink.click();
  await smartSettle(this.page, budget(this));
});

/**
 * Save (add) the currently configured Layout Builder section.
 *
 * Ports VarbaseContext::iSaveTheSection (clicks the "Add section" submit).
 *
 * Example #1: When I save the section
 * Example #2: And I save the section
 * Example #3: When we save the section
 * Example #4: Given I save the section
 * Example #5: And we save the section
 */
When(/^(?:I |we )*save the section$/, async function () {
  // A raw DOM click (page.evaluate -> btn.click()) does not reliably trigger
  // Drupal's jQuery-bound AJAX submit handler for this button - it can leave
  // the section silently un-added. Use a real Playwright mouse click instead,
  // which dispatches the full native event sequence.
  const btn = this.page.locator('input[type="submit"], button').filter({ hasText: /Add section/i }).first();
  if (!(await btn.count())) throw friendly('The "Add section" button was not found.');
  await btn.click();
  await smartSettle(this.page, budget(this));
});

/**
 * Add gutters to the section being configured (checks "With Gutters").
 *
 * Ports VarbaseContext::iAddSectionGutters.
 *
 * Example #1: When I add section gutters
 * Example #2: And I add section gutters
 * Example #3: When we add section gutters
 * Example #4: Given I add section gutters
 * Example #5: And we add section gutters
 */
When(/^(?:I |we )*add section gutters$/, async function () {
  const lbl = this.page.locator("label:has-text('With Gutters')").first();
  if (!(await lbl.count())) throw friendly('The "With Gutters" option was not found.');
  await lbl.click();
  await smartSettle(this.page, budget(this));
});

// -----------------------------------------------------------------------------
// Landing page Section Configuration — container / colors / spacing / border /
// alignment / breakpoints. These drive the Varbase Bootstrap 5 Layout Builder
// styles form via its stable label `for=` prefixes (same targets the Behat
// context used).
// -----------------------------------------------------------------------------

// Open a styles-tab settings sub-menu (Background / Typography / Spacing /
// Border / Animation / Blocks alignment) so its controls are in the DOM.
async function openSectionMenu(page, menu) {
  await page.evaluate(() => {
    const tab = document.querySelector("a[data-target*='appearance']");
    if (tab) tab.click();
  });
  await page.evaluate((menu) => {
    const span = [...document.querySelectorAll('span')].find((s) => (s.textContent || '').includes(menu));
    if (span) { const d = span.closest('details'); if (d) d.setAttribute('open', ''); }
  }, menu);
}

/**
 * Select a section container type (and optional Boxed width).
 *
 * Ports VarbaseContext::iSelectTheContainerType / iSelectTheContainerWidth.
 *
 * Example #1: When I select the "Edge to Edge" container type
 * Example #2: And I select the "Boxed" container type with a "Tiny" width
 * Example #3: When I select the "Full" container type
 * Example #4: And I select the "Boxed" container type with a "Narrow" width
 * Example #5: When we select the "Edge to Edge" container type
 */
When(/^(?:I |we )*select the "([^"]*)" container type(?: with a "([^"]*)" width)?$/, async function (type, width) {
  // Real Playwright clicks, not a raw DOM click inside page.evaluate(): the
  // LB config sidebar's radio labels are wired through Drupal AJAX behaviors,
  // which a synthetic click can silently fail to trigger (see the identical
  // issue fixed for "save the section").
  const clickLabel = async (text, forPrefix) => {
    const lbl = this.page.locator('label').filter({ hasText: text }).and(this.page.locator(`label[for*="${forPrefix}"]`)).first();
    if (!(await lbl.count())) return false;
    await lbl.click();
    return true;
  };
  if (!(await clickLabel(type, 'edit-layout-settings-ui-tab-content-layout-container-type'))) {
    throw friendly(`The "${type}" container type was not found.`);
  }
  if (type === 'Boxed' && width) {
    if (!(await clickLabel(width, 'edit-layout-settings-ui-tab-content-layout-container-width'))) {
      throw friendly(`The "${width}" container width was not found.`);
    }
  }
  await smartSettle(this.page, budget(this));
});

/**
 * Select a section breakpoint column ratio for a given screen size.
 *
 * Ports VarbaseContext::iSelectTheSectionBreakpoint.
 *
 * Example #1: When I select the "md" "33% 67%" section breakpoint
 * Example #2: And I select the "xs" "75% 25%" section breakpoint
 * Example #3: When I select the "lg" "50% 50%" section breakpoint
 * Example #4: And I select the "sm" "100%" section breakpoint
 * Example #5: When we select the "md" "67% 33%" section breakpoint
 */
When(/^(?:I |we )*select the "([^"]*)" "([^"]*)" section breakpoint$/, async function (size, point) {
  // Real Playwright click (see "select the container type" above for why a
  // raw page.evaluate() click is unreliable on these AJAX-bound controls).
  const el = this.page.locator(`[class*="${size}"]`).filter({ hasText: point }).first();
  if (!(await el.count())) throw friendly(`The "${point}" breakpoint for the "${size}" screen size was not found.`);
  await el.click();
  await smartSettle(this.page, budget(this));
});

/**
 * Select a section background color.
 *
 * Ports VarbaseContext::iSelectTheSectionBackgroundColor (opens Background,
 * switches to the color tab, clicks the color label).
 *
 * Example #1: When I select the "Primary" section background color
 * Example #2: And I select the "Light" section background color
 * Example #3: When I select the "Dark" section background color
 * Example #4: And we select the "Info" section background color
 * Example #5: When I select the "White" section background color
 */
When(/^(?:I |we )*select the "([^"]*)" section background color$/, async function (color) {
  await openSectionMenu(this.page, 'Background');
  await this.page.evaluate(() => {
    const t = [...document.querySelectorAll('label')].find((l) => (l.getAttribute('for') || '').includes('appearance-background-background-type-color'));
    if (t) t.click();
  });
  const ok = await this.page.evaluate((color) => {
    const lbl = [...document.querySelectorAll('label')].find((l) => (l.textContent || '').includes(color) && (l.getAttribute('for') || '').includes('appearance-background-background-color'));
    if (!lbl) return false; lbl.click(); return true;
  }, color);
  if (!ok) throw friendly(`The "${color}" section background color was not found.`);
  await smartSettle(this.page, budget(this));
});

/**
 * Select a section text color.
 *
 * Ports VarbaseContext::iSelectTheSectionTextColor.
 *
 * Example #1: When I select the "Dark" section text color
 * Example #2: And I select the "White" section text color
 * Example #3: When I select the "Primary" section text color
 * Example #4: And we select the "Light" section text color
 * Example #5: When I select the "Muted" section text color
 */
When(/^(?:I |we )*select the "([^"]*)" section text color$/, async function (color) {
  await openSectionMenu(this.page, 'Typography');
  const ok = await this.page.evaluate((color) => {
    const lbl = [...document.querySelectorAll('label')].find((l) => (l.textContent || '').includes(color) && (l.getAttribute('for') || '').includes('appearance-typography-text-color-text'));
    if (!lbl) return false; lbl.click(); return true;
  }, color);
  if (!ok) throw friendly(`The "${color}" section text color was not found.`);
  await smartSettle(this.page, budget(this));
});

/**
 * Set the section text alignment.
 *
 * Ports VarbaseContext::iSetTheAlignmentTo.
 *
 * Example #1: When I set the alignment to "End"
 * Example #2: And I set the alignment to "Start"
 * Example #3: When I set the alignment to "Center"
 * Example #4: And we set the alignment to "Justify"
 * Example #5: When I set the alignment to "End"
 */
When(/^(?:I |we )*set the alignment to "([^"]*)"$/, async function (align) {
  await openSectionMenu(this.page, 'Typography');
  const ok = await this.page.evaluate((align) => {
    const lbl = [...document.querySelectorAll('label')].find((l) => (l.textContent || '').includes(align) && (l.getAttribute('for') || '').includes('appearance-typography-text-alignment'));
    if (!lbl) return false; lbl.click(); return true;
  }, align);
  if (!ok) throw friendly(`The "${align}" text alignment was not found.`);
  await smartSettle(this.page, budget(this));
});

/**
 * Uncheck the section "Edge to Edge Background" option.
 *
 * Ports VarbaseContext::iUncheckTheEdgeToEdgeBackground.
 *
 * Example #1: When I uncheck the Edge to Edge Background
 * Example #2: And I uncheck the Edge to Edge Background
 * Example #3: When we uncheck the Edge to Edge Background
 * Example #4: Given I uncheck the Edge to Edge Background
 * Example #5: And we uncheck the Edge to Edge Background
 */
When(/^(?:I |we )*uncheck the Edge to Edge Background$/, async function () {
  await openSectionMenu(this.page, 'Background');
  const ok = await this.page.evaluate(() => {
    const cb = document.querySelector('input.field-background-edge-to-edge');
    if (!cb) return false; cb.click(); return true;
  });
  if (!ok) throw friendly('The "Edge to Edge Background" checkbox was not found.');
  await smartSettle(this.page, budget(this));
});


// --- extra wait / form helpers (10.1.x) ---

When(/^(?:I |we )+wait$/, async function () {
  await smartSettle(this.page, budget(this));
});

When(/^(?:I |we )*wait for (\d+)s$/, async function (seconds) {
  await this.page.waitForTimeout(parseInt(seconds, 10) * 1000);
});

When(/^(?:I |we )*wait for ajax to finish$/, async function () {
  await smartSettle(this.page, budget(this));
});

When(/^(?:I |we )*wait max of (\d+)s for the page to be ready and loaded$/, async function (seconds) {
  await smartSettle(this.page, parseInt(seconds, 10) * 1000);
});

When(/^(?:I |we )*select the radio button "([^"]*)"$/, async function (label) {
  const radio = this.page.getByRole('radio', { name: label, exact: false }).first();
  try {
    await radio.check({ timeout: budget(this) });
  } catch (e) {
    // Fall back to clicking a label that contains the text.
    const byLabel = this.page.locator('label', { hasText: label }).first();
    await byLabel.click({ timeout: budget(this) });
  }
});

Then(/^(?:I |we )*should( not)? see the "([^"]*)" in(?: the)? "([^"]*)" row$/, async function (negate, text, rowText) {
  const row = this.page.locator('tr', { hasText: rowText }).first();
  await row.waitFor({ state: 'attached', timeout: budget(this) }).catch(() => {});
  const rowContent = (await row.textContent().catch(() => '')) || '';
  const found = rowContent.includes(text);
  if (negate) {
    assert.ok(!found, friendly(
      `Expected NOT to see "${text}" in the "${rowText}" row, but it is present.`,
      `Row content: ${rowContent.trim().slice(0, 200)}`,
    ));
  } else {
    assert.ok(found, friendly(
      `Expected to see "${text}" in the "${rowText}" row, but it was not found.`,
      `Row content: ${rowContent.trim().slice(0, 200)}`,
    ));
  }
});

// -----------------------------------------------------------------------------
// Header / footer smoke checks.
//
// Consolidated into this single project step-definitions file. They reuse
// webship-js's own helpers (`smartSettle` smart-wait + `friendly` errors) so
// they behave like the core steps; alter the expected header/footer links,
// credits, social profiles and logos below to match your own site.
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

// -----------------------------------------------------------------------------
// Failure diagnostics (WEBSHIP_DIAG-gated).
//
// Ported from tests/step-definitions/zz-diagnostics.steps.js (removed - its
// hooks now live here so the project has a single step-definitions file).
// Silent unless WEBSHIP_DIAG is set; not enabled by default in CI. Dumps the
// unfiltered JS error list, visible Drupal messages, CKEditor 5 boot state,
// and admin-table operation cells to the trace on any FAILED step, without
// touching the .feature files.
// -----------------------------------------------------------------------------

// Capture the STACK of every uncaught pageerror. webship-js's own listener
// stores only err.message, which is not enough to locate a "Maximum call stack
// size exceeded" recursion — we need the file:line of the recursing frame.
// Registered here (order 3, after webship has created this.page) so we can add
// our own listener alongside webship's.
Before({ order: 3 }, function () {
  if (!process.env.WEBSHIP_DIAG || !this.page) return;
  this._pageErrorStacks = [];
  this.page.on('pageerror', (err) => {
    try { this._pageErrorStacks.push(String((err && err.stack) || (err && err.message) || err)); } catch (e) { /* noop */ }
  });
});

AfterStep({ timeout: 20000 }, async function (scope) {
  if (!process.env.WEBSHIP_DIAG) return;
  const result = scope && scope.result;
  if (!result || result.status !== 'FAILED') return;
  if (!this.page) return;

  const stepText = (scope.pickleStep && scope.pickleStep.text) || '(unknown step)';
  const out = [];
  out.push('\n========== [WS-DIAG] FAILED STEP ==========');
  out.push('STEP: ' + stepText);
  try { out.push('URL:  ' + this.page.url()); } catch (e) { /* noop */ }
  try { out.push('TITLE: ' + await this.page.title()); } catch (e) { /* noop */ }

  // Unfiltered captured JS errors (the real CKEditorError / pageerror text).
  const errs = this._jsErrors || [];
  out.push('JS_ERRORS (' + errs.length + '):');
  errs.slice(0, 25).forEach((e, i) => out.push('  ' + (i + 1) + '. [' + e.type + '] ' + e.message));

  // Full stacks for the uncaught pageerrors (locate the recursing frame).
  const stacks = this._pageErrorStacks || [];
  if (stacks.length) {
    out.push('PAGEERROR_STACKS (' + stacks.length + '):');
    // De-dup identical stacks (a recursion floods the same one).
    const seen = new Set();
    stacks.forEach((s) => {
      const head = s.split('\n').slice(0, 6).join(' | ');
      if (seen.has(head)) return;
      seen.add(head);
      out.push('  --- ' + head);
    });
  }

  // Page-side probe: messages, CKEditor state, paragraph dialog, table ops.
  try {
    const probe = await this.page.evaluate(() => {
      const txt = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
      const messages = [...document.querySelectorAll('[data-drupal-messages], .messages, [role="contentinfo"].messages, .toast, .ck-editor__main')]
        .map((n) => txt(n)).filter(Boolean).slice(0, 6);

      // CKEditor 5 boot state.
      const formatSel = document.querySelector('select[name*="[format]"], select[data-editor-for]');
      const ck5Fields = [...document.querySelectorAll('[data-ckeditor5-id]')].map((el) => ({
        id: el.id,
        ck5id: el.getAttribute('data-ckeditor5-id'),
        booted: !!(window.Drupal && Drupal.CKEditor5Instances && Drupal.CKEditor5Instances.get(el.getAttribute('data-ckeditor5-id'))),
      }));
      const ckMain = document.querySelectorAll('.ck.ck-editor__main').length;
      const ckEl = document.querySelector('.ck.ck-editor__main');
      let ckAncestry = null;
      if (ckEl) {
        const chain = [];
        let el = ckEl;
        for (let i = 0; i < 8 && el; i++) { chain.push(el.tagName.toLowerCase() + '.' + [...el.classList].join('.')); el = el.parentElement; }
        ckAncestry = chain;
      }
      const fieldBody = {
        fieldNameBodyExists: !!document.querySelector('.field--name-body'),
        ckInFieldNameBody: ckEl ? !!ckEl.closest('.field--name-body') : null,
        ckInFormItemBody: ckEl ? !!ckEl.closest('[class*="form-item--body-0-value"], [class*="form-item-body-0-value"]') : null,
      };
      const registrySize = (window.Drupal && Drupal.CKEditor5Instances) ? Drupal.CKEditor5Instances.size : 'no-registry';
      const editors = (window.Drupal && Drupal.editors) ? Object.keys(Drupal.editors) : 'no-Drupal.editors';
      const formats = (window.drupalSettings && drupalSettings.editor && drupalSettings.editor.formats)
        ? Object.keys(drupalSettings.editor.formats) : 'none';
      const formatDetail = {};
      if (window.drupalSettings && drupalSettings.editor && drupalSettings.editor.formats) {
        for (const [k, v] of Object.entries(drupalSettings.editor.formats)) {
          formatDetail[k] = { editor: v.editor, hasEditorSettings: !!v.editorSettings };
        }
      }

      // Paragraph "Add component" dialog buttons/options (04-03/04-04).
      const paraButtons = [...document.querySelectorAll(
        '.paragraphs-add-dialog button, .paragraph-type-add-modal button, [data-drupal-selector*="add-more"] button, .field--widget-paragraphs button.paragraph-type-add-modal-button, .paragraphs-add-wrapper button'
      )].map((b) => txt(b) || b.getAttribute('data-value') || b.name).filter(Boolean).slice(0, 30);

      // Operations cells of admin table rows (JSON:API / entityqueue ops).
      const rows = [...document.querySelectorAll('tr')].slice(0, 40).map((tr) => {
        const cell = tr.querySelector('[headers*="operations"], .dropbutton-wrapper, td:last-child');
        const ops = cell ? [...cell.querySelectorAll('a, button')].map((a) => a.textContent.trim()).filter(Boolean) : [];
        return { row: txt(tr).slice(0, 40), ops };
      }).filter((r) => r.ops.length);

      // Every <select>'s name + option labels (why "Site branding"/"Contact"
      // can't be selected — 04 Block/Webform paragraphs).
      const selects = [...document.querySelectorAll('select')].slice(0, 12).map((s) => ({
        name: s.name || s.id,
        opts: [...s.options].map((o) => o.textContent.trim()).slice(0, 25),
      }));

      // Layout Builder add-section / add-block controls present (05 clone/LB).
      const lbLinks = [...document.querySelectorAll('a, button')]
        .map((a) => txt(a)).filter((t) => /Add (block|section)/i.test(t)).slice(0, 12);

      // Visible Shepherd tour tip text (01 welcome/tour).
      const tourTips = [...document.querySelectorAll('.shepherd-content, .shepherd-text, .shepherd-header')]
        .map((n) => txt(n)).filter(Boolean).slice(0, 6);

      return { messages, formatSelValue: formatSel ? formatSel.value : null, ck5Fields, ckMain, ckAncestry, fieldBody, registrySize, editors, formats, formatDetail, paraButtons, rows: rows.slice(0, 12), selects, lbLinks, tourTips };
    });
    out.push('MESSAGES: ' + JSON.stringify(probe.messages));
    out.push('CK: formatSel=' + probe.formatSelValue + ' ckMain=' + probe.ckMain + ' registry=' + probe.registrySize + ' editors=' + JSON.stringify(probe.editors));
    out.push('CK_FIELDBODY: ' + JSON.stringify(probe.fieldBody) + ' ckAncestry=' + JSON.stringify(probe.ckAncestry));
    out.push('CK_FORMATS: ' + JSON.stringify(probe.formats) + ' detail=' + JSON.stringify(probe.formatDetail));
    out.push('CK_FIELDS: ' + JSON.stringify(probe.ck5Fields));
    if (probe.paraButtons.length) out.push('PARA_BUTTONS: ' + JSON.stringify(probe.paraButtons));
    if (probe.rows.length) out.push('TABLE_OPS: ' + JSON.stringify(probe.rows));
    if (probe.selects && probe.selects.length) out.push('SELECTS: ' + JSON.stringify(probe.selects));
    if (probe.lbLinks && probe.lbLinks.length) out.push('LB_LINKS: ' + JSON.stringify(probe.lbLinks));
    if (probe.tourTips && probe.tourTips.length) out.push('TOUR_TIPS: ' + JSON.stringify(probe.tourTips));
  } catch (e) {
    out.push('PROBE_ERROR: ' + (e && e.message));
  }
  out.push('========== [WS-DIAG] END ==========\n');
  // eslint-disable-next-line no-console
  console.log(out.join('\n'));
});
