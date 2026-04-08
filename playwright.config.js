/** @type {{ browser: string, launchOptions: import('playwright').LaunchOptions, contextOptions: import('playwright').BrowserContextOptions }} */
const config = {
  browser: process.env.BROWSER || 'chromium',
  launchOptions: {
    headless: true,
    slowMo: 400,
    args: (process.env.BROWSER || 'chromium') === 'chromium' ? [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--ignore-certificate-errors',
      '--disable-extensions',
      '--incognito',
      '--disable-infobars',
      '--start-maximized',
      '--disable-gpu',
      '--allow-insecure-localhost',
      '--no-first-run',
    ] : [],
  },
  contextOptions: {
    viewport: null,
    ignoreHTTPSErrors: true,
  },
};

module.exports = config;
