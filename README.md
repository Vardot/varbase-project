[![Vardot](https://circleci.com/gh/Vardot/varbase/tree/9.1.x.svg?style=shield)](https://app.circleci.com/pipelines/github/Vardot/varbase/904/workflows/a0c54684-f6d7-4c00-acf2-97bc86409898) Varbase 9.1.3

[![](https://www.drupal.org/files/styles/grid-3/public/project-images/Medium-Logo%20Color%20with%20padding.png)](http://www.drupal.org/project/varbase)

# Varbase Project

Project template for [Varbase distribution](http://www.drupal.org/project/varbase).

## Create a Varbase project with [Composer](https://getcomposer.org/download/):

The 9.1.x branch is only to support old projects
Recommended to start new projects with Varbase ~10
Go to https://github.com/Vardot/varbase-project/tree/10.0.x


To install the dev version of Varbase 9.1.x run this command:
```
composer create-project vardot/varbase-project:9.1.x-dev PROJECT_DIR_NAME --stability dev --no-interaction
```

## [Create a new Vartheme sub theme for a project](https://github.com/Vardot/varbase/tree/9.1.x/scripts/README.md)

## [Automated Functional Testing](https://github.com/Vardot/varbase/blob/9.1.x/tests/README.md)

## [Varbase 9.1.x Developer Guide](https://docs.varbase.vardot.com)

## [CHANGELOG for Varbase](https://github.com/Vardot/varbase/blob/9.1.x/CHANGELOG.md)

## [Varbase Gherkin features](https://github.com/Vardot/varbase/blob/9.1.x/tests/features/varbase/README.md)

## [Varbase Developer Guide](https://docs.varbase.vardot.com)

## [General instructions on how to update Varbase](https://github.com/Vardot/varbase/blob/9.1.x/UPDATE.md)

## [Local development with Lando](https://docs.varbase.vardot.com/developers/installing-varbase/installing-varbase-with-lando)

1. Install Lando locally, steps for installing can be found [here](https://docs.lando.dev/basics/installation.html).
2. Run `lando start`.

## Debugging using Lando

- xDebug is enabled on Lando by default for PHP debugging.
- The debugger is set to listen for the port 9003 but can be changed in `.lando/.php.ini`

## [Local development with DDEV](https://docs.varbase.vardot.com/developers/installing-varbase/installing-varbase-with-ddev)
1. Install DDEV locally, steps for installing can be found [here](https://ddev.readthedocs.io/en/stable/).
2. Run `ddev start`.

Join Our Slack Team for Feedback and Support
http://slack.varbase.vardot.com/

Sponsored and developed by [Vardot](https://www.drupal.org/vardot).