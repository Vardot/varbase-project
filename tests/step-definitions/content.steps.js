'use strict';

// Authoring and listing steps shared by the Event and News post content types
// (Varbase Events Base and Varbase News Base). Selectors live in
// tests/selectors/content.json.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { smartSettle, friendly } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');

const budgetOf = (world) => (world.minWaitTime && world.minWaitTime.page) || 8000;

// The human name a step uses, mapped to the node bundle it edits.
const BUNDLES = { event: 'event', 'news post': 'news' };

function css(world, name) {
  const selector = (world.__selectorsCss || {})[name];
  if (!selector) {
    throw friendly(`No selector named "${name}" is registered.`, 'Add it to tests/selectors/content.json.');
  }
  return selector;
}

async function assertOnForm(page, bundle) {
  const url = page.url();
  const onForm = new RegExp(`/node/add/${bundle}(\\?|$)`).test(url) || /\/node\/\d+\/edit/.test(url);
  if (!onForm || !(await page.locator('#edit-title-0-value').count())) {
    throw friendly(
      `Expected to be on the ${bundle} add or edit form, but the current page is "${url}".`,
      `Go to /node/add/${bundle} or /node/<id>/edit before this step.`
    );
  }
}

async function currentNid(page) {
  return page.evaluate(() => {
    const current = (window.drupalSettings && drupalSettings.path && drupalSettings.path.currentPath) || '';
    const own = current.match(/^node\/(\d+)$/);
    if (own) return own[1];
    const sl = document.querySelector('link[rel="shortlink"]');
    const m = sl && sl.getAttribute('href').match(/node\/(\d+)/);
    if (m) return m[1];
    const edit = [...document.querySelectorAll('a[href*="/node/"]')]
      .map((a) => a.getAttribute('href'))
      .find((h) => /\/node\/\d+\/(edit|delete)/.test(h));
    return edit ? edit.match(/\/node\/(\d+)\//)[1] : null;
  });
}

async function clickSubmit(page) {
  await page.evaluate(() => {
    const el = document.getElementById('edit-submit');
    if (el) el.click();
  });
}

/**
 * Save the open Event or News post form, and fail when the save is rejected.
 *
 * Example #1: When I save the event
 * Example #2: And I save the event
 * Example #3: When I save the news post
 * Example #4: And I save the news post
 * Example #5: And we save the event
 */
When(/^(?:I |we )*save the (event|news post)$/, async function (noun) {
  const bundle = BUNDLES[noun];
  await assertOnForm(this.page, bundle);
  await Promise.all([
    this.page.waitForURL((u) => !/\/node\/add\/|\/node\/\d+\/edit/.test(u.toString()), { waitUntil: 'domcontentloaded' }).catch(() => {}),
    clickSubmit(this.page),
  ]);
  await smartSettle(this.page, budgetOf(this));
  if (/\/node\/add\/|\/node\/\d+\/edit/.test(this.page.url())) {
    const errors = await this.page.locator('.messages--error, [role="alert"]').allTextContents();
    throw friendly(
      `Saving the ${noun} did not leave the form, so the save was rejected.`,
      errors.length ? `Form errors: ${errors.join(' | ').replace(/\s+/g, ' ')}` : `Check the required ${noun} fields.`
    );
  }
});

/**
 * Open the edit form of the Event or News post on screen.
 *
 * Example #1: When I open the edit form for the event I am viewing
 * Example #2: And I open the edit form for the event I am viewing
 * Example #3: When I open the edit form for the news post I am viewing
 * Example #4: And I open the edit form for the news post I am viewing
 * Example #5: When we open the edit form for the event I am viewing
 */
When(/^(?:I |we )*open the edit form for the (event|news post) I am viewing$/, async function (noun) {
  const nid = await currentNid(this.page);
  if (!nid) throw friendly(`Could not tell which ${noun} is on screen.`, `Open the ${noun} page first.`);
  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}/node/${nid}/edit`, { waitUntil: 'domcontentloaded' });
  await smartSettle(this.page, budgetOf(this));
  await assertOnForm(this.page, BUNDLES[noun]);
});

/**
 * Delete the Event or News post on screen, so a scenario removes what it made.
 *
 * Example #1: When I delete the event I am viewing
 * Example #2: And I delete the event I am viewing
 * Example #3: When I delete the news post I am viewing
 * Example #4: And I delete the news post I am viewing
 * Example #5: When we delete the event I am viewing
 */
When(/^(?:I |we )*delete the (event|news post) I am viewing$/, async function (noun) {
  const nid = await currentNid(this.page);
  if (!nid) throw friendly(`Could not tell which ${noun} is on screen.`, `Open the ${noun} page first.`);
  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}/node/${nid}/delete`, { waitUntil: 'domcontentloaded' });
  if (!(await this.page.locator('#edit-submit').count())) {
    throw friendly(`Expected the delete confirmation for the ${noun}, but got "${this.page.url()}".`);
  }
  await Promise.all([
    this.page.waitForURL((u) => !/\/delete$/.test(u.pathname), { waitUntil: 'domcontentloaded' }).catch(() => {}),
    clickSubmit(this.page),
  ]);
  await smartSettle(this.page, budgetOf(this));
});

/**
 * Set the start date and time of an Event's "When" field.
 *
 * Example #1: And I set the event "When" date to "2027-03-18" and time "10:00:00"
 * Example #2: When I set the event "When" date to "2027-04-02" and time "09:00:00"
 * Example #3: And I set the event "When" date to "2027-05-06" and time "11:00:00"
 * Example #4: And we set the event "When" date to "2027-06-10" and time "08:30:00"
 * Example #5: When I set the event "When" date to "2028-01-01" and time "12:00:00"
 */
When(/^(?:I |we )*set the event "When" date to "([^"]*)" and time "([^"]*)"$/, async function (date, time) {
  await assertOnForm(this.page, 'event');
  await this.page.locator(css(this, 'event when date')).first().fill(date);
  await this.page.locator(css(this, 'event when time')).first().fill(time);
  await smartSettle(this.page, 1500);
});

/**
 * Type a keyword into the events listing's own keyword filter.
 *
 * Example #1: And I fill in the events keyword filter with "Varbase Example Event"
 * Example #2: When I fill in the events keyword filter with "Varbase Example Event"
 * Example #3: And we fill in the events keyword filter with "Workshop"
 * Example #4: When I fill in the events keyword filter with "Conference"
 * Example #5: And I fill in the events keyword filter with "Varbase Example Event 01"
 */
When(/^(?:I |we )*fill in the events keyword filter with "([^"]*)"$/, async function (value) {
  await this.page.locator(css(this, 'events keyword filter')).first().fill(value);
});

/**
 * Choose an option in the Type filter of the events or news listing.
 *
 * Example #1: And I choose "Workshop" in the events Type filter
 * Example #2: And I choose "Conference" in the events Type filter
 * Example #3: And I choose "Announcements" in the news Type filter
 * Example #4: And I choose "Press Releases" in the news Type filter
 * Example #5: When we choose "Workshop" in the events Type filter
 */
When(/^(?:I |we )*choose "([^"]*)" in the (events|news) Type filter$/, async function (label, listing) {
  await this.page.locator(css(this, `${listing} type filter`)).first().selectOption({ label });
  await smartSettle(this.page, 1500);
});

/**
 * Assert the result summary of a listing reports "of N" items.
 *
 * Example #1: Then the events result summary should show a total of 15
 * Example #2: Then the news result summary should show a total of 8
 * Example #3: Then the podcasts result summary should show a total of 15
 * Example #4: And the events result summary should show a total of 8
 * Example #5: And the podcasts result summary should show a total of 1
 */
Then(/^the (events|news|podcasts) result summary should show a total of (\d+)$/, async function (listing, total) {
  const summaries = this.page.locator(css(this, 'listing result summary'));
  const re = new RegExp(`of\\s+${total}\\b`);
  const deadline = Date.now() + 5000;
  let texts = [];
  while (Date.now() < deadline) {
    texts = (await summaries.allTextContents().catch(() => [])).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (texts.some((t) => re.test(t))) return;
    await this.page.waitForTimeout(100);
  }
  assert.fail(friendly(`Expected the ${listing} result summary to report "of ${total}".`, `It reads: "${texts.join(' | ') || 'nothing'}".`));
});
