'use strict';

// -----------------------------------------------------------------------------
// Custom step definitions for the Varbase Project template.
//
// The "a working header" / "a working footer" steps assert the Varbase main
// navigation, footer menus, social profiles and logos. They are site-specific
// (they name the varbase.com menu items and Vardot's profile URLs), so they
// live here rather than in the shared @vardot/varbase-e2e package. Adapt the
// expected values to your own site when you build on this template.
// -----------------------------------------------------------------------------

const { Then } = require('@cucumber/cucumber');
const {
  smartSettle,
  friendly,
} = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');

/**
 * Verify the page header is "working".
 *
 * On a Varbase site the Main navigation menu is rendered through the Drupal
 * Canvas global Header region, so a working header means those primary links
 * are present. Alter the links below to match your own site's main menu.
 *
 * Example: Then the page should have a working header
 *
 * Example #1: Then the page should have a working header
 * Example #2: And I should have a working header
 * Example #3: Then I should have a working header
 * Example #4: And we should have a working header
 * Example #5: Then the page should have a working header
 */
Then(/^(?:the page should have|(?:I |we )*should have) a working header$/, async function () {
  // Smart-wait for the page to reach a quiet edge before reading the header.
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);

  // `banner` is the ARIA role of the site header (<header role="banner">).
  const header = this.page.getByRole('banner').first();
  const text = (await header.textContent().catch(() => '')) || '';

  // Main navigation menu links expected in the header (one per line):
  if (!text.includes('About Varbase')) throw friendly('Header is missing the "About Varbase" link.', 'Check the Main navigation menu in the Canvas Header region.');
  if (!text.includes('Features')) throw friendly('Header is missing the "Features" link.', 'Check the Main navigation menu in the Canvas Header region.');
  if (!text.includes('Blog')) throw friendly('Header is missing the "Blog" link.', 'Check the Main navigation menu in the Canvas Header region.');
  if (!text.includes('Contact Us')) throw friendly('Header is missing the "Contact Us" link.', 'Check the Main navigation menu in the Canvas Header region.');
});

/**
 * Verify the page footer is "working".
 *
 * On a Varbase site the Secondary, Footer and Social media menus are rendered
 * through the Drupal Canvas global Footer region. A working footer means the
 * footer link text is present, the social profiles are linked, and the credits
 * and logos show. Alter the lines below to match your own site.
 *
 * Example: Then the page should have a working footer
 *
 * Example #1: Then the page should have a working footer
 * Example #2: And I should have a working footer
 * Example #3: Then I should have a working footer
 * Example #4: And we should have a working footer
 * Example #5: Then the page should have a working footer
 */
Then(/^(?:the page should have|(?:I |we )*should have) a working footer$/, async function () {
  // Smart-wait for the page to reach a quiet edge before reading the footer.
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 8000);

  // `contentinfo` is the ARIA role of the site footer (<footer role="contentinfo">).
  // Scope to the role so card/section <footer> elements elsewhere are ignored.
  const footer = this.page.getByRole('contentinfo').first();
  const text = (await footer.textContent().catch(() => '')) || '';

  // Secondary menu (Footer sitemap / Quicklinks) link text (one per line):
  if (!text.includes('Quicklinks')) throw friendly('Footer is missing the "Quicklinks" heading.', 'Check the Secondary menu in the Canvas Footer region.');
  if (!text.includes('Features')) throw friendly('Footer is missing the "Features" link.', 'Check the Secondary menu in the Canvas Footer region.');
  if (!text.includes('About Varbase')) throw friendly('Footer is missing the "About Varbase" link.', 'Check the Secondary menu in the Canvas Footer region.');

  // Footer menu (Support) link text (one per line):
  if (!text.includes('Support')) throw friendly('Footer is missing the "Support" heading.', 'Check the Footer menu in the Canvas Footer region.');
  if (!text.includes('Documentation')) throw friendly('Footer is missing the "Documentation" link.', 'Check the Footer menu in the Canvas Footer region.');
  if (!text.includes('Get Professional Support')) throw friendly('Footer is missing the "Get Professional Support" link.', 'Check the Footer menu in the Canvas Footer region.');
  if (!text.includes('Community Support')) throw friendly('Footer is missing the "Community Support" link.', 'Check the Footer menu in the Canvas Footer region.');

  // Footer credit and legal text (one per line):
  if (!text.includes('Enjoy the free software, or')) throw friendly('Footer is missing the "Enjoy the free software, or get a quote ..." credit.');
  if (!text.includes('get a quote')) throw friendly('Footer is missing the "get a quote" link text.');
  if (!text.includes('Terms and Conditions')) throw friendly('Footer is missing the "Terms and Conditions" link.');
  if (!text.includes('Powered by')) throw friendly('Footer is missing the "Powered by" credit.');

  // Social media menu profiles - full links (one per line):
  if ((await footer.locator('a[href="https://www.linkedin.com/company/vardot"]').count()) === 0) throw friendly('Footer is missing the LinkedIn link (https://www.linkedin.com/company/vardot).', 'Check the Social media menu in the Canvas Footer region.');
  if ((await footer.locator('a[href="https://www.facebook.com/vardotters/"]').count()) === 0) throw friendly('Footer is missing the Facebook link (https://www.facebook.com/vardotters/).', 'Check the Social media menu in the Canvas Footer region.');
  if ((await footer.locator('a[href="https://www.instagram.com/vardotters/"]').count()) === 0) throw friendly('Footer is missing the Instagram link (https://www.instagram.com/vardotters/).', 'Check the Social media menu in the Canvas Footer region.');
  if ((await footer.locator('a[href="https://x.com/Vardot"]').count()) === 0) throw friendly('Footer is missing the X link (https://x.com/Vardot).', 'Check the Social media menu in the Canvas Footer region.');

  // Footer logos (one per line):
  if ((await footer.locator('img[alt="Varbase logo"]').count()) === 0) throw friendly('Footer is missing the Varbase logo.');
  if ((await footer.locator('img[alt="Vardot"]').count()) === 0) throw friendly('Footer is missing the Vardot logo next to "Powered by".');
});
