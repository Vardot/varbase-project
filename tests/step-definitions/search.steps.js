'use strict';

// Steps for the search results page. Selectors live in tests/selectors/default-theme.json.

const assert = require('assert');
const { When, Then } = require('@cucumber/cucumber');
const { smartSettle, friendly } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');
const selectors = require('../selectors/default-theme.json').css;

const budgetOf = (world) => (world.minWaitTime && world.minWaitTime.page) || 8000;
const keywordField = (page) => page.locator(selectors['search results keyword field']).first();

/**
 * Example #1: Then the search results keyword field should be visible
 * Example #2: And the search results keyword field should be visible
 */
Then(/^the search results keyword field should be visible$/, async function () {
  await keywordField(this.page).waitFor({ state: 'visible', timeout: budgetOf(this) });
});

/**
 * Example #1: Then the search results keyword field should show the placeholder "Search by keyword"
 */
Then(/^the search results keyword field should show the placeholder "([^"]*)"$/, async function (placeholder) {
  assert.strictEqual(await keywordField(this.page).getAttribute('placeholder'), placeholder);
});

/**
 * Example #1: Then the search results keyword field should hold "Varbase"
 * Example #2: And the search results keyword field should hold "Blog"
 */
Then(/^the search results keyword field should hold "([^"]*)"$/, async function (value) {
  const field = keywordField(this.page);
  await field.waitFor({ state: 'attached', timeout: budgetOf(this) });
  assert.strictEqual(await field.inputValue(), value);
});

/**
 * Example #1: Then every search result should link to its content
 */
Then(/^every search result should link to its content$/, async function () {
  const rows = this.page.locator(selectors['search result']);
  await rows.first().waitFor({ state: 'visible', timeout: budgetOf(this) });
  const total = await rows.count();
  const linked = await this.page.locator(`${selectors['search result']}:has(a[href])`).count();
  assert.ok(total > 0 && linked === total, friendly(`Expected all ${total} search results to carry a link, but ${linked} do.`, 'Check the search_result view mode renders the title as a link.'));
});

/**
 * Example #1: When I follow the first search result
 */
When(/^(?:I |we )*follow the first search result$/, async function () {
  const link = this.page.locator(selectors['search result link']).first();
  this.followedSearchResult = new URL(await link.getAttribute('href'), this.page.url()).pathname;
  // A card's stretched link has no box of its own; open it from the keyboard.
  await link.focus();
  await this.page.keyboard.press('Enter');
  await this.page.waitForLoadState('load').catch(() => {});
  await smartSettle(this.page, budgetOf(this));
});

/**
 * Example #1: Then I should be on the page of the search result I followed
 */
Then(/^(?:I |we )*should be on the page of the search result I followed$/, async function () {
  assert.strictEqual(new URL(this.page.url()).pathname, this.followedSearchResult);
});

/**
 * Example #1: When I search again from the results page for "Blog"
 */
When(/^(?:I |we )*search again from the results page for "([^"]*)"$/, async function (keyword) {
  await keywordField(this.page).fill(keyword);
  await this.page.locator(selectors['search results search button']).first().click();
});
