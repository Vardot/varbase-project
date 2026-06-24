/**
 * Storybook page smoke check (real browser).
 *
 * Loads a running Storybook in headless Chromium and asserts that the app
 * actually boots and a story renders inside the preview iframe - i.e. the
 * Storybook PAGE works, not just that index.json is served.
 *
 * Uses the "Getting Started / Welcome" story, which is static (no Drupal render
 * backend needed), so it renders even in a CI job that has no running Drupal.
 *
 * Env:
 *   SB_URL    Storybook base URL   (default http://127.0.0.1:6006)
 *   SB_STORY  Story id to open     (default getting-started-welcome--welcome)
 *
 * Exit code 0 = page rendered, 1 = failed.
 */
import { chromium } from 'playwright';

const URL = process.env.SB_URL || 'http://127.0.0.1:6006';
const STORY = process.env.SB_STORY || 'getting-started-welcome--welcome';

const browser = await chromium.launch();
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

let text = '';
try {
  await page.goto(`${URL}/?path=/story/${STORY}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for the preview iframe to render visible content.
  for (let i = 0; i < 30; i++) {
    try {
      const body = page.frameLocator('#storybook-preview-iframe').locator('body');
      text = (await body.innerText({ timeout: 2000 })).trim();
    } catch { /* iframe not ready yet */ }
    if (text) break;
    await page.waitForTimeout(2000);
  }
} finally {
  await browser.close();
}

if (!text) {
  console.error(`FAIL: Storybook page did not render story "${STORY}" at ${URL}`);
  if (consoleErrors.length) console.error('Console errors:\n  ' + consoleErrors.slice(0, 8).join('\n  '));
  process.exit(1);
}

console.log(`OK: Storybook page rendered story "${STORY}".`);
console.log('Preview text starts: ' + text.slice(0, 80).replace(/\s+/g, ' '));
process.exit(0);
