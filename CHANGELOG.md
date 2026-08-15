# 10.1.4

### Changed since [10.1.3](https://www.drupal.org/project/varbase_project/releases/10.1.3):
* [#3614575](https://www.drupal.org/i/3614575) task: Add the default `.gitlab` and `.github` issue and merge/pull request templates
* [#3615711](https://www.drupal.org/i/3615711) task: Switch the Varbase functional testing suite to Varbase E2E (Playwright + Cucumber-js)
* [#3616266](https://www.drupal.org/i/3616266) perf: Reduce CI usage — reuse the installed build in the parallel test jobs instead of rebuilding
* Require released `vardot/varbase: ~10.1.0` (10.1.2) and `vardot/varbase-patches: ~10.1.0` (10.1.88)
* Track `composer.lock` and `patches.lock.json` for this release

# 10.1.3

### Changed since [10.1.2](https://www.drupal.org/project/varbase_project/releases/10.1.2):
* [#3612207](https://www.drupal.org/i/3612207) fix: Remove `mglaman/composer-drupal-lenient`; Varbase Editor now resolves CKEditor Media Resize via the `vardot/ckeditor_media_resize` 2.0.0 fork
* Track `composer.lock` and `patches.lock.json` for this release

# 10.1.2

### Changed since [10.1.1](https://www.drupal.org/project/varbase_project/releases/10.1.1):
* Update Drupal core to [11.4.4](https://www.drupal.org/project/drupal/releases/11.4.4) ([SA-CORE-2026-010](https://www.drupal.org/sa-core-2026-010), [SA-CORE-2026-011](https://www.drupal.org/sa-core-2026-011), [SA-CORE-2026-012](https://www.drupal.org/sa-core-2026-012)) [[#3611368](https://www.drupal.org/i/3611368)]
* Require released `vardot/varbase: ~10.1.0` and `vardot/varbase-patches: ~10.1.0`
* Track `composer.lock` and `patches.lock.json`

### Fixes since [10.1.1](https://www.drupal.org/project/varbase_project/releases/10.1.1):
* [#3611408](https://www.drupal.org/i/3611408) fix: Regenerate `composer.lock` and `patches.lock.json` against `vardot/varbase-patches: 10.1.82`, so a fresh install picks up the [CKEditor Media Resize Drupal 11.4 compatibility patch](https://www.drupal.org/node/3607786) and no longer hits `MissingDependencyException: module 'ckeditor_media_resize' is incompatible with this version of Drupal core`

# 10.1.1

### Changed since [10.1.0](https://www.drupal.org/project/varbase_project/releases/10.1.0):
* [#3568553](https://www.drupal.org/i/3568553) chore: Switch default Composer Patches to `~2.0` in the root composer.json file

### Fixes since [10.1.0](https://www.drupal.org/project/varbase_project/releases/10.1.0):
* [#3589364](https://www.drupal.org/i/3589364) fix: Prevent Drupal dependencies from automatically applying patches in Varbase Project Template
* [#3589529](https://www.drupal.org/i/3589529) fix: Remove custom Drupal scaffold file mappings for default settings files in Varbase Project template
* [#3608512](https://www.drupal.org/i/3608512) fix: Allow the `symfony/runtime` Composer plugin; fresh builds fail with PluginBlockedException on Drupal 11.4
