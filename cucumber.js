module.exports = {
  default: {
    timeout: 40000,
    requireModule: ['ts-node/register'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',          // Webship-js core step definitions (auto HTML report on exit; disable: WEBSHIP_REPORT_DISABLE=1).
      // 'node_modules/webship-js/tests/step-definitions-diffy/**/*.js', // Diffy step definitions (optional).
      'tests/step-definitions/**/*.js',                                  // Your custom step definitions.
    ],
    paths: ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      colorsEnabled: true,
      theme: {
        'feature keyword': ['bold', 'blue'],
        'feature name': ['blue', 'underline'],
        'feature description': ['blueBright'],
        'scenario keyword': ['bold', 'magenta'],
        'scenario name': ['magenta', 'underline'],
        'step keyword': ['bold', 'green'],
        'step text': ['greenBright', 'italic'],
      },
    },
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || process.env.DDEV_PRIMARY_URL || 'https://localhost',
      users: {
        "webmaster": {
          "username": "webmaster",
          "email": "webmaster@vardot.com",
          "password": "dD.123123ddd"
        },
        "Normal user": {
          "email": "test.authenticated@vardot.com",
          "password": "dD.123123ddd"
        },
        "Content editor": {
          "email": "test.content_editor@vardot.com",
          "password": "dD.123123ddd"
        },
        "Content admin": {
          "email": "test.content_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "SEO admin": {
          "email": "test.seo_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "Site admin": {
          "email": "test.site_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "Super admin": {
          "email": "test.super_admin@vardot.com",
          "password": "dD.123123ddd"
        }
      },
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        css: {},
        xpath: {},
        filesPath: './tests/selectors/',
        files: [],
        offset: 60,
        breakpoints: {
          xs:   { width: 375,  height: 667  },
          sm:   { width: 576,  height: 800  },
          md:   { width: 768,  height: 1024 },
          lg:   { width: 992,  height: 768  },
          xl:   { width: 1200, height: 900, default: true },
          xxl:  { width: 1400, height: 900  },
          xxxl: { width: 1920, height: 1080 },
        },
      },
      screenshot: {
        dir: './screenshots',
        purge: false,
        onFailed: true,
        onEveryStep: false,
        alwaysFullscreen: false,
        failedPrefix: 'failed_',
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
        filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
        infoTypes: '',
      },
      // diffy: {
      //   apiKey: process.env.DIFFY_API_KEY || '',
      //   projectId: parseInt(process.env.DIFFY_PROJECT_ID || '0', 10),
      //   breakpoints: process.env.DIFFY_BREAKPOINTS || '640,1200',
      //   windowHeight: parseInt(process.env.DIFFY_WINDOW_HEIGHT || '2000', 10),
      //   screenshotsDir: process.env.DIFFY_SCREENSHOTS_DIR || '',
      //   baseUrl: process.env.DIFFY_API_BASE_URL || 'https://app.diffy.website/api/',
      //   maxWait: parseInt(process.env.DIFFY_MAX_WAIT || '30', 10),
      //   env1Url: process.env.DIFFY_ENV1_URL || '',
      //   env2Url: process.env.DIFFY_ENV2_URL || '',
      // }
    },
  },
};
