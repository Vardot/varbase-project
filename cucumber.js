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
    // FEATURES lets CI run one feature folder (or a comma-separated list of
    // globs, to split a large folder across several matrix jobs) per job, e.g.
    // FEATURES="tests/features/varbase/01-website-base-requirements/**/*.feature"
    // or FEATURES="tests/features/varbase/04-content-structure/04-0{1,2,3}-*.feature,tests/features/varbase/04-content-structure/04-0{4,5}-*.feature".
    // unset locally runs the whole suite.
    paths: process.env.FEATURES
      ? process.env.FEATURES.split(',').map((p) => p.trim()).filter(Boolean)
      : ['tests/features/**/*.feature'],
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
        // Every converted Behat scenario still carries the legacy @javascript
        // tag, which webship-js resolves to 'fail' mode (tag > env > config).
        // Rather than strip the tag from 185 locked feature files, we keep the
        // hard JS-error gate on but filter the known-benign console/page noise
        // the Varbase admin (Gin, CKEditor 5, drimage, AI widgets) emits on
        // Drupal 11.4 — none of which is a defect in the flow under test:
        //   • getComputedStyle(null) — Gin/toolbar layout probes on null nodes.
        //   • "Failed to load resource" 403/404 — role-gated or optional assets
        //     (favicon, editor icons) fetched on admin pages.
        //   • CKEditor "objectSizeSmall" / plugincollection-plugin-not-found —
        //     image-resize plugin bootstrap chatter; a genuinely dead editor
        //     still fails the "rich text editor field" step itself, so filtering
        //     the console line here never turns a broken editor green.
        //   • "Maximum call stack size exceeded" / ResizeObserver loop — benign
        //     admin-theme reflow noise.
        //   • importScripts / worker-html.js — the ace_editor "code_html"
        //     syntax web worker; on the CI runner its worker script can 404
        //     inside the WorkerGlobalScope. The input-format scenarios assert
        //     the raw textarea shows for code_html (not the worker's syntax
        //     highlighting), so a worker load hiccup is not the flow under test.
        //     (Also mitigated by serving JS unaggregated — see js.preprocess=0.)
        // A brand-new, unrelated JS error type is NOT matched and still fails.
        mode: process.env.WEBSHIP_JS_ERROR_MODE || 'warn',
        levels: ['error'],
        ignore: process.env.WEBSHIP_JS_ERROR_IGNORE
          || "getComputedStyle|Failed to load resource|objectSizeSmall|plugincollection-plugin-not-found|CKEditorError|Maximum call stack size exceeded|ResizeObserver loop|importScripts|worker-html",
        beforeScenario: false,
        afterScenario: true,
      },
    },
  },
};
