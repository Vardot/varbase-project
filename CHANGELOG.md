# 10.1.1

### Changed since [10.1.0](https://www.drupal.org/project/varbase_project/releases/10.1.0):
* [#3568553](https://www.drupal.org/i/3568553) chore: Switch default Composer Patches to `~2.0` in the root composer.json file

### Fixes since [10.1.0](https://www.drupal.org/project/varbase_project/releases/10.1.0):
* [#3589364](https://www.drupal.org/i/3589364) fix: Prevent Drupal dependencies from automatically applying patches in Varbase Project Template
* [#3589529](https://www.drupal.org/i/3589529) fix: Remove custom Drupal scaffold file mappings for default settings files in Varbase Project template
* [#3608512](https://www.drupal.org/i/3608512) fix: Allow the `symfony/runtime` Composer plugin; fresh builds fail with PluginBlockedException on Drupal 11.4
