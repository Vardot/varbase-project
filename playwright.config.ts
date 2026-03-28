import type { LaunchOptions, BrowserContextOptions } from 'playwright';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const browser = (process.env.BROWSER || 'chromium') as BrowserName;

const chromiumArgs: string[] = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--ignore-certificate-errors',
  '--disable-extensions',
  '--incognito',
  '--disable-infobars',
  '--start-maximized',
];

interface PlaywrightConfig {
  browser: BrowserName;
  launchOptions: LaunchOptions;
  contextOptions: BrowserContextOptions;
}

const config: PlaywrightConfig = {
  browser,
  launchOptions: {
    headless: false,
    slowMo: 300,
    args: browser === 'chromium' ? chromiumArgs : [],
  },
  contextOptions: {
    viewport: null,
    ignoreHTTPSErrors: true,
  },
};

export = config;
