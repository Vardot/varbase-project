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

# 2. Initialize testing (applies recipes, adds users, prepares site)
ddev init-full-automated-testing

# 3. Install host dependencies
yarn install
npx playwright install chromium

# 4. Run tests
yarn test:chromium
```

## DDEV Commands

### `ddev init-full-automated-testing` (web command)

Runs inside the DDEV container and handles all site-level preparation:

1. Applies optional Varbase recipes:
   - `varbase_dev_base`
   - `varbase_i18n_base`
   - `varbase_api_base`
   - `varbase_auth_base`
2. Adds testing users (Normal user, Content editor, Content admin, SEO admin, Site admin, Super admin)
3. Disables the antibot module (required for automated browser testing)
4. Disables CSS/JS aggregation
5. Sets verbose error logging
6. Clears the flood table and rebuilds cache

### `ddev add-testing-users` / `ddev delete-testing-users`

Manage testing user accounts individually.

## Running Tests

```bash
# Run all tests with Chromium
yarn test:chromium

# Run all tests with Firefox
yarn test:firefox

# Run all tests with WebKit
yarn test:webkit

# Run a single feature file
BROWSER=chromium node ./node_modules/@cucumber/cucumber/bin/cucumber.js \
  --config cucumber.js \
  tests/features/01-website-base-requirements/01-01-user-registration_only-admins-login.feature

# Run tests by tag
BROWSER=chromium node ./node_modules/@cucumber/cucumber/bin/cucumber.js \
  --config cucumber.js \
  --tags "@check"
```

## Test Structure

```
tests/
  features/
    01-website-base-requirements/   # Registration, roles, input formats
    02-user-management/             # Login, passwords, role assignment
    03-admin-management/            # Admin pages, masquerade, media, JSON:API
    04-content-structure/           # Content type permissions
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
