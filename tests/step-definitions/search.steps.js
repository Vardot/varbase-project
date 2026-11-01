'use strict';

// Steps for the search page: the keyword bar, the results, the Content Type facet
// and the Date Published filter. Selectors live in tests/selectors/default-theme.json
// and tests/selectors/search.json.

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

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolve a plain name from the selector registry (tests/selectors/selectors.json).
 */
function named(world, name) {
  const selector = world.__selectorsCss && world.__selectorsCss[name];
  if (!selector) {
    throw friendly(`The selector registry has no "${name}".`, 'Add it to tests/selectors/search.json.');
  }
  return world.page.locator(selector);
}

/**
 * Resolve one of the search page's blocks by its registry name, failing
 * plainly when it is absent.
 */
async function requireLocator(world, name, what, hint) {
  const locator = named(world, name).first();
  if (!(await locator.count())) {
    throw friendly(`Could not find ${what} on "${world.page.url()}".`, hint);
  }
  return locator;
}

/**
 * Read the results summary line ("Displaying 1 - 10 of 15 results").
 */
async function resultsSummaryText(world) {
  const view = await requireLocator(
    world,
    'search results',
    'the search results block',
    'Open /search and run a search first — the results block renders only on the search page.'
  );
  return ((await view.innerText()) || '').replace(/\s+/g, ' ').trim();
}

/**
 * Collect the Content Type facet options as { label, count } pairs, read from
 * each option's accessible name ("Blog post (9)"). The facet's script turns
 * the option links into checkboxes of the same name.
 */
async function facetOptions(world) {
  const facet = named(world, 'content type facet');
  if (!(await facet.count())) {
    return [];
  }
  const names = await facet
    .getByRole('checkbox')
    .or(facet.getByRole('link'))
    .evaluateAll((items) =>
      items.map((item) =>
        ((item.labels && item.labels[0] ? item.labels[0].innerText : item.innerText) || '').replace(/\s+/g, ' ').trim()
      )
    );
  return names
    .map((name) => /^(.*)\s\((\d+)\)$/.exec(name))
    .filter(Boolean)
    .map((match) => ({ label: match[1], count: Number(match[2]) }));
}

/**
 * One Content Type facet option, found by role and accessible name.
 */
function facetOption(world, label) {
  const facet = named(world, 'content type facet');
  const name = new RegExp(`^${escapeRegExp(label)} \\(\\d+\\)$`);
  return facet.getByRole('checkbox', { name }).or(facet.getByRole('link', { name })).first();
}

/**
 * Search from the keyword bar above the results.
 *
 * Fills the "keywords" input of the results block's exposed filter form and
 * presses that form's own submit button, so the header search block and the
 * Date Published rail — which carry the same field — are left alone.
 *
 * Example #1: When I search for "Varbasesearchtest"
 * Example #2: And I search for "Varbasesearchsingle"
 * Example #3: When we search for "Varbase Example Search Blog 07"
 * Example #4: And I search for "Zzzznothingmatchesthis"
 * Example #5: Given I search for "Varbasesearchtest"
 */
When(/^(?:I |we )*search for "([^"]*)"$/, async function (keywords) {
  const form = await requireLocator(
    this,
    'search results form',
    'the search keyword bar',
    'Go to "/search" before searching — the keyword bar is a block on that page.'
  );
  await form.locator(this.__selectorsCss['search keywords']).first().fill(keywords);
  await form.getByRole('button', { name: 'Search', exact: true }).click();
  await smartSettle(this.page, budgetOf(this));
});

/**
 * Open one search result from the keyboard.
 *
 * A result renders as a card whose link covers the whole card and carries the
 * title as its accessible name, so it has no box of its own to click. Focusing
 * it and pressing Enter is how a keyboard user opens it.
 *
 * Example #1: When I open the "Varbase Example Search Blog 07" search result
 * Example #2: And I open the "Varbase Example Search Page 01" search result
 * Example #3: When we open the "Varbase Example Search Blog 01" search result
 * Example #4: And we open the "Varbase Example Search Blog 08" search result
 * Example #5: Given I open the "Varbase Example Search Page 06" search result
 */
When(/^(?:I |we )*open the "([^"]*)" search result$/, async function (title) {
  const view = await requireLocator(
    this,
    'search results',
    'the search results block',
    'Run a search first, the results block renders only on the search page.'
  );
  // A card link may be named by more than the title, so fall back to the row showing it.
  let link = view.getByRole('link', { name: title }).first();
  if (!(await link.count())) {
    link = view.locator('.views-row', { hasText: title }).locator('a[href]').first();
  }
  if (!(await link.count())) {
    throw friendly(`The search results offer no link to "${title}".`, 'Check the search returned it.');
  }
  await link.focus();
  await this.page.keyboard.press('Enter');
  await this.page.waitForLoadState('load').catch(() => {});
  await smartSettle(this.page, budgetOf(this));
});

/**
 * Assert the total the results summary reports.
 *
 * Example #1: Then the search results summary should show a total of 15
 * Example #2: And the search results summary should show a total of 9
 * Example #3: Then the search results summary should show a total of 1
 * Example #4: And the search results summary should show a total of 12
 * Example #5: Then the search results summary should show a total of 6
 */
Then(/^the search results summary should show a total of (\d+)$/, async function (total) {
  const text = await resultsSummaryText(this);
  const match = text.match(/Displaying\s+\d+\s*-\s*\d+\s+of\s+(\d+)\s+results/i);
  if (!match) {
    throw friendly(
      `The search results block on "${this.page.url()}" shows no result summary.`,
      `It reads: "${text.slice(0, 200)}".`
    );
  }
  assert.strictEqual(
    Number(match[1]),
    Number(total),
    `Expected the search to report ${total} results, but it reports ${match[1]} ("${match[0]}").`
  );
});

/**
 * Assert how many results the current page of the listing shows.
 *
 * Example #1: Then the search results should list 10 items
 * Example #2: And the search results should list 5 items
 * Example #3: Then the search results should list 1 item
 * Example #4: And the search results should list 9 items
 * Example #5: Then the search results should list 7 items
 */
Then(/^the search results should list (\d+) items?$/, async function (expected) {
  const rows = named(this, 'search result');
  const deadline = Date.now() + 10000;
  let count = await rows.count();
  while (count !== Number(expected) && Date.now() < deadline) {
    await this.page.waitForTimeout(100);
    count = await rows.count();
  }
  assert.strictEqual(count, Number(expected), `Expected ${expected} search results on the page, but it lists ${count}.`);
});

/**
 * Assert a title is (or is not) among the search results.
 *
 * Example #1: Then the search results should include "Varbase Example Search Blog 01"
 * Example #2: And the search results should include "Varbase Example Search Page 01"
 * Example #3: Then the search results should not include "Varbase Example Search Page 06"
 * Example #4: And the search results should not include "Varbase Example Search Blog 09"
 * Example #5: Then the search results should include "Varbase Example Search Blog 07"
 */
Then(/^the search results should( not)? include "([^"]*)"$/, async function (negate, title) {
  const text = await resultsSummaryText(this);
  const found = text.includes(title);
  if (negate) {
    assert.ok(!found, `Expected "${title}" NOT to be among the search results, but it is.`);
  } else {
    assert.ok(found, `Expected "${title}" among the search results, but it is not.`);
  }
});

/**
 * Assert a Content Type facet option and its count.
 *
 * Example #1: Then the Content Type facet should offer "Blog post" with a count of 9
 * Example #2: And the Content Type facet should offer "Utility page" with a count of 6
 * Example #3: Then the Content Type facet should offer "Blog post" with a count of 7
 * Example #4: And the Content Type facet should offer "Utility page" with a count of 5
 * Example #5: Then the Content Type facet should offer "Blog post" with a count of 1
 */
Then(
  /^the Content Type facet should offer "([^"]*)" with a count of (\d+)$/,
  async function (label, count) {
    await requireLocator(
      this,
      'content type facet',
      'the Content Type facet block',
      'The facet renders only when the search has results, search for something first.'
    );
    await facetOption(this, label).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const options = await facetOptions(this);
    const option = options.find((item) => item.label === label);
    assert.ok(
      option,
      `Expected the Content Type facet to offer "${label}", but it offers ${
        options.length ? options.map((item) => `"${item.label}" (${item.count})`).join(', ') : 'nothing'
      }.`
    );
    assert.strictEqual(
      option.count,
      Number(count),
      `Expected the Content Type facet to count ${count} for "${label}", but it counts ${option.count}.`
    );
  }
);

/**
 * Assert the Content Type facet offers nothing — the state before a search,
 * when there are no results to build facet options from.
 *
 * Example #1: Then the Content Type facet should offer no content types
 * Example #2: And the Content Type facet should offer no content types
 * Example #3: Then the Content Type facet should offer no content types
 * Example #4: And the Content Type facet should offer no content types
 * Example #5: Then the Content Type facet should offer no content types
 */
Then(/^the Content Type facet should offer no content types$/, async function () {
  const options = await facetOptions(this);
  assert.strictEqual(
    options.length,
    0,
    `Expected no Content Type facet options, but the facet offers ${options
      .map((item) => `"${item.label}" (${item.count})`)
      .join(', ')}.`
  );
});

/**
 * Narrow the results by clicking one Content Type facet option.
 *
 * Example #1: When I choose the "Blog post" Content Type facet
 * Example #2: And I choose the "Utility page" Content Type facet
 * Example #3: When we choose the "Blog post" Content Type facet
 * Example #4: And we choose the "Utility page" Content Type facet
 * Example #5: Given I choose the "Blog post" Content Type facet
 */
When(/^(?:I |we )*choose the "([^"]*)" Content Type facet$/, async function (label) {
  await requireLocator(
    this,
    'content type facet',
    'the Content Type facet block',
    'The facet renders only when the search has results, search for something first.'
  );
  const option = facetOption(this, label);
  await option.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (!(await option.count())) {
    const offered = (await facetOptions(this)).map((item) => `"${item.label}"`).join(', ');
    throw friendly(`The Content Type facet offers no "${label}" option.`, `It offers ${offered || 'nothing'}.`);
  }
  // The checkbox widget's script puts a real checkbox in front of each facet
  // link. Check it when it is there, and follow the link when the script has
  // not run.
  if ((await option.getAttribute('type')) === 'checkbox') {
    await option.check();
  } else {
    await option.click();
  }
  await this.page.waitForURL(/f%5B0%5D=|f\[0\]=/, { timeout: 30000 }).catch(() => {});
  await smartSettle(this.page, budgetOf(this));
});

/**
 * Choose one option of the Date Published grouped exposed filter.
 *
 * The filter is a radio set in its own block, with Better Exposed Filters
 * auto-submit on, so choosing an option reloads the results by itself.
 *
 * Example #1: When I choose the "Past year" Date Published filter
 * Example #2: And I choose the "Past 24 hours" Date Published filter
 * Example #3: When we choose the "Past week" Date Published filter
 * Example #4: And I choose the "Any time" Date Published filter
 * Example #5: Given I choose the "Past month" Date Published filter
 */
When(/^(?:I |we )*choose the "([^"]*)" Date Published filter$/, async function (label) {
  const form = await requireLocator(
    this,
    'search date form',
    'the Date Published filter',
    'Go to "/search" first — the Date Published filter is a block on that page.'
  );
  const radio = form.getByRole('radio', { name: label, exact: true }).first();
  if (!(await radio.count())) {
    throw friendly(
      `The Date Published filter offers no "${label}" option.`,
      'Varbase Starter offers "Any time", "Past 24 hours", "Past week", "Past month" and "Past year".'
    );
  }
  const before = this.page.url();
  await radio.check();
  // Better Exposed Filters submits the form 500ms after the choice, which is a
  // full navigation. When that auto-submit is off, the form's own submit button
  // is hidden (js-hide), so submit the form itself rather than clicking it.
  try {
    await this.page.waitForURL((url) => url.toString() !== before, { timeout: 10000 });
  } catch {
    await form.evaluate((element) => element.submit());
    await this.page.waitForLoadState('load').catch(() => {});
  }
  await smartSettle(this.page, budgetOf(this));
});

/**
 * Assert which Date Published option is currently chosen.
 *
 * Example #1: Then the "Past year" Date Published filter should be chosen
 * Example #2: And the "Any time" Date Published filter should be chosen
 * Example #3: Then the "Past month" Date Published filter should be chosen
 * Example #4: And the "Past week" Date Published filter should be chosen
 * Example #5: Then the "Past 24 hours" Date Published filter should be chosen
 */
Then(/^the "([^"]*)" Date Published filter should be chosen$/, async function (label) {
  const form = await requireLocator(
    this,
    'search date form',
    'the Date Published filter',
    'Go to "/search" first — the Date Published filter is a block on that page.'
  );
  const radio = form.getByRole('radio', { name: label, exact: true }).first();
  assert.ok(await radio.count(), `The Date Published filter offers no "${label}" option.`);
  assert.ok(
    await radio.isChecked(),
    `Expected the "${label}" Date Published option to be chosen, but it is not.`
  );
});

const headerPart = (world, name) => world.page.locator(selectors[name]).first();

/**
 * Assert the header search icon is collapsed (labelled "Search") or expanded
 * (labelled "Close search", with a close control), as assistive technology reads it.
 *
 * Example #1: Then the header search should be collapsed
 * Example #2: Then the header search should be expanded
 * Example #3: And the header search should be collapsed
 * Example #4: And the header search should be expanded
 * Example #5: Then the header search should be collapsed
 */
Then(/^the header search should be (collapsed|expanded)$/, async function (state) {
  const button = headerPart(this, 'header search button');
  const expanded = state === 'expanded';
  const wanted = { 'aria-expanded': String(expanded), 'aria-label': expanded ? 'Close search' : 'Search' };
  const deadline = Date.now() + 5000;
  let seen = {};
  while (Date.now() < deadline) {
    seen = {
      'aria-expanded': await button.getAttribute('aria-expanded').catch(() => null),
      'aria-label': await button.getAttribute('aria-label').catch(() => null),
    };
    if (seen['aria-expanded'] === wanted['aria-expanded'] && seen['aria-label'] === wanted['aria-label']) break;
    await this.page.waitForTimeout(100);
  }
  assert.deepStrictEqual(seen, wanted, `Expected the header search to be ${state}.`);
  if (expanded) {
    assert.strictEqual(await headerPart(this, 'header search close button').getAttribute('aria-label'), 'Close search');
  }
});

/**
 * Example #1: And the header search box should show the placeholder "Search by keyword"
 * Example #2: Then the header search box should show the placeholder "Search by keyword"
 * Example #3: And the header search box should show the placeholder "Search"
 * Example #4: Then the header search box should show the placeholder "Search the site"
 * Example #5: And the header search box should show the placeholder "Search by keyword"
 */
Then(/^the header search box should show the placeholder "([^"]*)"$/, async function (placeholder) {
  assert.strictEqual(await headerPart(this, 'header search box').getAttribute('placeholder'), placeholder);
});

/**
 * Type a keyword into the open header search box and press Enter.
 *
 * Example #1: When I search the site from the header for "Varbase"
 * Example #2: And I search the site from the header for "Blog"
 * Example #3: When we search the site from the header for "News"
 * Example #4: When I search the site from the header for "Events"
 * Example #5: And I search the site from the header for "Varbase"
 */
When(/^(?:I |we )*search the site from the header for "([^"]*)"$/, async function (keywords) {
  const box = headerPart(this, 'header search box');
  await box.fill(keywords);
  await box.press('Enter');
  await this.page.waitForURL(/[?&]keywords=/).catch(() => {});
  await smartSettle(this.page, budgetOf(this));
});
