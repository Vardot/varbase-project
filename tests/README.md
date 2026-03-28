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

# 2. Install Varbase and initialize testing
ddev init-full-automated-testing

# 3. Install host dependencies
yarn install
npx playwright install chromium

# 4. Run tests
LAUNCH_URL=https://vp.ddev.site:8443 yarn test:chromium
```

## Quick Start (Already Installed Site)

```bash
# 1. Initialize testing on an existing site (adds users, prepares settings)
ddev init-minimal-automated-testing

# 2. Install host dependencies
yarn install
npx playwright install chromium

# 3. Run tests
LAUNCH_URL=https://vp.ddev.site:8443 yarn test:chromium
```

## DDEV Commands

### `ddev install-varbase` (web command)

Installs Varbase from scratch using `drush site:install` with the Varbase profile and Drupal recipes.

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

All test commands require `LAUNCH_URL` to point to the DDEV site:

```bash
# Run all tests with Chromium
LAUNCH_URL=https://vp.ddev.site:8443 yarn test:chromium

# Run all tests with Firefox
LAUNCH_URL=https://vp.ddev.site:8443 yarn test:firefox

# Run all tests with WebKit
LAUNCH_URL=https://vp.ddev.site:8443 yarn test:webkit

# Run specific scenarios by name (regex filter)
LAUNCH_URL=https://vp.ddev.site:8443 BROWSER=chromium \
  node ./node_modules/@cucumber/cucumber/bin/cucumber.js \
  --config cucumber.js --name "Canvas editor"

# Run tests by tag
LAUNCH_URL=https://vp.ddev.site:8443 BROWSER=chromium \
  node ./node_modules/@cucumber/cucumber/bin/cucumber.js \
  --config cucumber.js --tags "@check"
```

## Test Structure

```
tests/
  features/
    01-website-base-requirements/   # Registration, roles, input formats, languages, accessibility
    02-user-management/             # Login, passwords, role assignment, login redirect
    03-admin-management/            # Admin pages, masquerade, media, JSON:API
    04-content-structure/           # Content types, Canvas pages, blog, homepage, contact us, Canvas editor, breadcrumbs
    05-content-management/          # Entityqueues, media library, content workflows, scheduling, cloning, linking, trash
  step-definitions/
    varbase-step-definitions.js     # Varbase-specific step definitions
```

Step definitions from [Webship-js](https://github.com/webship/webship-js) are loaded automatically from `node_modules/webship-js/tests/step-definitions/`.

## Configuration

- **`cucumber.js`** -- Cucumber configuration, user credentials, and world parameters
- **`playwright.config.ts`** -- Browser launch options (headless mode, viewport, slowMo)

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
