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
