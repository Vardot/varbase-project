'use strict';

const { When, Then, After } = require('@cucumber/cucumber');
const assert = require('assert');

const { friendly } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');

// -----------------------------------------------------------------------------
// Custom steps for the Varbase Podcasts Base recipe.
//
// The generic varbase-e2e steps drive the Title, Summary, Duration and Episode
// number fields ("I fill in ..."), so those are not re-implemented here. What
// IS here is what only this recipe needs:
//
//   - the episode form's field-group tabs (Audio, Categorization and the rest
//     render closed), and a field inside a closed tab is not fillable;
//   - the episode's Podcast autocomplete, which every episode must fill;
//   - the Cover art and Audio media-library widgets (AJAX modal pickers);
//   - save / edit / delete, so every authoring scenario stays independent and
//     removes what it creates;
//   - the listing result summary and the related-episodes assertion.
//
// SAFETY: state-changing steps click ONLY specific, verified elements (never a
// "first form submit" fallback) and fail fast if the page is not a Podcast or
// Podcast episode node form, so a mis-navigated run can never submit an
// unrelated form.
// -----------------------------------------------------------------------------

const budgetOf = (world) => (world.minWaitTime && world.minWaitTime.page) || 8000;

/**
 * Wait until the form is quiet: no Drupal AJAX or fetch in flight and no DOM
 * change for 250 ms. Pending timers are not counted: the editor form keeps a
 * 100 ms CKEditor image polling loop running, so it never has none.
 */
async function settleForm(page, budget) {
  await page.waitForFunction(() => {
    const ajax = window.__varbaseE2eAjaxCount;
    const last = window.__varbaseE2eLastMutation;
    if (typeof ajax === 'number' && ajax > 0) return false;
    if (window.jQuery && window.jQuery.active > 0) return false;
    if (typeof last === 'number' && Date.now() - last < 250) return false;
    return true;
  }, null, { timeout: budget, polling: 50 }).catch(() => {});
}

/**
 * Click the form's #edit-submit, wait for the page it navigates to, then settle.
 */
async function submitAndSettle(page, budget, prepare) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}),
    page.evaluate((noValidate) => {
      const el = document.getElementById('edit-submit');
      if (el && el.form && noValidate) el.form.noValidate = true;
      if (el) el.click();
    }, !!prepare),
  ]);
  await settleForm(page, budget);
}

/**
 * Resolve a named selector from the registry (tests/selectors/podcasts.json),
 * so the steps below and the feature files share one place for them.
 */
function named(world, name) {
  const css = (world.__selectorsCss || {})[name];
  if (!css) {
    throw friendly(`No selector named "${name}" is registered.`, 'Add it to tests/selectors/podcasts.json.');
  }
  return css;
}

/**
 * Remember an entity a scenario created, so the cleanup hook can purge it
 * even when the scenario fails before its own delete step.
 */
function trackForCleanup(world, type, id) {
  world.podcastsCreated = world.podcastsCreated || { node: new Set(), media: new Set() };
  world.podcastsCreated[type].add(String(id));
}

/**
 * Assert the browser is on a Podcast or Podcast episode add/edit form before a
 * write. /node/add/podcast matches both add forms.
 */
async function assertOnPodcastForm(page) {
  const url = page.url();
  const onForm = /\/node\/add\/podcast/.test(url) || /\/node\/\d+\/edit/.test(url);
  const hasTitle = (await page.locator('#edit-title-0-value').count()) > 0;
  if (!onForm || !hasTitle) {
    throw friendly(
      `Expected to be on a Podcast or Podcast episode add/edit form, but the current page is "${url}".`,
      'Navigate to /node/add/podcast_episode, /node/add/podcast or /node/<id>/edit before this step.'
    );
  }
}

/**
 * Dismiss the autosave_form "restore a saved draft" dialog when one is open.
 *
 * A retried scenario reopens /node/add/podcast after an earlier attempt typed
 * into it, so Autosave Form offers to restore that draft in a jQuery UI modal
 * whose overlay intercepts every click on the form. Rejecting the draft keeps
 * the retry identical to a first attempt.
 */
async function dismissAutosaveDialog(page, budget) {
  const dialog = page.locator('.ui-dialog.autosave-dialog').first();
  if (!(await dialog.count()) || !(await dialog.isVisible().catch(() => false))) return;
  // Autosave Form offers "Resume editing" and "Discard"; only discarding keeps
  // the form empty.
  const reject = dialog.locator('.ui-dialog-buttonpane button').filter({ hasText: /discard|reject/i }).first();
  if (await reject.count()) {
    await reject.click();
  } else {
    await dialog.locator('.ui-dialog-titlebar-close').first().click();
  }
  await page.locator('.ui-dialog.autosave-dialog').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await settleForm(page, budget);
}

/**
 * Resolve the node id of the Podcast episode page currently shown. Reads it
 * from drupalSettings.path.currentPath, falling back to the Edit local-task
 * link, the shortlink and the node body class.
 */
async function currentEpisodeNid(page) {
  return page.evaluate(() => {
    const current = (window.drupalSettings && drupalSettings.path && drupalSettings.path.currentPath) || '';
    const own = current.match(/^node\/(\d+)$/);
    if (own) return own[1];
    const editHref = [...document.querySelectorAll('a[href*="/node/"]')]
      .map((a) => a.getAttribute('href'))
      .find((h) => /\/node\/\d+\/(edit|delete)/.test(h));
    if (editHref) return editHref.match(/\/node\/(\d+)\//)[1];
    const sl = document.querySelector('link[rel="shortlink"]');
    if (sl) {
      const m = sl.getAttribute('href').match(/node\/(\d+)/);
      if (m) return m[1];
    }
    const body = document.querySelector('body[class*="page-node-"]');
    if (body) {
      const m = body.className.match(/page-node-(\d+)/);
      if (m) return m[1];
    }
    const el = document.querySelector('[data-history-node-id]');
    if (el) return el.getAttribute('data-history-node-id');
    return null;
  });
}

/**
 * Open one of the episode form's field-group tabs by its label.
 *
 * The Podcast episode form groups its fields into horizontal tabs: General
 * (open), Audio, Categorization, SEO and Options (all closed). Playwright will
 * not fill a field inside a closed tab, so Audio, Duration and Episode number
 * need their tab opened first. Handles both renderings the field_group tabs
 * element can take: a tab link, and a plain <details>.
 *
 * Example #1: When I open the "Audio" tab on the podcast form
 * Example #2: And I open the "Audio" tab on the podcast form
 * Example #3: When we open the "Categorization" tab on the podcast form
 * Example #4: And we open the "Options" tab on the podcast form
 * Example #5: Given I open the "Audio" tab on the podcast form
 */
When(/^(?:I |we )*open the "([^"]*)" tab on the podcast form$/, async function (label) {
  await assertOnPodcastForm(this.page);
  await dismissAutosaveDialog(this.page, budgetOf(this));

  // A tab link in the horizontal/vertical tabs list.
  const tab = this.page
    .locator('.horizontal-tabs-list a, .vertical-tabs__menu a, [role="tab"]')
    .filter({ hasText: label })
    .first();
  if (await tab.count()) {
    await tab.click();
    await settleForm(this.page, budgetOf(this));
    return;
  }

  // A plain <details> element with that summary: open it in place.
  const opened = await this.page.evaluate((wanted) => {
    const details = [...document.querySelectorAll('details')].find((d) => {
      const summary = d.querySelector('summary');
      return summary && summary.textContent.trim().startsWith(wanted);
    });
    if (!details) return false;
    details.open = true;
    return true;
  }, label);
  if (!opened) {
    throw friendly(
      `No "${label}" tab or details group was found on the Podcast episode form.`,
      'Check the field_group labels in core.entity_form_display.node.podcast_episode.default.yml.'
    );
  }
  await settleForm(this.page, budgetOf(this));
});

/**
 * Save the current Podcast episode form (clicks ONLY #edit-submit).
 *
 * Guarded: asserts the page is the episode form first, and afterwards asserts
 * the browser left the form (a validation error keeps you on the form and fails
 * the step) so a rejected save never passes silently.
 *
 * Example #1: When I save the podcast episode
 * Example #2: And I save the podcast episode
 * Example #3: When we save the podcast episode
 * Example #4: And we save the podcast episode
 * Example #5: Given I save the podcast episode
 */
When(/^(?:I |we )*save the podcast episode$/, async function () {
  await assertOnPodcastForm(this.page);
  const creating = /\/node\/add\/podcast/.test(this.page.url());
  const onForm = (u) => /\/node\/add\/podcast/.test(u) || /\/node\/\d+\/edit/.test(u);
  await Promise.all([
    this.page.waitForURL((u) => !onForm(u.toString()), { timeout: 45000, waitUntil: 'domcontentloaded' }).catch(() => {}),
    this.page.evaluate(() => {
      const el = document.getElementById('edit-submit');
      if (el) el.click();
    }),
  ]);
  await settleForm(this.page, budgetOf(this));
  const url = this.page.url();
  if (/\/node\/add\/podcast/.test(url) || /\/node\/\d+\/edit/.test(url)) {
    const errors = await this.page.evaluate(() =>
      [...document.querySelectorAll('.messages--error, [data-drupal-messages] .messages--error')]
        .map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
    throw friendly(
      'Saving the podcast episode did not leave the form, so the save was rejected.',
      errors ? `Form errors: ${errors}` : 'Check the required episode fields (Podcast, Summary and Cover art are required).'
    );
  }
  if (creating) {
    const nid = await currentEpisodeNid(this.page);
    if (nid) trackForCleanup(this, 'node', nid);
  }
});

/**
 * Submit the current Podcast episode form (clicks ONLY #edit-submit) without
 * expecting it to save, for scenarios that assert a validation error. Browser
 * validation is switched off first, so the site's own validation answers.
 *
 * Example #1: When I try to save the podcast episode
 * Example #2: And I try to save the podcast episode
 * Example #3: When we try to save the podcast episode
 * Example #4: And we try to save the podcast episode
 * Example #5: Given I try to save the podcast episode
 */
When(/^(?:I |we )*try to save the podcast episode$/, async function () {
  await assertOnPodcastForm(this.page);
  await submitAndSettle(this.page, budgetOf(this), true);
  const nid = /\/node\/add\/podcast/.test(this.page.url()) ? null : await currentEpisodeNid(this.page);
  if (nid) trackForCleanup(this, 'node', nid);
});

/**
 * Pick the podcast an episode belongs to in the required Podcast autocomplete,
 * choosing the suggestion Drupal offers for the typed title.
 *
 * Example #1: When I assign the episode to the "Varbase Example Podcast One" podcast
 * Example #2: And I assign the episode to the "Varbase Example Podcast One" podcast
 * Example #3: When we assign the episode to the "Varbase Example Podcast Two" podcast
 * Example #4: And we assign the episode to the "Varbase Example Podcast Two" podcast
 * Example #5: Given I assign the episode to the "Varbase Example Podcast One" podcast
 */
When(/^(?:I |we )*assign the episode to the "([^"]*)" podcast$/, async function (title) {
  await assertOnPodcastForm(this.page);
  const budget = budgetOf(this);
  await dismissAutosaveDialog(this.page, budget);
  const field = this.page.locator(named(this, 'podcast reference field'));
  if (!(await field.count())) {
    throw friendly('This form has no Podcast field.', 'Only the Podcast episode form references a podcast.');
  }
  await field.fill('');
  await field.pressSequentially(title.slice(0, 12));
  const suggestion = this.page.locator('ul.ui-autocomplete:visible li').filter({ hasText: title }).first();
  await suggestion.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
    throw friendly(`The Podcast field offered no "${title}" suggestion.`, 'Check the podcast exists and is published.');
  });
  await suggestion.click();
  await settleForm(this.page, budget);
  const value = await field.inputValue();
  assert.ok(
    value.startsWith(title),
    friendly(`The Podcast field reads "${value}" after choosing "${title}".`)
  );
});

// ---------------------------------------------------------------------------
// Media library steps.
//
// field_audio and field_featured_image are both media_library_widget fields, so
// the modal is driven through one set of helpers. The Audio field targets two
// bundles, `audio` (an uploaded file) and `remote_audio` (an oEmbed URL from a
// podcast platform), which is why the type menu is something the suite checks
// rather than something it skips past.
// ---------------------------------------------------------------------------

const MEDIA_ITEM = [
  '.media-library-view .js-media-library-item input[type="checkbox"]',
  '.media-library-view .media-library-item input[type="checkbox"]',
  '.media-library-widget-modal .media-library-item input[type="checkbox"]',
].join(', ');

const MEDIA_MODAL = '.media-library-widget-modal, .ui-dialog .media-library-view, [role="dialog"] .media-library-view';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The media_library widget fieldset carrying the given field label.
 */
function mediaWidget(page, label) {
  return page
    .locator('fieldset.js-media-library-widget')
    // Claro puts the label straight in the legend; Gin wraps it in a label.
    .filter({ has: page.locator('legend, legend label').filter({ hasText: new RegExp(`^\\s*${escapeRe(label)}\\s*$`) }) })
    .first();
}

/**
 * Click a media_library widget's "Add media" button and wait for the modal.
 *
 * A real Playwright click, not a synthetic in-page one: only the former fires
 * the Drupal AJAX that builds the dialog.
 */
async function openMediaLibrary(page, label, budget) {
  const widget = mediaWidget(page, label);
  if (!(await widget.count())) {
    const labels = await page.locator('fieldset.js-media-library-widget legend').allTextContents();
    throw friendly(
      `No media library widget labelled "${label}" is on this form.`,
      `Media library widgets present: ${labels.map((s) => s.trim()).filter(Boolean).join(', ') || 'none'}.`
    );
  }
  const openButton = widget.locator('.js-media-library-open-button, input[id$="-open-button"], button[id$="-open-button"]').first();
  await openButton.waitFor({ state: 'visible', timeout: 20000 });
  // Drupal disables every form submit while an AJAX request is in flight, so an
  // unsettled behaviour leaves this button disabled and the click times out.
  try {
    await openButton.locator('xpath=.').waitFor({ state: 'attached', timeout: 1000 });
    await page.waitForFunction(
      (id) => { const el = document.getElementById(id); return el && !el.disabled; },
      await openButton.getAttribute('id'),
      { timeout: 30000 },
    );
  } catch {
    const errors = await page.evaluate(() =>
      [...document.querySelectorAll('.messages--error')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
    throw friendly(
      `The "${label}" media library button stayed disabled, so Drupal never finished an AJAX request on this form.`,
      errors ? `Form errors: ${errors}` : 'No form error was shown. Check the browser console for a failed AJAX response.'
    );
  }
  await openButton.click();
  await page.locator(MEDIA_MODAL).first().waitFor({ state: 'visible', timeout: 30000 });
  await settleForm(page, budget);
}

/**
 * The media type menu links offered by the open media library, by label.
 */
async function mediaLibraryTypes(page) {
  const labels = await page
    .locator('.js-media-library-menu a, .media-library-menu a, .media-library-menu__link')
    .allTextContents();
  // Links read "Show Audio media (active tab)"; reduce that to the type name.
  return labels
    .map((s) => s.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim())
    .map((s) => s.replace(/^Show\s+/i, '').replace(/\s+media$/i, '').trim())
    .filter(Boolean);
}

/**
 * Switch the open media library to the named media type tab, when one exists.
 */
async function switchMediaType(page, type, budget) {
  const slug = type.toLowerCase().replace(/\s+/g, '-');
  const tab = page
    .locator(`.media-library-menu-${slug} a, li.media-library-menu-${slug} a, .media-library-menu__item.media-library-menu-${slug} a`)
    .first();
  if (!(await tab.count())) return false;
  await tab.click();
  await settleForm(page, budget);
  await page.locator(MEDIA_ITEM).first().waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
  return true;
}

/**
 * Select the first item the open media library lists and insert it.
 */
async function insertFirstMediaItem(page, budget, what) {
  const firstItem = page.locator(MEDIA_ITEM).first();
  await firstItem.waitFor({ state: 'attached', timeout: 30000 }).catch(async () => {
    throw friendly(
      `The media library opened but lists no selectable ${what}.`,
      `Media type tabs offered: ${(await mediaLibraryTypes(page)).join(', ') || 'none'}. Ensure the site carries at least one such media item.`
    );
  });
  await firstItem.check({ force: true });
  await settleForm(page, budget);

  const insert = page.locator(
    '.ui-dialog-buttonpane button:has-text("Insert selected"), .media-library-widget-modal button:has-text("Insert selected"), [role="dialog"] button:has-text("Insert selected")'
  ).first();
  await insert.waitFor({ state: 'visible', timeout: 20000 });
  await insert.click();
  await settleForm(page, budget);
}

/**
 * Add the first available image to the episode's required "Cover art" field,
 * from the existing media library.
 *
 * Picking the FIRST item rather than one by name keeps the scenarios
 * independent of which media the site happens to carry. Cover art is
 * required, so every authoring scenario needs one.
 *
 * Example #1: When I add the first available cover art from the media library
 * Example #2: And I add the first available featured image from the media library
 * Example #3: When we add the first available cover art from the media library
 * Example #4: And we add the first available cover art from the media library
 * Example #5: Given I add the first available cover art from the media library
 */
When(/^(?:I |we )*add the first available (cover art|featured image) from the media library$/, async function (what) {
  const label = what === 'cover art' ? 'Cover art' : 'Featured image';
  if (!/\/node\/add\/|\/node\/\d+\/edit/.test(this.page.url())) {
    throw friendly(`Expected a content add or edit form, but the current page is "${this.page.url()}".`);
  }
  const budget = budgetOf(this);
  await dismissAutosaveDialog(this.page, budget);

  await openMediaLibrary(this.page, label, budget);

  // field_featured_image restricts no target bundle, so the library lists every
  // media type and opens on whichever comes first (Audio, since the test
  // content carries an audio media item). Switch to Image unconditionally: a
  // "first available item" that is an audio file silently becomes the cover
  // art, fills the field's single slot, and disables the Add media button.
  await switchMediaType(this.page, 'Image', budget);
  await insertFirstMediaItem(this.page, budget, `image to add as ${what}`);

  const selected = mediaWidget(this.page, label).locator('.media-library-item').first();
  await selected.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {
    throw friendly(`The ${label} widget shows no selected media after inserting.`);
  });
});

/**
 * Open the media library modal of the named media_library_widget field.
 *
 * Example #1: When I open the media library for the "Audio" field
 * Example #2: And I open the media library for the "Audio" field
 * Example #3: When we open the media library for the "Cover art" field
 * Example #4: And we open the media library for the "Cover art" field
 * Example #5: Given I open the media library for the "Audio" field
 */
When(/^(?:I |we )*open the media library for the "([^"]*)" field$/, async function (label) {
  await assertOnPodcastForm(this.page);
  const budget = budgetOf(this);
  await dismissAutosaveDialog(this.page, budget);
  await openMediaLibrary(this.page, label, budget);
});

/**
 * Assert the open media library offers the named media type in its type menu.
 *
 * Example #1: Then the media library should offer the "Audio" media type
 * Example #2: And the media library should offer the "Remote audio" media type
 * Example #3: Then the media library should offer the "Image" media type
 * Example #4: And the media library should offer the "Audio" media type
 * Example #5: Then the media library should offer the "Remote audio" media type
 */
Then(/^the media library should offer the "([^"]*)" media type$/, async function (type) {
  const offered = await mediaLibraryTypes(this.page);
  assert.ok(
    offered.some((t) => t.toLowerCase() === type.toLowerCase()),
    friendly(
      `The open media library does not offer the "${type}" media type.`,
      `It offers: ${offered.join(', ') || 'no type menu at all'}. Check the target bundles on the field and that the media type exists on the site.`
    )
  );
});

/**
 * Select and insert the first item of the named media type from the open
 * media library.
 *
 * Example #1: When I add the first "Audio" media item from the open media library
 * Example #2: And I add the first "Audio" media item from the open media library
 * Example #3: When we add the first "Remote audio" media item from the open media library
 * Example #4: And we add the first "Image" media item from the open media library
 * Example #5: Given I add the first "Audio" media item from the open media library
 */
When(/^(?:I |we )*add the first "([^"]*)" media item from the open media library$/, async function (type) {
  const budget = budgetOf(this);
  await switchMediaType(this.page, type, budget);
  await insertFirstMediaItem(this.page, budget, `${type} media item`);
});

/**
 * Assert the named media_library_widget field shows the given media item as
 * its current selection.
 *
 * Example #1: Then the "Audio" field should show the selected media item "Varbase Example Episode Audio"
 * Example #2: And the "Audio" field should show the selected media item "Varbase Example Episode Audio"
 * Example #3: Then the "Cover art" field should show the selected media item "Varbase Example Podcast Cover"
 * Example #4: And the "Cover art" field should show the selected media item "Varbase Example Podcast Cover"
 * Example #5: Then the "Audio" field should show the selected media item "Episode 12 recording"
 */
Then(/^the "([^"]*)" field should show the selected media item "([^"]*)"$/, async function (label, name) {
  const widget = mediaWidget(this.page, label);
  const selection = widget.locator('.js-media-library-selection, [id$="-selection"]').first();
  await selection.locator('.media-library-item').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {
    throw friendly(`The "${label}" field shows no selected media item.`);
  });
  const text = ((await selection.textContent()) || '').replace(/\s+/g, ' ').trim();
  assert.ok(
    text.includes(name),
    friendly(
      `The "${label}" field does not show "${name}" as its selected media item.`,
      `The widget selection reads: "${text || 'empty'}".`
    )
  );
});

/**
 * Delete the media item carrying the given name, through the core media
 * delete confirm form (clicks ONLY that form's #edit-submit).
 *
 * Example #1: When I delete the "Varbase Example Remote Audio 74504" media item
 * Example #2: And I delete the "Varbase Example Remote Audio 74504" media item
 * Example #3: When we delete the "Varbase Example Episode Audio" media item
 * Example #4: And we delete the "Episode 12 recording" media item
 * Example #5: Given I delete the "Varbase Example Remote Audio 74504" media item
 */
When(/^(?:I |we )*delete the "([^"]*)" media item$/, async function (name) {
  const base = this.launchUrl.replace(/\/$/, '');
  await this.page.goto(`${base}/admin/content/media`, { waitUntil: 'domcontentloaded' });
  await settleForm(this.page, budgetOf(this));

  const mid = await this.page.evaluate((wanted) => {
    const row = [...document.querySelectorAll('tr')].find((tr) => (tr.textContent || '').includes(wanted));
    if (!row) return null;
    const href = [...row.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href'))
      .find((h) => /\/media\/\d+(\/|$)/.test(h));
    return href ? href.match(/\/media\/(\d+)/)[1] : null;
  }, name);

  if (!mid) {
    throw friendly(`No media item named "${name}" is listed on the media overview.`, 'Check the item was created and that this user can see it.');
  }
  trackForCleanup(this, 'media', mid);
  await this.page.goto(`${base}/media/${mid}/delete`, { waitUntil: 'domcontentloaded' });
  const onDelete = /\/media\/\d+\/delete/.test(this.page.url()) && (await this.page.locator('#edit-submit').count()) > 0;
  if (!onDelete) {
    throw friendly(`Expected the media delete confirm form, but got "${this.page.url()}".`);
  }
  await submitAndSettle(this.page, budgetOf(this));
});

/**
 * Open the edit form of the Podcast episode currently being viewed.
 *
 * Example #1: When I open the edit form for the podcast episode I am viewing
 * Example #2: And I open the edit form for the podcast episode I am viewing
 * Example #3: When we open the edit form for the podcast episode I am viewing
 * Example #4: And we open the edit form for the podcast episode I am viewing
 * Example #5: Given I open the edit form for the podcast episode I am viewing
 */
When(/^(?:I |we )*open the edit form for the podcast episode I am viewing$/, async function () {
  const nid = await currentEpisodeNid(this.page);
  if (!nid) {
    throw friendly('Could not determine the node id of the podcast episode being viewed.', 'Open the episode full page before editing it.');
  }
  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}/node/${nid}/edit`, { waitUntil: 'domcontentloaded' });
  await settleForm(this.page, budgetOf(this));
  await assertOnPodcastForm(this.page);
});

/**
 * Delete the Podcast episode currently being viewed, through the core delete
 * confirm form (clicks ONLY that form's #edit-submit). Keeps the authoring
 * scenarios independent by removing what they create.
 *
 * Example #1: When I delete the podcast episode I am viewing
 * Example #2: And I delete the podcast episode I am viewing
 * Example #3: When we delete the podcast episode I am viewing
 * Example #4: And we delete the podcast episode I am viewing
 * Example #5: Given I delete the podcast episode I am viewing
 */
When(/^(?:I |we )*delete the podcast episode I am viewing$/, async function () {
  const nid = await currentEpisodeNid(this.page);
  if (!nid) {
    throw friendly('Could not determine the node id of the podcast episode being viewed.', 'Open the episode full page before deleting it.');
  }
  await this.page.goto(`${this.launchUrl.replace(/\/$/, '')}/node/${nid}/delete`, { waitUntil: 'domcontentloaded' });
  const onDelete = /\/node\/\d+\/delete/.test(this.page.url()) && (await this.page.locator('#edit-submit').count()) > 0;
  if (!onDelete) {
    throw friendly(`Expected the node delete confirm form, but got "${this.page.url()}".`);
  }
  await submitAndSettle(this.page, budgetOf(this));
});

/**
 * Assert the podcasts listing result summary reads a given range, such as
 * "1-12 of 15", polling until it does.
 *
 * Example #1: Then the podcasts result summary should show "1-12 of 15"
 * Example #2: And the podcasts result summary should show "13-15 of 15"
 * Example #3: Then the podcasts result summary should show "1-1 of 1"
 * Example #4: And the podcasts result summary should show "1-12 of 16"
 * Example #5: Then the podcasts result summary should show "1-3 of 3"
 */
Then(/^the podcasts result summary should show "([^"]*)"$/, async function (range) {
  const summary = this.page.locator(named(this, 'listing result summary')).first();
  const deadline = Date.now() + 10000;
  let text = '';
  while (Date.now() < deadline) {
    text = ((await summary.textContent({ timeout: 1000 }).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (text.includes(range)) return;
    await this.page.waitForTimeout(100);
  }
  throw friendly(`Expected the podcasts result summary to show "${range}".`, `It reads: "${text || 'nothing'}".`);
});

/**
 * Assert how many episode cards the podcasts listing shows, polling until the
 * count matches.
 *
 * Example #1: Then the podcasts listing should show 12 episode cards
 * Example #2: And the podcasts listing should show 3 episode cards
 * Example #3: Then the podcasts listing should show 1 episode card
 * Example #4: And the podcasts listing should show 0 episode cards
 * Example #5: Then the podcasts listing should show 7 episode cards
 */
Then(/^the podcasts listing should show (\d+) episode cards?$/, async function (count) {
  const cards = this.page.locator(named(this, 'episode card'));
  const wanted = parseInt(count, 10);
  const deadline = Date.now() + 10000;
  let seen = -1;
  while (Date.now() < deadline) {
    seen = await cards.count();
    if (seen === wanted) return;
    await this.page.waitForTimeout(100);
  }
  throw friendly(`Expected the podcasts listing to show ${wanted} episode card(s).`, `It shows ${seen}.`);
});

/**
 * Choose a tag in the podcasts listing's tag filter.
 *
 * Example #1: When I filter the podcasts by the "Varbase Example Podcast Tag" tag
 * Example #2: And I filter the podcasts by the "Varbase Example Podcast Tag" tag
 * Example #3: When we filter the podcasts by the "Technology" tag
 * Example #4: And we filter the podcasts by the "Education" tag
 * Example #5: Given I filter the podcasts by the "Health" tag
 */
When(/^(?:I |we )*filter the podcasts by the "([^"]*)" tag$/, async function (tag) {
  const filter = this.page.locator(named(this, 'podcasts tag filter')).first();
  await filter.selectOption({ label: tag }, { timeout: 10000 }).catch(() => {
    throw friendly(`The podcasts tag filter offers no "${tag}" tag.`, 'Check the tag exists and is used by a published episode.');
  });
  await settleForm(this.page, budgetOf(this));
});

/**
 * Assert a form field, found by its label, holds a value.
 *
 * Example #1: Then the field "Episode number" should have the value "74501"
 * Example #2: And the field "Duration" should have the value "44 Mins"
 * Example #3: Then the field "Title" should have the value "Varbase Example Authoring Episode 74501"
 * Example #4: And the field "Summary" should have the value "Short summary."
 * Example #5: Then the field "Episode number" should have the value "7"
 */
Then(/^the field "([^"]*)" should have the value "([^"]*)"$/, async function (label, value) {
  const field = this.page.getByLabel(label, { exact: true }).first();
  const actual = await field.inputValue({ timeout: 10000 }).catch(() => null);
  if (actual === null) throw friendly(`No field labelled "${label}" is on this page.`);
  assert.strictEqual(actual, value, friendly(`The "${label}" field holds "${actual}", not "${value}".`));
});

/**
 * Assert the page declares a canonical URL ending in the given path.
 *
 * Example #1: Then the canonical URL should end with "/podcasts/varbase-example-podcast-one/varbase-example-episode-01"
 * Example #2: And the canonical URL should end with "/podcasts/varbase-example-podcast-two"
 * Example #3: Then the canonical URL should end with "/podcasts/varbase-example-podcast-one"
 * Example #4: And the canonical URL should end with "/podcasts/varbase-example-podcast-two/varbase-example-episode-13"
 * Example #5: Then the canonical URL should end with "/podcasts/varbase-example-authoring-podcast"
 */
Then(/^the canonical URL should end with "([^"]*)"$/, async function (path) {
  const hrefs = await this.page.locator('link[rel="canonical"]').evaluateAll((links) => links.map((l) => l.getAttribute('href') || ''));
  assert.ok(
    hrefs.some((h) => h.replace(/\/$/, '').endsWith(path)),
    friendly(`Expected a canonical URL ending in "${path}".`, `The page declares: ${hrefs.join(', ') || 'none'}.`)
  );
});

/**
 * Assert the podcasts listing shows the named podcast with its episode count,
 * whether the count reads "10 Episodes" or "Episodes 10".
 *
 * Example #1: Then the "Varbase Example Podcast One" podcast should be listed with 10 episodes
 * Example #2: And the "Varbase Example Podcast Two" podcast should be listed with 5 episodes
 * Example #3: Then the "Varbase Example Podcast Two" podcast should be listed with 1 episode
 * Example #4: And the "Varbase Example Podcast One" podcast should be listed with 0 episodes
 * Example #5: Then the "Weekly Show" podcast should be listed with 12 episodes
 */
Then(/^the "([^"]*)" podcast should be listed with (\d+) episodes?$/, async function (title, count) {
  const items = this.page.locator(named(this, 'podcast listing item')).filter({ hasText: title });
  await items.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
    throw friendly(`The podcasts listing does not show "${title}".`);
  });
  // What a listener sees: hidden view fields must not run into the count.
  const text = ((await items.first().innerText()) || '').replace(/\s+/g, ' ').trim();
  const re = new RegExp(`(^|\\D)${count}\\s+Episodes?\\b|\\bEpisodes?:?\\s+${count}(\\D|$)`, 'i');
  assert.ok(
    re.test(text),
    friendly(`Expected "${title}" to be listed with ${count} episode(s).`, `Its listing entry reads: "${text}".`)
  );
});

/**
 * Assert the related display lists at least N seeded episodes, none of which is
 * the episode whose tag context was given.
 *
 * Counts distinct "Varbase Example Episode NN" episodes on the page, by title
 * text or by their /podcast/varbase-example-episode-NN link, so the assertion
 * holds whichever way the row view mode prints an episode. The excluded episode
 * appearing at all fails the step: that is the display's node-id exclusion
 * argument not resolving.
 *
 * Example #1: Then the related episodes should include at least 3 episodes other than "Varbase Example Episode 01"
 * Example #2: And the related episodes should include at least 1 episode other than "Varbase Example Episode 14"
 * Example #3: Then the related episodes should include at least 2 episodes other than "Varbase Example Episode 07"
 * Example #4: And the related episodes should include at least 3 episodes other than "Varbase Example Episode 14"
 * Example #5: Then the related episodes should include at least 1 episode other than "Varbase Example Episode 01"
 */
Then(/^the related episodes should include at least (\d+) episodes? other than "([^"]*)"$/, async function (least, excluded) {
  const wanted = parseInt(least, 10);
  const found = await this.page.evaluate(() => {
    const scope = document.querySelector('main') || document.body;
    const numbers = new Set();
    for (const m of (scope.textContent || '').matchAll(/Varbase Example Episode (\d{2})\b/g)) numbers.add(m[1]);
    for (const a of scope.querySelectorAll('a[href*="/podcast/varbase-example-episode-"]')) {
      const m = a.getAttribute('href').match(/varbase-example-episode-(\d{2})/);
      if (m) numbers.add(m[1]);
    }
    return [...numbers].sort();
  });
  const excludedNumber = (excluded.match(/(\d{2})$/) || [])[1];
  assert.ok(
    !found.includes(excludedNumber),
    friendly(`The related display lists "${excluded}" itself; the episode exclusion argument is not working.`)
  );
  assert.ok(
    found.length >= wanted,
    friendly(
      `Expected the related display to list at least ${wanted} other episode(s), but it lists ${found.length} (${found.map((n) => 'Episode ' + n).join(', ') || 'none'}).`,
      'Check the related display arguments: the tag filter, and the node id it excludes.'
    )
  );
});

/**
 * Assert the episode page renders a playable media element whose source is the
 * given URL (exact) or contains the given file name.
 *
 * Vartheme BS5 ships no audio component, so the episode template renders the
 * `video` component as the player: `<video controls><source src="...">`.
 * Asserting the element and its `src` turns that choice into something the
 * suite checks: a template that stops rendering the player, or binds it to the
 * wrong field, fails here.
 *
 * Example #1: Then the episode page should play media from "https://example.com/podcasts/episode.mp3"
 * Example #2: And the episode page should play media from "varbase-example-episode"
 * Example #3: Then the episode page should play media from "varbase-example-episode.wav"
 * Example #4: And the episode page should play media from "https://example.com/podcasts/varbase-example-episode-01.mp3"
 * Example #5: Then the episode page should play media from "episode"
 */
Then(/^the episode page should play media from "([^"]*)"$/, async function (expected) {
  const found = await this.page.evaluate(() =>
    [...document.querySelectorAll('video, audio')].map((el) => {
      const sources = [el.getAttribute('src'), ...[...el.querySelectorAll('source')].map((s) => s.getAttribute('src'))];
      return { tag: el.tagName.toLowerCase(), controls: el.hasAttribute('controls'), sources: sources.filter(Boolean) };
    }));
  const isUrl = /^https?:\/\//.test(expected);
  const match = found.find((m) => m.sources.some((s) => (isUrl ? s === expected : s.includes(expected))));
  assert.ok(
    match,
    friendly(
      `Expected a <video>/<audio> element playing "${expected}", but found: ${JSON.stringify(found)}.`,
      'Check the episode full content template binds the video component to the media item field_audio references.'
    )
  );
  assert.ok(match.controls, friendly(`The ${match.tag} playing "${expected}" has no controls, so a visitor cannot play it.`));
});

/**
 * Assert the episode page being viewed offers no audio at all: neither an
 * audio player nor a link to an audio file.
 *
 * The Audio field is optional by design, so an episode drafted before its
 * recording exists has to render as a normal page rather than as a broken
 * player.
 *
 * Example #1: Then the podcast episode page should offer no audio
 * Example #2: And the podcast episode page should offer no audio
 * Example #3: Then the podcast episode page should offer no audio
 * Example #4: And the podcast episode page should offer no audio
 * Example #5: Then the podcast episode page should offer no audio
 */
Then(/^the podcast episode page should offer no audio$/, async function () {
  const audio = await this.page.evaluate(() => {
    // Vartheme BS5 has no audio component, so the episode template renders its
    // `video` component as the player: count <video> as well as <audio>.
    const players = document.querySelectorAll('audio, video').length;
    const links = [...document.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => /\.(mp3|m4a|ogg|wav)(\?|$)/i.test(h));
    return { players, links };
  });
  assert.strictEqual(
    audio.players, 0,
    friendly(`Expected no audio player on an episode with no audio, but found ${audio.players}.`)
  );
  assert.strictEqual(
    audio.links.length, 0,
    friendly(`Expected no audio link on an episode with no audio, but found: ${audio.links.join(', ')}.`)
  );
});

// ---------------------------------------------------------------------------
// Usage steps: uploading audio, the player, the sitemap, and cleanup.
// ---------------------------------------------------------------------------

/**
 * Upload an audio file from tests/assets into the open media library, save it
 * as a new Audio media item and insert it into the field.
 *
 * The media library uploads through Dropzone, so the file goes into the
 * Dropzone input rather than a labelled file field. The new media item is
 * remembered so the cleanup hook purges it.
 *
 * Example #1: When I upload the audio file "varbase-example-upload-episode.mp3" to the open media library
 * Example #2: And I upload the audio file "varbase-example-upload-episode.mp3" to the open media library
 * Example #3: When we upload the audio file "varbase-example-upload-episode.mp3" to the open media library
 * Example #4: And we upload the audio file "varbase-example-upload-episode.mp3" to the open media library
 * Example #5: Given I upload the audio file "varbase-example-upload-episode.mp3" to the open media library
 */
When(/^(?:I |we )*upload the audio file "([^"]*)" to the open media library$/, async function (fileName) {
  const path = require('path');
  const budget = budgetOf(this);
  await switchMediaType(this.page, 'Audio', budget);

  const input = this.page.locator('input.dz-hidden-input, .media-library-widget-modal input[type="file"]').last();
  await input.waitFor({ state: 'attached', timeout: 20000 }).catch(() => {
    throw friendly('The open media library offers no upload field for Audio.', 'Check the Audio media type allows uploads from the media library.');
  });
  await input.setInputFiles(path.resolve(this.assetsFolder || 'tests/assets', fileName));

  // Drupal moves the dialog's form buttons into the button pane and hides the
  // originals, so the visible Save is the button pane one.
  const save = this.page.locator('.ui-dialog-buttonpane button').filter({ hasText: /^\s*Save\s*$/ }).first();
  await save.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
    throw friendly(`The media library did not accept "${fileName}".`, 'Check the Audio media type allows this file extension.');
  });
  await save.click();
  await settleForm(this.page, budget);

  const insert = this.page.locator(
    '.ui-dialog-buttonpane button:has-text("Insert selected"), .media-library-widget-modal button:has-text("Insert selected")'
  ).first();
  await insert.waitFor({ state: 'visible', timeout: 30000 });
  await insert.click();
  await this.page.locator(MEDIA_MODAL).first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await settleForm(this.page, budget);

  const mid = await this.page
    .locator('input[name^="field_audio[selection]"][name$="[target_id]"]')
    .first()
    .inputValue()
    .catch(() => null);
  if (!mid) {
    throw friendly(`"${fileName}" was uploaded, but the Audio field shows no selected media item.`);
  }
  trackForCleanup(this, 'media', mid);
});

/**
 * Assert the episode player's audio source answers HTTP 200 with an audio or
 * video content type, so the player a listener sees can actually play.
 *
 * Example #1: Then the episode player should load its audio
 * Example #2: And the episode player should load its audio
 * Example #3: Then the episode player should load its audio
 * Example #4: And the episode player should load its audio
 * Example #5: Then the episode player should load its audio
 */
Then(/^the episode player should load its audio$/, async function () {
  const player = this.page.locator(named(this, 'episode player')).first();
  await player.waitFor({ state: 'attached', timeout: 10000 }).catch(() => {
    throw friendly('The episode page shows no audio player.');
  });
  const src = await player.evaluate((el) => el.currentSrc || el.getAttribute('src') || (el.querySelector('source') || {}).src || '');
  assert.ok(src, friendly('The episode player has no audio source.'));
  const url = new URL(src, this.page.url()).toString();
  const response = await this.page.request.get(url, { headers: { Range: 'bytes=0-1023' } });
  const type = response.headers()['content-type'] || '';
  assert.ok(
    [200, 206].includes(response.status()),
    friendly(`The episode audio "${url}" answered HTTP ${response.status()}.`)
  );
  assert.ok(
    /^(audio|video)\//.test(type),
    friendly(`The episode audio "${url}" is served as "${type}", which a player cannot play.`)
  );
});

/**
 * Assert every control a listener uses to play the episode has an accessible
 * name. Native controls are named by the browser; any control the theme adds
 * around the player (buttons, sliders) must carry its own name.
 *
 * Example #1: Then every episode player control should have an accessible name
 * Example #2: And every episode player control should have an accessible name
 * Example #3: Then every episode player control should have an accessible name
 * Example #4: And every episode player control should have an accessible name
 * Example #5: Then every episode player control should have an accessible name
 */
Then(/^every episode player control should have an accessible name$/, async function () {
  const selector = named(this, 'episode player');
  const report = await this.page.evaluate((sel) => {
    const player = document.querySelector(sel);
    if (!player) return null;
    const scope = player.parentElement || player;
    const unnamed = [...scope.querySelectorAll('button, [role="button"], input, [role="slider"]')]
      .filter((el) => {
        const labelled = el.getAttribute('aria-labelledby');
        const byRef = labelled && labelled.split(/\s+/).some((id) => (document.getElementById(id) || {}).textContent);
        const byLabel = el.id && document.querySelector(`label[for="${el.id}"]`);
        return !(el.getAttribute('aria-label') || el.getAttribute('title') || byRef || byLabel || (el.textContent || '').trim() || el.value);
      })
      .map((el) => el.outerHTML.slice(0, 120));
    return { native: player.hasAttribute('controls'), unnamed };
  }, selector);
  assert.ok(report, friendly('The episode page shows no audio player.'));
  assert.ok(
    report.native || report.unnamed.length === 0,
    friendly('The episode player has neither native controls nor named custom controls.')
  );
  assert.strictEqual(
    report.unnamed.length, 0,
    friendly(`Episode player controls without an accessible name: ${report.unnamed.join(' | ')}`)
  );
});

/**
 * Regenerate the XML sitemap from its admin page and wait for the batch to
 * finish, so the next sitemap check reads fresh content. Needs a user who may
 * administer the sitemap.
 *
 * Example #1: When I regenerate the XML sitemap
 * Example #2: And I regenerate the XML sitemap
 * Example #3: When we regenerate the XML sitemap
 * Example #4: And we regenerate the XML sitemap
 * Example #5: Given I regenerate the XML sitemap
 */
When(/^(?:I |we )*regenerate the XML sitemap$/, async function () {
  const base = this.launchUrl.replace(/\/$/, '');
  await this.page.goto(`${base}/admin/config/search/simplesitemap`, { waitUntil: 'domcontentloaded' });
  const button = this.page.locator('#edit-regenerate-submit');
  if (!(await button.count())) {
    throw friendly('The sitemap admin page offers no "Rebuild queue & generate" button.', 'Log in as a user who may administer the sitemap first.');
  }
  await Promise.all([
    this.page.waitForURL(/\/batch/, { timeout: 15000 }).catch(() => {}),
    button.click(),
  ]);
  await this.page.waitForURL((url) => !/\/batch/.test(url.pathname), { timeout: 120000 });
  await settleForm(this.page, budgetOf(this));
});

/**
 * Purge an entity through the Trash module's purge form, deleting it first
 * when it is not in the trash yet. Missing entities are skipped.
 */
async function purgeEntity(page, base, type, id, budget) {
  const deletePath = type === 'node' ? `/node/${id}/delete` : `/media/${id}/delete`;
  const purgePath = type === 'node' ? `/node/${id}/purge?in_trash=1` : `/media/${id}/edit/purge?in_trash=1`;
  for (const path of [deletePath, purgePath]) {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    // Only ever a podcast, an episode or an audio media item, never other content.
    const forms = type === 'node'
      ? ['node-podcast-delete-form', 'node-podcast-purge-form', 'node-podcast-episode-delete-form', 'node-podcast-episode-purge-form']
      : ['media-audio-delete-form', 'media-audio-purge-form', 'media-remote-audio-delete-form', 'media-remote-audio-purge-form'];
    const submit = page.locator(forms.map((id) => `form#${id} #edit-submit`).join(', ')).first();
    if (await submit.count()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}),
        submit.evaluate((el) => el.click()),
      ]);
    }
  }
}

/**
 * Remove every podcast, episode and media item the scenario created, as the webmaster,
 * whether or not the scenario reached its own delete step. Deleted content
 * goes to the trash on Varbase and keeps its URL alias, so it is purged too:
 * a re-run on the same site then starts from the same state.
 */
After(async function () {
  const created = this.podcastsCreated;
  if (!created || (!created.node.size && !created.media.size) || !this.page) return;
  const webmaster = (this.parameters.users || {}).webmaster;
  if (!webmaster) return;
  const base = this.launchUrl.replace(/\/$/, '');
  const budget = budgetOf(this);
  try {
    await this.context.clearCookies();
    await this.page.goto(`${base}/user/login`, { waitUntil: 'domcontentloaded' });
    await this.page.fill('#edit-name', webmaster.username || 'webmaster');
    await this.page.fill('#edit-pass', webmaster.password);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      this.page.evaluate(() => document.querySelector('#edit-submit').click()),
    ]);
    for (const nid of created.node) await purgeEntity(this.page, base, 'node', nid, budget);
    for (const mid of created.media) await purgeEntity(this.page, base, 'media', mid, budget);
  } catch (error) {
    console.warn(`Podcasts cleanup could not purge everything it created: ${error.message}`);
  }
});

/**
 * Assert the page offers, or does not offer, a "Listen on" link to a URL.
 *
 * Example #1: Then the page should link to "https://open.spotify.com/show/varbase-example-podcast-one"
 * Example #2: And the page should not link to "https://podcasts.apple.com/podcast/varbase-example-podcast-one"
 * Example #3: Then the page should link to "https://open.spotify.com/episode/varbase-example-episode-02"
 * Example #4: And the page should not link to "https://open.spotify.com/show/varbase-example-podcast-one"
 * Example #5: Then the page should link to "https://podcasts.apple.com/podcast/varbase-example-podcast-two"
 */
Then(/^the page should (not )?link to "([^"]*)"$/, async function (not, url) {
  const count = await this.page.locator(`main a[href="${url}"]`).count();
  if (not) {
    assert.strictEqual(count, 0, friendly(`Expected no link to ${url}.`, `Found ${count}.`));
  } else {
    assert.ok(count > 0, friendly(`Expected a link to ${url}.`, 'None was found in the main content.'));
  }
});
