'use strict';

// -----------------------------------------------------------------------------
// Varbase 10.1.x custom step definitions.
//
// These steps port the custom Behat steps that lived in the Varbase profile's
// tests/features/bootstrap/VarbaseContext.php and VarbaseSelectorsContext.php
// (Drupal 11.3/11.4 era, classic `varbase` profile install) to webship-js
// (Playwright + Cucumber-js). Only Behat steps that have NO existing webship-js
// core equivalent are re-implemented here; everything that maps cleanly onto a
// webship-js core step (fill in / press / click / select / wait / scroll /
// see / row / element / selectors …) is used directly in the feature files.
//
// They reuse webship-js's own helpers so they behave like the core steps:
//   - `smartSettle` : the smart "wait for a quiet edge" (DOM ready + network
//                     idle + no pending AJAX/timers) used by every navigation
//                     step.
//   - `friendly`    : tester-friendly error formatting (message + hint).
// -----------------------------------------------------------------------------

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { smartSettle, friendly } = require('webship-js/tests/step-definitions/webship');

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
  return this.page.evaluate(({ fieldId, value, mode }) => {
    const el = document.getElementById(fieldId);
    if (!el || !window.Drupal || !Drupal.CKEditor5Instances) return false;
    const inst = Drupal.CKEditor5Instances.get(el.dataset.ckeditor5Id);
    if (!inst) return false;
    inst.setData(mode === 'append' ? inst.getData() + value : value);
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
    // by label text
    const lbl = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === locator);
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
  if (found.rowMissing) throw friendly(`No table row containing "${entity}" was found on the page.`);
  if (negate) {
    assert.ok(!found.link, friendly(`The "${entity}" row unexpectedly has the "${operation}" operation.`));
  } else {
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
  const count = await this.page.locator(containerSel).first().locator(childSel).count().catch(() => 0);
  if (negate) {
    assert.strictEqual(count, 0, friendly(`Expected no "${child}" element inside "${container}", but found ${count}.`));
  } else {
    assert.ok(count > 0, friendly(`Expected a "${child}" element inside "${container}", but found none.`));
  }
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
  const ok = await this.page.evaluate(() => {
    const btn = document.querySelector('button.toolbar-button--icon--dots, button.toolbar-button.toolbar-button--icon--dots');
    if (!btn) return false;
    btn.click();
    return true;
  });
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
    btn.click();
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
    const btn = [...document.querySelectorAll('button, input[type="submit"], a')]
      .find((b) => (b.textContent || b.value || '').trim() === 'Delete');
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!ok) throw friendly('No "Delete" button was found on the page.');
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
  const ok = await this.page.evaluate(() => {
    const btn = [...document.querySelectorAll('input[type="submit"], button')]
      .find((b) => /Add section/i.test(b.value || b.textContent || ''));
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!ok) throw friendly('The "Add section" button was not found.');
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
  const clickLabel = async (text, forPrefix) => {
    const ok = await this.page.evaluate(({ text, forPrefix }) => {
      const lbl = [...document.querySelectorAll('label')].find((l) => (l.textContent || '').includes(text) && (l.getAttribute('for') || '').includes(forPrefix));
      if (!lbl) return false; lbl.click(); return true;
    }, { text, forPrefix });
    return ok;
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
  const ok = await this.page.evaluate(({ size, point }) => {
    const el = [...document.querySelectorAll('*')].find((e) => e.className && String(e.className).includes(size) && (e.textContent || '').includes(point));
    if (!el) return false; el.click(); return true;
  }, { size, point });
  if (!ok) throw friendly(`The "${point}" breakpoint for the "${size}" screen size was not found.`);
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
