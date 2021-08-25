[![Vardot](https://circleci.com/gh/Vardot/varbase/tree/9.0.x.svg?style=shield)](https://app.circleci.com/pipelines/github/Vardot/varbase/360/workflows/a7b6d975-14cb-458a-8b79-8d347a37e072) Varbase 9.0.1

[![](https://www.drupal.org/files/styles/grid-3/public/project-images/Medium-Logo%20Color%20with%20padding.png)](http://www.drupal.org/project/varbase)

# Varbase Project

Project template for [Varbase distribution](http://www.drupal.org/project/varbase).

## Create a Varbase project with [Composer](https://getcomposer.org/download/):

To install the most recent stable release of Varbase 9.0.x run this command:
```
composer create-project Vardot/varbase-project:~9 PROJECT_DIR_NAME --no-dev --no-interaction
```

To install the dev version of Varbase 9.0.x run this command:
```
composer create-project vardot/varbase-project:9.0.x-dev PROJECT_DIR_NAME --stability dev --no-interaction
```

## [Create a new Vartheme sub theme for a project](https://github.com/Vardot/varbase/tree/9.0.x/scripts/README.md)

## [Automated Functional Testing](https://github.com/Vardot/varbase/blob/9.0.x/tests/README.md)

## [Varbase 9.0.x Developer Guide](https://docs.varbase.vardot.com)

## [CHANGELOG for Varbase](https://github.com/Vardot/varbase/blob/9.0.x/CHANGELOG.md)

## [Varbase Gherkin features](https://github.com/Vardot/varbase/blob/9.0.x/tests/features/varbase/README.md)

## [Varbase Developer Guide](https://docs.varbase.vardot.com)

## [General instructions on how to update Varbase](https://github.com/Vardot/varbase/blob/9.0.x/UPDATE.md)

## Local development with Lando

1. Install Lando locally, steps for installing can be found [here](https://docs.lando.dev/basics/installation.html).
2. Run Lando start.

## Debugging using Lando

- xDebug is enabled on Lando by default for PHP debugging.
- The debugger is set to listen for the port 9003 but can be changed in .lando/.php.ini
