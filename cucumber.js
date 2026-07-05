// cucumber-js configuration for the Varbase webship-js BDD suite.
//
// Drives the whole site through the browser with webship-js (>= 2.0.4).
//   yarn test                # all features (tests/features/**)
//   yarn test:chromium       # force chromium
//   yarn test:headed         # headed debug run
//
// Reports land in tests/reports/. Disable the auto HTML hook with
// WEBSHIP_REPORT_DISABLE=1 and run `yarn generate-reports` in CI instead.

module.exports = {
  default: {
    // Cucumber step timeout must exceed Playwright's default 30s so the
    // try/catch wrappers in the step files surface a friendly Playwright
    // error before cucumber's raw "function timed out".
    timeout: 60000,
    // Retry once. The full Varbase suite drives a single heavy site for ~20
    // minutes; late scenarios occasionally trip a step/assertion timeout
    // purely from cumulative load (not a real defect). One retry absorbs
    // those transient timeouts. Override per run with --retry N.
    retry: 1,
    // tsx/cjs registers a require() hook so cucumber-js loads both `.js`
    // and `.ts` step files with no build step (webship-js 2.0 dropped
    // ts-node in favour of tsx).
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',          // Webship-js core step definitions (auto HTML report on exit; disable: WEBSHIP_REPORT_DISABLE=1).
      // 'node_modules/webship-js/tests/step-definitions-diffy/**/*.js', // Diffy step definitions (optional).
      'tests/step-definitions/**/*.js',                                  // Your custom step definitions.
    ],
    // FEATURES lets CI run one feature folder per job (e.g.
    // FEATURES="tests/features/01-website-base-requirements/**/*.feature");
    // unset locally runs the whole suite.
    paths: [process.env.FEATURES || 'tests/features/varbase/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/' + (process.env.CUCUMBER_JSON || 'cucumber_report') + '.json',
    ],
    formatOptions: {
      // Colour is controlled via FORCE_COLOR (cucumber-js v10+); the old
      // `colorsEnabled` option is gone.
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
        "Editor": {
          "email": "test.editor@vardot.com",
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
        // Per-navigation settle budget. webship-js's `I go to` waits up to this
        // long for the page to reach a quiet edge (DOM ready + network idle),
        // returning as soon as it settles. The full Varbase install is heavy
        // (Gin admin + AI widgets); 8s gives slow admin pages time to render
        // before the next step's fixed 5s `should see` assertion runs.
        page: 8000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        css: {},
        xpath: {},
        filesPath: './tests/selectors/',
        files: ['default-theme.json'],
        offset: 60,
        breakpoints: {
          xs:   { width: 375,  height: 667  },
          sm:   { width: 576,  height: 800  },
          md:   { width: 768,  height: 1024 },
          lg:   { width: 992,  height: 768  },
          xl:   { width: 1200, height: 900  },
          xxl:  { width: 1400, height: 900  },
          xxxl: { width: 1920, height: 1080, default: true },
        },
      },
      screenshot: {
        dir: './tests/screenshots',
        purge: false,
        onFailed: true,
        onEveryStep: false,
        alwaysFullscreen: false,
        failedPrefix: 'failed_',
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
        filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
        infoTypes: '',
      },
      video: {
        // 'off' | 'on' | 'on-failure' | 'tag'. Override per run with WEBSHIP_VIDEO.
        mode: process.env.WEBSHIP_VIDEO || 'on-failure',
        dir: './tests/videos',
        size: { width: 1920, height: 1080 },
        filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
      },
      javascript: {
        // Report collected JavaScript console/page errors at scenario end.
        //   'warn' — log a warning, scenario still passes (default here).
        //   'fail' — fail the scenario (per-scenario via @js-fail).
        //   'off'  — silent.
        // NOTE: do NOT tag scenarios @javascript — in webship-js that tag
        // forces 'fail' mode. The legacy Behat @javascript tags were removed
        // from this suite for that reason.
        mode: process.env.WEBSHIP_JS_ERROR_MODE || 'warn',
        levels: ['error'],
        ignore: '',
        beforeScenario: false,
        afterScenario: true,
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
