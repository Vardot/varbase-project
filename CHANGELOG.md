# 11.0.8

Ships [Varbase 11.0.0](https://www.drupal.org/project/varbase/releases/11.0.0) on Drupal core 11.4.6, with the Varbase Starter site template at 1.0.2.

### Changed since [11.0.7](https://www.drupal.org/project/varbase_project/releases/11.0.7):
* task: Update **Varbase Starter** to 1.0.2, **Varbase Admin Base** to 1.0.2 and `vardot/varbase-patches` to 11.0.43.
* task: Update **Drupal Canvas** to 1.11.0, **Drush** to 13.8.0, **AI Integration ECA** to 1.0.0, the **Amazee.io AI provider** to 1.4.3 and **Drupal CMS Content Type Base** to 2.1.5.
* chore: Require the released `vardot/varbase: ~11.0.0` and `vardot/varbase-patches: ~11.0.0` lines (were `11.0.x-dev`).

### Fixed since [11.0.7](https://www.drupal.org/project/varbase_project/releases/11.0.7):
* ci: Do not run the `Create reports` job when the Varbase functional testing matrix did not run, so a release tag can no longer publish an acceptance testing report with no test results behind it.

# 11.0.7

Ships [Varbase 11.0.0](https://www.drupal.org/project/varbase/releases/11.0.0), the first stable release of the 11.0.x line, and the three site templates at 1.0.1.

### Changed since [11.0.6](https://www.drupal.org/project/varbase_project/releases/11.0.6):
* [#3620350](https://www.drupal.org/i/3620350) feat: Install the front-end libraries with Composer from Packagist instead of the `drupal-libraries-sync` script.
* [#3621020](https://www.drupal.org/i/3621020) feat: Add the **Varbase Dev Base** recipe to the template.
* [#3621338](https://www.drupal.org/i/3621338) task: Require the AI, API, authentication and multilingual base recipes so the site templates could drop them, then stop requiring them once `vardot/varbase` took them on.
* [#3621398](https://www.drupal.org/i/3621398) task: Update `@vardot/varbase-e2e` to `^2.0.4`.
* chore: Require the released `vardot/varbase: ~11.0.0` and `vardot/varbase-patches: ~11.0.0` lines (were `11.0.x-dev`).

### Added since [11.0.6](https://www.drupal.org/project/varbase_project/releases/11.0.6):
* [#3618330](https://www.drupal.org/i/3618330) test: Add functional testing coverage for the **Varbase Internationalization Base** recipe behaviour.
* [#3621204](https://www.drupal.org/i/3621204) test: Name the colour contrast and top-level heading accessibility rules in the home page regression scenarios, with an explicit single-h1 assertion.

### Fixed since [11.0.6](https://www.drupal.org/project/varbase_project/releases/11.0.6):
* [#3621552](https://www.drupal.org/i/3621552) fix: Temporarily remove the Entity Clone functional testing coverage, which fails now that the module is not installed. It returns when Entity Clone has a stable release.

# 11.0.6

### Added since [11.0.5](https://www.drupal.org/project/varbase_project/releases/11.0.5):
* [#3612488](https://www.drupal.org/i/3612488) test: Add functional tests for the ECA **Workflow Modeler**.
* [#3617486](https://www.drupal.org/i/3617486) test: Add functional testing coverage for the header search and the search results page.
* [#3614575](https://www.drupal.org/i/3614575) task: Add the default `.gitlab` and `.github` issue and merge request templates.

### Changed since [11.0.5](https://www.drupal.org/project/varbase_project/releases/11.0.5):
* [#3615708](https://www.drupal.org/i/3615708) task: Switch the Varbase functional testing suite to **Varbase E2E**, and update `@vardot/varbase-e2e` to the latest 2.x.
* [#3616266](https://www.drupal.org/i/3616266) perf: Reuse the installed build cache in the parallel test jobs.
* [#3616266](https://www.drupal.org/i/3616266) fix: Show only the Feature / Scenario / Step output in the 11.0.x CI test logs.

# 11.0.5

### Fixed since [11.0.4](https://www.drupal.org/project/varbase_project/releases/11.0.4):
* [#3611907](https://www.drupal.org/i/3611907) fix: A fresh `composer create-project` / `composer install` no longer aborts on a broken third-party dependency-declared patch. The release ships a committed `composer.lock` and `patches.lock.json`, so installs run deterministically from the lock (the solver is skipped), and `extra.composer-patches.ignore-dependency-patches` keeps the broken `drupal/*` dependency-declared patches out of `patches.lock.json`.
* [#3611907](https://www.drupal.org/i/3611907) fix: Removed `mglaman/composer-drupal-lenient` from `composer.json` and `.gitlab-ci.yml` — no longer needed now that Varbase Editor Base requires the `vardot/ckeditor_media_resize` fork (2.0.0), which `replace`s `drupal/ckeditor_media_resize` and supports Drupal core `~11.4`, so dependency resolution no longer needs a lenient override.

# 11.0.4

### Changed since [11.0.3](https://www.drupal.org/project/varbase_project/releases/11.0.3):
* [#3611395](https://www.drupal.org/i/3611395) task: Update Drupal Core to 11.4.4 on the 11.0.x branch
* chore: Require the released `vardot/varbase: ~11.0.0` and `vardot/varbase-patches: ~11.0.0` lines (were `11.0.x-dev`)

### Security
This release updates Drupal core to [11.4.4](https://www.drupal.org/project/drupal/releases/11.4.4) (released 15 Jul 2026), covering:
* [SA-CORE-2026-010](https://www.drupal.org/sa-core-2026-010) Drupal core - Moderately critical - Information disclosure
* [SA-CORE-2026-011](https://www.drupal.org/sa-core-2026-011) Drupal core - Moderately critical - Cross-site scripting
* [SA-CORE-2026-012](https://www.drupal.org/sa-core-2026-012) Drupal core - Moderately critical - Cross-site scripting
