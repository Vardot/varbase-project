'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Reuse varbase-e2e's own helpers so these custom steps behave like the core
// ones: `smartSettle` (the smart "wait for a quiet edge" used by every
// navigation step) and `friendly` (tester-friendly error formatting).
const { smartSettle, friendly, fillField, gotoUrl, waitForPageLoad } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');
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

// Resolve step-definition ambiguity with the @vardot/varbase-e2e core: drop
// ONLY the core defs that collide with the overrides kept in this file
// (probe-based, fail-open, never removes a repo step — guarded on uri under
// the package).
(function dropConflictingCoreSteps() {
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
    // Navigation: varbase-e2e joins launchUrl + path with a bare `+`, so a path
    // without a leading slash (the classic Behat authoring style used across
    // the locked features, e.g. `I am on "user/login"`) collapses into
    // `http://localhostuser/login`. Our overrides normalise the join.
    'I am on "user/login"',
    'I go to "admin/content"',
    // Form field/select resolution: varbase-e2e's core steps can't reach a
    // single-word <label> select ("Language"), a bracketed field name
    // (`body[0][format]` builds an invalid `#body[0][format]` CSS), a bare
    // Drupal id ("edit-name"), nor a label that differs by a word ("Email"
    // vs "Email address"). Our overrides add those fallbacks.
    'I select "en" from "Language"',
    'I fill in "x" for "Email"',
    'I attach the file "flag-earth.jpg" to "edit-field-media-image-0-upload"',
    // Click: varbase-e2e matches a clickable only by its exact VISIBLE text, so a
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
    // In-element text assertion: varbase-e2e's core step reads ONLY inputValue() for
    // form controls, so on a <select> it matches the option's machine value
    // ("3600") not its visible label ("1 hour") the flood-control scenarios
    // assert. Our override also matches the selected option's text.
    'I should see "50" in the "#edit-ip-limit" element',
    // Field-value assertion: varbase-e2e's core `the "X" field should contain "Y"`
    // reads inputValue() (the option's machine value for a <select>) and only
    // resolves X as a css selector or a <label> text — it cannot reach a field
    // addressed by its form NAME (`auto_purge[after]`), and asserts the option
    // VALUE not its visible label ("2 months"). Our override adds both.
    'the "auto_purge[after]" field should contain "2 months"',
  ];
  const isPackageCore = (uri) => /node_modules[\\/]@vardot[\\/]varbase-e2e[\\/]/.test(String(uri || ''));
  for (let i = configs.length - 1; i >= 0; i--) {
    const c = configs[i];
    if (!isPackageCore(c.uri) || !(c.pattern instanceof RegExp)) continue;
    if (ownedByVarbase.some((text) => c.pattern.test(text))) configs.splice(i, 1);
  }
})();

// -----------------------------------------------------------------------------
// Overrides of a few varbase-e2e core navigation/form steps (dropped above).
// The locked feature files are authored in the classic Behat style that these
// tolerate; the overrides are strict supersets — they behave identically on
// the happy path and only add the missing fallbacks.
// -----------------------------------------------------------------------------

// Resolve the assets folder to the repo's own tests/assets/ (varbase-e2e
// defaults `this.assetsFolder` to its own package dir, so `I attach the file
// "flag-earth.jpg"` looked for node_modules/varbase-e2e/tests/assets/…).
Before({ order: 1 }, function () {
  this.assetsFolder = path.resolve(process.cwd(), 'tests/assets') + path.sep;
});

// Populate the named-selector registry (`this.__selectorsCss`) that the custom
// steps resolve container / child names against. varbase-e2e loads
// worldParameters.selectors.files into its OWN registry, but the custom steps
// here read `this.__selectorsCss`, which nothing ever filled — so a named
// container like "field body" fell back to the literal string "field body"
// (an invalid CSS descendant combinator that matches nothing), making
// `I should see the ".ck.ck-editor__main" element in the "field body"` fail
// with "found none" even though CKEditor had booted correctly. Load the same
// JSON selector files varbase-e2e uses and flatten their `css` maps here so the
// registry the custom steps consult is actually populated.
Before({ order: 2 }, function () {
  // varbase-e2e's OWN Before hook (selectors.steps.js) already populated
  // this.__selectorsCss from the JSON preset files. We must NOT early-return on
  // that being non-empty — the previous guard did, so the "field body" default
  // below was never merged, `field body` resolved to the literal (invalid) CSS
  // string, and every `... in the "field body"` assertion false-failed with
  // "found none" AFTER a 30s wait even though CKEditor had booted correctly.
  // Start from whatever varbase-e2e populated (fall back to loading the same files
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
// leading slash resolves correctly (varbase-e2e uses a bare `launchUrl + url`).
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
// Delegates to varbase-e2e's fillField, then adds Drupal-friendly fallbacks:
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
// that varbase-e2e's core step cannot reach — then tries label- then value-based
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
 * Click a link / button (superset of varbase-e2e's core `I click "X"`). Tries, in
 * order: exact visible text (varbase-e2e's behaviour), Playwright accessible name,
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
  // 1) exact visible text on a clickable (varbase-e2e's behaviour).
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
 * Press a button/link by its exact visible text (superset of varbase-e2e's core
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

      
// ============================================================================
// 10.1.x-specific steps required by the classic-profile feature suites
// (tests/features/varbase/**). Ported from the Varbase profile Behat suite;
// these have no varbase-e2e core or 11.0.x-curated equivalent. Same helper
// style (smartSettle / friendly / budget).
// ============================================================================

const budget = (world) => (world.minWaitTime && world.minWaitTime.page) || 8000;

// -----------------------------------------------------------------------------
// Authentication / session.
// -----------------------------------------------------------------------------

   // -----------------------------------------------------------------------------
// Checkboxes — Varbase uses "check the box" / "uncheck the box" (varbase-e2e uses
// "check" / "uncheck", so these phrasings need their own definitions).
// -----------------------------------------------------------------------------

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
// (varbase-e2e's "select radio button" / "choose the radio button" resolve by
// value / css), so it needs its own definition.
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// CKEditor 5 rich text editor.
// -----------------------------------------------------------------------------

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

 // -----------------------------------------------------------------------------
// Named-selector element presence (registry-aware).
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// Element-with-attribute text assertions and clicks (raw HTML tag + attribute).
// -----------------------------------------------------------------------------

 /**
 * Assert text is (or is not) present in an element found by label or selector.
 *
 * Overrides varbase-e2e core `I should see "X" in the "Y" element` (which reads
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
 * Overrides varbase-e2e core `the "X" field should contain "Y"`, which only
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

 // -----------------------------------------------------------------------------
// Input-element value assertions / clicks (by data-drupal-selector).
// -----------------------------------------------------------------------------

  // -----------------------------------------------------------------------------
// Keyboard — keypress in a named field.
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// Field group expand (details element).
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// Breadcrumb.
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// Tour (Shepherd) helpers.
// -----------------------------------------------------------------------------

  // -----------------------------------------------------------------------------
// Toolbar / moderation.
// -----------------------------------------------------------------------------

  // -----------------------------------------------------------------------------
// Editorial accessibility checker (Editoria11y).
// -----------------------------------------------------------------------------

  // -----------------------------------------------------------------------------
// Paragraphs (Landing page component add dialog).
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// Modal / dialog confirm & delete.
// -----------------------------------------------------------------------------

   // -----------------------------------------------------------------------------
// Responsive preview.
// -----------------------------------------------------------------------------

 // -----------------------------------------------------------------------------
// Landing page Layout Builder — section & block helpers.
// -----------------------------------------------------------------------------

   // -----------------------------------------------------------------------------
// Landing page Section Configuration — container / colors / spacing / border /
// alignment / breakpoints. These drive the Varbase Bootstrap 5 Layout Builder
// styles form via its stable label `for=` prefixes (same targets the Behat
// context used).
// -----------------------------------------------------------------------------

      
// --- extra wait / form helpers (10.1.x) ---

      // -----------------------------------------------------------------------------
// Header / footer smoke checks.
//
// Consolidated into this single project step-definitions file. They reuse
// varbase-e2e's own helpers (`smartSettle` smart-wait + `friendly` errors) so
// they behave like the core steps; alter the expected header/footer links,
// credits, social profiles and logos below to match your own site.
// -----------------------------------------------------------------------------

  // -----------------------------------------------------------------------------
// Failure diagnostics (VARBASE_E2E_DIAG-gated).
//
// Ported from tests/step-definitions/zz-diagnostics.steps.js (removed - its
// hooks now live here so the project has a single step-definitions file).
// Silent unless VARBASE_E2E_DIAG is set; not enabled by default in CI. Dumps the
// unfiltered JS error list, visible Drupal messages, CKEditor 5 boot state,
// and admin-table operation cells to the trace on any FAILED step, without
// touching the .feature files.
// -----------------------------------------------------------------------------

// Capture the STACK of every uncaught pageerror. varbase-e2e's own listener
// stores only err.message, which is not enough to locate a "Maximum call stack
// size exceeded" recursion — we need the file:line of the recursing frame.
// Registered here (order 3, after varbase-e2e has created this.page) so we can add
// our own listener alongside varbase-e2e's.
Before({ order: 3 }, function () {
  if (!process.env.VARBASE_E2E_DIAG || !this.page) return;
  this._pageErrorStacks = [];
  this.page.on('pageerror', (err) => {
    try { this._pageErrorStacks.push(String((err && err.stack) || (err && err.message) || err)); } catch (e) { /* noop */ }
  });
});

AfterStep({ timeout: 20000 }, async function (scope) {
  if (!process.env.VARBASE_E2E_DIAG) return;
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
