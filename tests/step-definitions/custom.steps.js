'use strict';

// -----------------------------------------------------------------------------
// Custom step definitions — a starting point for YOUR project.
//
// Developers, QA / QC automation testers and DevOps: add your own project-specific
// varbase-e2e (Playwright + Cucumber-js) step definitions in this file. It is loaded
// automatically by cucumber.js via `tests/step-definitions/**/*.js`, alongside the
// varbase-e2e core steps (which include the Drupal and Varbase packs).
//
// Reuse varbase-e2e's helpers so your steps behave like the built-in ones:
//   - smartSettle : the smart "wait for a quiet edge" used by every navigation
//                   step (DOM ready + network idle + no pending AJAX / timers).
//   - friendly    : tester-friendly error formatting (message + optional hint).
//
//   const { Given, When, Then } = require('@cucumber/cucumber');
//   const { smartSettle, friendly } =
//     require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');
//
// Example — copy, rename and ALTER the expected values to match the site you test:
//
//   Then(/^(?:the page should have|(?:I |we )*should have) a working header$/,
//     async function () {
//       await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);
//       const header = this.page.getByRole('banner').first();
//       const text = (await header.textContent().catch(() => '')) || '';
//       // Check each expected main-menu link on its own line so failures are clear:
//       if (!text.includes('About Us')) throw friendly('Header is missing the "About Us" link.');
//       if (!text.includes('Contact')) throw friendly('Header is missing the "Contact" link.');
//     });
//
// Full, working reference steps ("a working header" / "a working footer") live in
// `varbase.steps.js` — read those for the complete header/footer/menu/social/logo
// pattern and adapt it to your own site.
// -----------------------------------------------------------------------------
