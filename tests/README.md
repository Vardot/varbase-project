# Varbase Automated Testing

Automated functional acceptance testing for Varbase using
[Playwright](https://playwright.dev/), [Cucumber-JS](https://github.com/cucumber/cucumber-js),
and [Webship-js](https://github.com/webship/webship-js).

Moving with modern automated functional testing setup for end-to-end testing.

> **[Playwright](https://playwright.dev/)** enables reliable end-to-end testing for modern web apps.
> It bundles test runner, assertions, isolation, parallelization and rich tooling.
> Playwright supports Chromium, WebKit and Firefox on Windows, Linux and macOS,
> locally or in CI, headless or headed, with native mobile emulation for
> Chrome (Android) and Mobile Safari.

> **[Cucumber-JS](https://github.com/cucumber/cucumber-js)** is a tool for running automated tests
> written in plain language. Because they're written in plain language, they can be read by anyone
> on your team. Because they can be read by anyone, you can use them to help improve communication,
> collaboration and trust on your team.
> Supports [Behaviour-Driven Development (BDD)](https://cucumber.io/docs/bdd/).

> **[Webship-js](https://github.com/webship/webship-js)** is an **Automated Functional Acceptance Testing** tool.
> Helps to ease and speed the work with end-to-end testing features in web apps or projects.
> Utilizing Playwright and Cucumber-js.
> [Having custom and advanced general step definitions](https://webship.co/docs/webship-js/2.0.x/step-definitions)
> with Drupal Core and Drupal CMS context in mind.

### Summary

- Add automated functional testing support using **Playwright**, **Cucumber-JS**, and **Webship-js**.
- Provide custom and advanced Drupal CMS general step definitions.
- Enable readable, maintainable end-to-end test scenarios.
- Run tests as part of the CI pipeline on each merge request and build.

---

## Prerequisites

- [DDEV](https://ddev.readthedocs.io/) local development environment
- Node.js >= 20
- Yarn 4 (enabled via corepack)

## Quick Start (Fresh Build)

```bash
# 1. Start a fresh Varbase site
ddev delete -y -O && ddev start
# Do not apply, if DDEV is already started.

# 2. Install Varbase and initialize testing
ddev init-full-automated-testing

# 3. Run tests
ddev yarn test:chromium
```

## Quick Start (Already Installed Site)

```bash
# 1. Initialize testing on an existing site (adds users, prepares settings)
ddev init-minimal-automated-testing

# 2. Run tests
ddev yarn test:chromium
```

## DDEV Commands

### `ddev install-varbase` (web command)

Installs Varbase from scratch using `drush site:install varbase` with the Varbase profile and Drupal recipes.

```bash
# Minimal install: core Varbase only (no extra recipes)
ddev install-varbase minimal

# Full install: core + dev, i18n, api, auth recipes + social auth modules
ddev install-varbase full
```

- Generates a random password for the webmaster account
- Displays the login credentials on completion

### `ddev init-full-automated-testing` (web command)

Full initialization for automated testing. Handles everything from a fresh `ddev start`:

1. **Installs Varbase** if the database is empty (runs `drush site:install varbase`)
2. Applies optional Varbase recipes:
   - `varbase_dev_base`
   - `varbase_i18n_base`
   - `varbase_api_base`
   - `varbase_auth_base`
3. Enables social auth modules (`social_auth_facebook`, `social_auth_linkedin`)
4. Adds testing users (Normal user, Content editor, Content admin, SEO admin, Site admin, Super admin)
5. Disables the antibot module (required for automated browser testing)
6. Disables CSS/JS aggregation
7. Sets verbose error logging
8. Clears the flood table and rebuilds cache

### `ddev init-minimal-automated-testing` (web command)

Minimal initialization for automated testing on an **already installed** site.
Does not install Varbase or apply recipes -- only prepares the site for testing:

1. Verifies Drupal is installed (exits with error if not)
2. Adds testing users (Normal user, Content editor, Content admin, SEO admin, Site admin, Super admin)
3. Disables the antibot module
4. Disables CSS/JS aggregation
5. Sets verbose error logging
6. Clears the flood table and rebuilds cache

### `ddev add-testing-users` / `ddev delete-testing-users`

Manage testing user accounts individually.

## Running Tests

```bash
# Run all tests (default: Chromium)
LAUNCH_URL=https://VARBASE_PROJECT.ddev.site yarn test

# Run all tests with Chromium
LAUNCH_URL=https://VARBASE_PROJECT.ddev.site yarn test:chromium

# Run all tests with Firefox
LAUNCH_URL=https://VARBASE_PROJECT.ddev.site yarn test:firefox

# Run all tests with WebKit
LAUNCH_URL=https://VARBASE_PROJECT.ddev.site yarn test:webkit

# Run specific scenarios by name (regex filter)
LAUNCH_URL=https://VARBASE_PROJECT.ddev.site BROWSER=chromium \
  cucumber-js --config cucumber.js --name "Canvas editor"

# Run tests by tag
LAUNCH_URL=https://VARBASE_PROJECT.ddev.site BROWSER=chromium \
  cucumber-js --config cucumber.js --tags "@check"
```

## Generating Reports

After a test run, an HTML report is auto-generated from `tests/reports/cucumber_report.json`.
To generate it manually:

```bash
yarn generate-reports
```

The report opens from `tests/reports/cucumber_report.html`.

To disable the auto-generated report on exit, set:

```bash
WEBSHIP_REPORT_DISABLE=1 yarn test:chromium
```

## Screenshots

Screenshots are saved to the `screenshots/` directory.

- **On failure** (default): captured automatically when a step fails, prefixed with `failed_`.
- **On every step**: set `onEveryStep: true` in `cucumber.js` worldParameters.
- **Filename pattern**: `{datetime}.{feature_file}.feature_{step_line}.{ext}`

Configure in `cucumber.js` under `worldParameters.screenshot`:

| Option              | Default    | Description                                  |
|---------------------|------------|----------------------------------------------|
| `dir`               | `./screenshots` | Directory to save screenshots           |
| `purge`             | `false`    | Delete all screenshots before each run       |
| `onFailed`          | `true`     | Capture screenshot on step failure           |
| `onEveryStep`       | `false`    | Capture screenshot after every step          |
| `alwaysFullscreen`  | `false`    | Always capture full-page screenshots         |
| `failedPrefix`      | `failed_`  | Prefix for failed screenshot filenames       |

## Diffy Visual Regression (Optional)

[Diffy](https://diffy.website) enables visual regression testing by comparing screenshots across environments.

Enable by setting environment variables:

```bash
export DIFFY_API_KEY=your-api-key
export DIFFY_PROJECT_ID=your-project-id
```

Then enable the Diffy step definitions in `cucumber.js`:

```js
'node_modules/webship-js/tests/step-definitions-diffy/**/*.js',
```

| Variable               | Default                          | Description                        |
|------------------------|----------------------------------|------------------------------------|
| `DIFFY_API_KEY`        | _(required)_                     | Your Diffy API key                 |
| `DIFFY_PROJECT_ID`     | _(required)_                     | Your Diffy project ID              |
| `DIFFY_BREAKPOINTS`    | `640,1200`                       | Comma-separated breakpoint widths  |
| `DIFFY_WINDOW_HEIGHT`  | `2000`                           | Browser window height for captures |
| `DIFFY_ENV1_URL`       | —                                | First environment URL              |
| `DIFFY_ENV2_URL`       | —                                | Second environment URL             |
| `DIFFY_MAX_WAIT`       | `30`                             | Max seconds to wait for Diffy      |
| `DIFFY_API_BASE_URL`   | `https://app.diffy.website/api/` | Diffy API base URL                 |

## Test Structure

```
tests/
  features/
    01-website-base-requirements/   # Registration, roles, input formats, languages, accessibility
    02-user-management/             # Login, passwords, role assignment, login redirect
    03-admin-management/            # Admin pages, masquerade, media, JSON:API
    04-content-structure/           # Content types, Canvas pages, blog, homepage, contact us, Canvas editor, breadcrumbs
    05-content-management/          # Entityqueues, media library, content workflows, scheduling, cloning, linking, trash
  reports/                          # Generated test reports (cucumber_report.json, cucumber_report.html)
  selectors/                        # Custom CSS/XPath selector files
  step-definitions/
    varbase-step-definitions.js     # Varbase-specific step definitions
    custom.js                       # Project-specific custom step definitions
```

Step definitions from [Webship-js](https://github.com/webship/webship-js) are loaded automatically from `node_modules/webship-js/tests/step-definitions/`.

## Configuration

- **`cucumber.js`** — Cucumber configuration, user credentials, world parameters (selectors, screenshot, diffy)
- **`playwright.config.ts`** — Browser launch options (headless mode, viewport, slowMo)
- **`tsconfig.json`** — TypeScript config (Storybook + ts-node/CommonJS override for tests)

## Testing Users

| Username        | Email                          | Role            |
|-----------------|--------------------------------|-----------------|
| webmaster       | webmaster@vardot.com           | administrator   |
| Normal user     | test.authenticated@vardot.com  | (authenticated) |
| Content editor  | test.content_editor@vardot.com | content_editor  |
| Content admin   | test.content_admin@vardot.com  | content_admin   |
| SEO admin       | test.seo_admin@vardot.com      | seo_admin       |
| Site admin      | test.site_admin@vardot.com     | site_admin      |
| Super admin     | test.super_admin@vardot.com    | administrator   |

All test user passwords: `dD.123123ddd`
