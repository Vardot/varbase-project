// cucumber-js configuration for the Varbase varbase-e2e BDD suite.
//
// Drives the whole site through the browser with varbase-e2e (>= 2.0.4).
//   yarn test                # all features (tests/features/**)
//   yarn test:chromium       # force chromium
//   yarn test:headed         # headed debug run
//
// Reports land in tests/reports/. Disable the auto HTML hook with
// VARBASE_E2E_REPORT_DISABLE=1 and run `yarn generate-reports` in CI instead.

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
    // and `.ts` step files with no build step (varbase-e2e 2.0 dropped
    // ts-node in favour of tsx).
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/@vardot/varbase-e2e/tests/step-definitions/**/*.js',          // Varbase E2E core step definitions (auto HTML report on exit; disable: VARBASE_E2E_REPORT_DISABLE=1).
      'tests/step-definitions/**/*.js',                                  // Your custom step definitions.
    ],
    // FEATURES lets CI run one feature folder per job (e.g.
    // FEATURES="tests/features/01-website-base-requirements/**/*.feature");
    // unset locally runs the whole suite.
    paths: [process.env.FEATURES || 'tests/features/**/*.feature'],
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
        // Per-navigation settle budget. varbase-e2e's `I go to` waits up to this
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
        // 'off' | 'on' | 'on-failure' | 'tag'. Override per run with VARBASE_E2E_VIDEO.
        mode: process.env.VARBASE_E2E_VIDEO || 'on-failure',
        dir: './tests/videos',
        size: { width: 1920, height: 1080 },
        filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
      },
      javascript: {
        // Report collected JavaScript console/page errors at scenario end.
        //   'warn' — log a warning, scenario still passes (default here).
        //   'fail' — fail the scenario (per-scenario via @js-fail).
        //   'off'  — silent.
        // NOTE: do NOT tag scenarios @javascript — in varbase-e2e that tag
        // forces 'fail' mode. The legacy Behat @javascript tags were removed
        // from this suite for that reason.
        mode: process.env.VARBASE_E2E_JS_ERROR_MODE || 'warn',
        levels: ['error'],
        // Filter the known-benign console/page noise the Varbase admin (Gin,
        // CKEditor 5, drimage, AI widgets) and the CI runner emit - missing
        // optional assets, aborted preloads, editor plugin chatter. Without
        // this every scenario prints a 10-20 line error block that buries the
        // Feature / Scenario / Step output. Genuine JavaScript errors are still
        // reported; override with VARBASE_E2E_JS_ERROR_IGNORE.
        ignore: process.env.VARBASE_E2E_JS_ERROR_IGNORE
          || "getComputedStyle|Failed to load resource|objectSizeSmall|plugincollection-plugin-not-found|CKEditorError|Maximum call stack size exceeded|ResizeObserver loop|importScripts|worker-html",
        beforeScenario: false,
        afterScenario: true,
      },
    },
  },
};
