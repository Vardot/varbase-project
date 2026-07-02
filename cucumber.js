// cucumber-js configuration for the Varbase 10.1.x webship-js BDD suite.
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
    // Retry once. The full Varbase suite drives a single heavy site for a long
    // time; late scenarios occasionally trip a step/assertion timeout purely
    // from cumulative load (not a real defect). One retry absorbs those
    // transient timeouts. Override per run with --retry N.
    retry: 1,
    // tsx/cjs registers a require() hook so cucumber-js loads both `.js`
    // and `.ts` step files with no build step (webship-js 2.0 dropped
    // ts-node in favour of tsx).
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',          // Webship-js core step definitions (auto HTML report on exit; disable: WEBSHIP_REPORT_DISABLE=1).
      // 'node_modules/webship-js/tests/step-definitions-diffy/**/*.js', // Diffy step definitions (optional).
      'tests/step-definitions/**/*.js',                                  // Varbase + custom step definitions.
    ],
    // FEATURES lets CI run one feature folder per job (e.g.
    // FEATURES="tests/features/varbase/01-website-base-requirements/**/*.feature");
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
      // Per-role testing users. Seeded by the tools/step1-init-tests features
      // (01-create-default-testing-users.feature). Varbase 10.1.x ships the
      // classic profile roles (Editor, Content admin, SEO admin, Site admin,
      // Super admin) plus the Normal authenticated user. `webmaster` is the
      // account created by `drush site:install varbase`.
      users: {
        "webmaster": {
          "username": "webmaster",
          "email": "webmaster@vardot.com",
          "password": "dD.123123ddd"
        },
        "Normal user": {
          "username": "Normal user",
          "email": "test.authenticated@vardot.com",
          "password": "dD.123123ddd"
        },
        "Editor": {
          "username": "Editor",
          "email": "test.editor@vardot.com",
          "password": "dD.123123ddd"
        },
        "Content admin": {
          "username": "Content admin",
          "email": "test.content_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "SEO admin": {
          "username": "SEO admin",
          "email": "test.seo_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "Site admin": {
          "username": "Site admin",
          "email": "test.site_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "Super admin": {
          "username": "Super admin",
          "email": "test.super_admin@vardot.com",
          "password": "dD.123123ddd"
        }
      },
      minWaitTime: {
        // Per-navigation settle budget. webship-js's `I go to` waits up to this
        // long for the page to reach a quiet edge (DOM ready + network idle),
        // returning as soon as it settles. The full Varbase install is heavy
        // (Gin admin); 8s gives slow admin pages time to render before the
        // next step's fixed 5s `should see` assertion runs.
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
        // default-theme.json ships webship-js canonical Drupal/Gin selectors;
        // varbase-selectors.json holds the names ported from the profile's
        // tests/selectors/varbase/*.yml.
        files: ['default-theme.json', 'varbase-selectors.json'],
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
        // from the converted features for that reason.
        mode: process.env.WEBSHIP_JS_ERROR_MODE || 'warn',
        levels: ['error'],
        ignore: '',
        beforeScenario: false,
        afterScenario: true,
      },
    },
  },
};
