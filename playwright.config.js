/** @type {{ browser: string, launchOptions: import('playwright').LaunchOptions, contextOptions: import('playwright').BrowserContextOptions }} */
const browser = process.env.BROWSER || 'chromium';

// Full-HD window so the admin UI, the Drupal Canvas editor (which refuses to
// render below 1024px wide) and the recorded video all use the same correct
// size. This matches video.size (1920x1080) in cucumber.js.
const chromiumArgs = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--ignore-certificate-errors',
  '--disable-extensions',
  '--incognito',
  '--disable-infobars',
  '--window-size=1920,1080',
  '--force-device-scale-factor=1',
  '--disable-gpu',
  '--allow-insecure-localhost',
  '--no-first-run',
];

const config = {
  browser,
  launchOptions: {
    headless: true,
    slowMo: 400,
    args: browser === 'chromium' ? chromiumArgs : [],
  },
  contextOptions: {
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },
};

module.exports = config;
