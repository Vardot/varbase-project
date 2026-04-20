'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

/**
 * Authenticate a user with password from varbase configuration.
 *
 * Users are defined in cucumber.js worldParameters.users.
 *
 * Example: Given I am a logged in user with the username "Content admin" user
 */
Given(/^I am a logged in user with( the)*( username)* "([^"]*)?"( user)*$/, async function (theCase, usernameCase, username, userCase) {
  const users = this.parameters.users;

  if (username in users) {
    const loginName = users[username].username || username;
    const password = users[username].password;

    if (password != null) {
      await this.page.goto(this.launchUrl + '/user/login', { waitUntil: 'domcontentloaded' });
      await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
      await this.page.fill('#edit-name', loginName);
      await this.page.fill('#edit-pass', password);
      await this.page.click('#edit-submit');
      await this.page.waitForLoadState('domcontentloaded');
    }
  } else {
    throw new Error(`${username} username does not exist in configured users`);
  }
});

/**
 * Simple wait for body to be present.
 *
 * Example: And wait
 */
When(/^wait$/, async function () {
  await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await this.page.waitForLoadState('domcontentloaded');
});

/**
 * Assert a checkbox is checked by its label.
 *
 * Example: Then I should see the "Remember me" checkbox checked
 */
Then(/^(I |we )*should see( the)* "([^"]*)?" checkbox checked$/, async function (pronounCase, theCase, label) {
  const byLabel = this.page.getByLabel(label, { exact: true });
  if (await byLabel.count() > 0) {
    const isChecked = await byLabel.isChecked();
    assert.ok(isChecked, `Checkbox "${label}" should be checked but it is not.`);
  } else {
    const labelEl = this.page.getByText(label, { exact: true }).first();
    const forAttr = await labelEl.getAttribute('for').catch(() => null);
    if (forAttr) {
      const isChecked = await this.page.locator('#' + forAttr).isChecked();
      assert.ok(isChecked, `Checkbox "${label}" should be checked but it is not.`);
    }
  }
});

/**
 * Assert a checkbox is unchecked by its label.
 *
 * Example: Then I should see the "Remember me" checkbox unchecked
 */
Then(/^(I |we )*should see( the)* "([^"]*)?" checkbox unchecked$/, async function (pronounCase, theCase, label) {
  const byLabel = this.page.getByLabel(label, { exact: true });
  if (await byLabel.count() > 0) {
    const isChecked = await byLabel.isChecked();
    assert.ok(!isChecked, `Checkbox "${label}" should be unchecked but it is checked.`);
  } else {
    const labelEl = this.page.getByText(label, { exact: true }).first();
    const forAttr = await labelEl.getAttribute('for').catch(() => null);
    if (forAttr) {
      const isChecked = await this.page.locator('#' + forAttr).isChecked();
      assert.ok(!isChecked, `Checkbox "${label}" should be unchecked but it is checked.`);
    }
  }
});

/**
 * Click next button in Drupal tour (Shepherd).
 *
 * Example: When I click next button in tour
 */
When(/^(I |we )*click next button in tour$/, async function (pronounCase) {
  await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await this.page.evaluate(() => {
    document.querySelector('body > dialog.drupal-tour.shepherd-enabled > div.shepherd-content > footer > button.button--primary.shepherd-button').click();
  });
});

/**
 * Assert element visible inside a container field.
 *
 * Example: Then I should see the "#edit-title" element in the ".form-wrapper" field
 */
Then(/^(I |we )*should see( the)* "([^"]*)?" element in( the)* "([^"]*)?" field$/, async function (pronounCase, the1Case, childSelector, the2Case, parentSelector) {
  async function assertPresent(page, selector) {
    if (selector.startsWith('#') || selector.startsWith('.')) {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 10000 });
    } else {
      const label = page.getByText(selector, { exact: true }).first();
      const forAttr = await label.getAttribute('for').catch(() => null);
      if (forAttr) {
        await page.locator('#' + forAttr).waitFor({ state: 'visible', timeout: 10000 });
      } else {
        await label.waitFor({ state: 'visible', timeout: 10000 });
      }
    }
  }

  await assertPresent(this.page, childSelector);
  await assertPresent(this.page, parentSelector);
});

/**
 * Assert element NOT visible inside a container field.
 *
 * Example: Then I should not see the "#edit-title" element in the ".form-wrapper" field
 */
Then(/^(I |we )*should not see( the)* "([^"]*)?" element in( the)* "([^"]*)?" field$/, async function (pronounCase, the1Case, elementSelector, the2Case, containerSelector) {
  const count = await this.page.locator(`${containerSelector} ${elementSelector}`).count();
  assert.strictEqual(count, 0, `Element "${elementSelector}" should not be present in "${containerSelector}" but it is.`);
});
