'use strict';

// -----------------------------------------------------------------------------
// Varbase-specific step definitions for the 9.2.x suite.
//
// Almost everything this file used to carry now ships as built-ins in
// @vardot/varbase-e2e (the Drupal and Varbase step packs) - keeping local
// copies would make every matching scenario ambiguous. What remains is the
// one phrasing the 9.2.x feature files use that the package does not ship.
// -----------------------------------------------------------------------------

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { friendly, fillField, smartSettle } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');
const { checkboxStateByLabel, budget } = require('@vardot/varbase-e2e/tests/step-definitions/drupal-helpers');

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

// -----------------------------------------------------------------------------
// Drupal-aware override of the core "fill in X for Y" step, ported from the
// 10.1.x suite: adds the bare-id, label-alias and single-partial-label
// fallbacks the Drupal admin forms and the media library dialog need. The
// registry dropper below removes the package's own definition first, so the
// override never causes an ambiguity.
// -----------------------------------------------------------------------------

(function dropConflictingCoreSteps() {
  let builder;
  try {
    builder = require('@cucumber/cucumber/lib/support_code_library_builder').default;
  } catch (e) {
    return; // internal path moved -> fail open, ambiguity re-surfaces visibly.
  }
  const configs = builder && builder.stepDefinitionConfigs;
  if (!Array.isArray(configs)) return;
  const ownedHere = [
    'I fill in "x" for "Email"',
    'I open the "field_image" media library',
    'I add a basic "Two Cols" section at the end of layout',
    'I save the section',
    'I press the "Save" button',
  ];
  const isPackageCore = (uri) => /node_modules[\\/]@vardot[\\/]varbase-e2e[\\/]/.test(String(uri || ''));
  for (let i = configs.length - 1; i >= 0; i--) {
    const c = configs[i];
    if (!isPackageCore(c.uri) || !(c.pattern instanceof RegExp)) continue;
    if (ownedHere.some((text) => c.pattern.test(text))) configs.splice(i, 1);
  }
})();

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

// -----------------------------------------------------------------------------
// 2.0.2 robustness carried branch-locally until the package release ships:
// the media dialog teardown race and the Bootstrap Layout Builder "Configure"
// fallback. Verbatim from Vardot/varbase-e2e PR #35; the dropper above removes
// the package's own definitions first.
// -----------------------------------------------------------------------------

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
  // A previous dialog's late teardown can leave an orphan jQuery UI overlay
  // that intercepts every pointer event and breaks the next dialog's stack.
  // Remove overlays that no longer belong to a visible dialog before opening.
  await this.page.evaluate(() => {
    const dialogOpen = [...document.querySelectorAll('.ui-dialog')].some(
      (d) => d.offsetParent !== null && getComputedStyle(d).display !== 'none'
    );
    if (!dialogOpen) {
      document.querySelectorAll('.ui-widget-overlay').forEach((o) => o.remove());
    }
  });
  const dialog = this.page.locator('.ui-dialog .media-library-view, .media-library-widget-modal').first();
  const open = async () => {
    try {
      await btn.click({ timeout: 8000 });
    } catch (e) {
      // A stale jQuery UI overlay (ui-widget-overlay) from a previous dialog can
      // intercept pointer events over a correctly-resolved button. The button is
      // right - dispatch the click in-page so Drupal's AJAX handler still fires.
      await btn.evaluate((el) => el.click());
    }
    await smartSettle(this.page, budget(this));
  };
  await open();
  // The dialog can be torn down by a previous dialog's late close animation
  // (two stacked jQuery UI dialogs) - verify it is really there, and re-open
  // once when it is not, before letting the next step run against nothing.
  try {
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    await open();
    try {
      await dialog.waitFor({ state: 'visible', timeout: 10000 });
    } catch (e2) {
      throw friendly(`The media library dialog for "${field}" did not open.`);
    }
  }
});

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
  // On newer Bootstrap Layout Builder the layout option adds the section
  // directly instead of opening its settings in the off-canvas. When the
  // section settings form (container type, breakpoints, background) did not
  // open, click the newly added (highest-delta) section's "Configure" link -
  // a use-ajax link that opens the settings in the #drupal-off-canvas dialog,
  // where the following section-settings steps run.
  const hasSettingsForm = await this.page.locator('[id*="layout-container-type"]').count();
  if (!hasSettingsForm) {
    const links = this.page.locator('a.layout-builder__link--configure[href*="/layout_builder/configure-form/section/"]');
    const count = await links.count();
    let bestLink = null;
    let bestDelta = -1;
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      const delta = parseInt(href.split('/').pop(), 10);
      if (delta > bestDelta) { bestDelta = delta; bestLink = links.nth(i); }
    }
    if (bestLink) {
      await bestLink.click();
      await smartSettle(this.page, budget(this));
    }
  }
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
  // The submit reads "Add section" on a fresh section and "Update" when the
  // settings were opened through the section's Configure link. Match the
  // value attribute exactly (the control is usually an <input>) or a
  // button's exact text, preferring the off-canvas dialog - a loose /Update/
  // match grabs invisible widget buttons ("Update widget") elsewhere.
  const label = /^(Add section|Update)$/;
  const pick = (scope) => this.page
    .locator(`${scope} input[type="submit"][value="Add section"], ${scope} input[type="submit"][value="Update"]`)
    .or(this.page.locator(`${scope} button`).filter({ hasText: label }));
  let btn = pick('#drupal-off-canvas').first();
  if (!(await btn.count())) {
    btn = pick('body').first();
  }
  if (!(await btn.count())) throw friendly('The "Add section" / "Update" button was not found.');
  await btn.click();
  await smartSettle(this.page, budget(this));
});

/**
 * Press a button, submit input, or link by its visible text - preferring the
 * VISIBLE candidate. Sticky action bars (Gin) clone buttons: the original
 * stays hidden while the visible clone carries the same text, and clicking
 * the hidden original starves actionability for the full timeout. Carried
 * branch-locally with the other pending package fixes; the dropper removes
 * the package's own definition first.
 *
 * Example #1: When I press "Log In"
 * Example #2: And I press the "Save" button
 * Example #3: And I press the "Save as" button
 * Example #4: When we press "Submit"
 * Example #5: And press "Cancel"
 */
When(/^(I |we )*press( the)* "([^"]*)?"( button)*$/, async function (pronounCase, theCase, element, buttonCase) {
  const esc = element.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const all = this.page.locator('button, input[type="button"], input[type="submit"], [role="button"], a')
    .filter({ hasText: new RegExp('^' + esc + '$') });
  let btn = all.first();
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    if (await all.nth(i).isVisible()) { btn = all.nth(i); break; }
  }
  try {
    await btn.click({ timeout: 10000 });
  } catch (e) {
    try {
      await btn.evaluate((el) => el.click(), { timeout: 5000 });
    } catch (e2) {
      throw friendly(`Could not press the "${element}" button.`, 'Check the visible text matches exactly (case-sensitive).');
    }
  }
});
