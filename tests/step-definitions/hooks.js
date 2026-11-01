'use strict';

// Suite-wide hooks for the Varbase functional testing suite.

const { Before, AfterStep } = require('@cucumber/cucumber');

// An inert stand-in, so the editor plugin finds the global it expects.
const STUB = 'window.WEBSPELLCHECKER = window.WEBSPELLCHECKER || { init: function () { return { destroy: function () {} }; } };';

/**
 * Block the WProofreader spell checker the CKEditor 5 Plugin Pack loads on
 * every editor form. It is a third-party service, not a Varbase feature, and
 * its network calls and timers hold every settle on an editor form for seconds.
 */
Before(async function () {
  if (!this.context) return;
  await this.context.route('**://svc.webspellchecker.net/**', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }));
});

/**
 * Discard the Autosave Form "resume your draft" dialog when a node form opens.
 * A retried scenario reopens a form an earlier attempt typed into, and the
 * dialog's overlay would intercept every click on that form.
 */
AfterStep(async function () {
  if (!this.page) return;
  if (!/\/node\/add\/|\/node\/\d+\/edit/.test(this.page.url())) return;
  const dialog = this.page.locator('.ui-dialog.autosave-dialog').first();
  if (!(await dialog.isVisible().catch(() => false))) return;
  const discard = dialog.locator('.ui-dialog-buttonpane button').filter({ hasText: /discard|reject/i }).first();
  if (await discard.count()) {
    await discard.click().catch(() => {});
  } else {
    await dialog.locator('.ui-dialog-titlebar-close').first().click().catch(() => {});
  }
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
});
