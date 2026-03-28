 **Varbase 11.0.x**

[![](https://www.drupal.org/files/project-images/varbase-medium-logo-color-with-padding.png)](https://www.drupal.org/project/varbase)

# Varbase Project

Project template for [Varbase](http://www.drupal.org/project/varbase).

## Create a Varbase project with [Composer](https://getcomposer.org/download/):

# Install with Composer

To install the dev version of **Varbase `11.0.x`** run this command:
```
composer create-project drupal/varbase_project:11.0.x-dev PROJECT_DIR_NAME --stability dev --no-interaction
```

## [Automated Functional Testing](tests/README.md)

## [Varbase Developer Guide](https://docs.varbase.vardot.com)

## Local development with DDEV

1. Install DDEV locally, steps for installing can be found [here](https://ddev.readthedocs.io/en/stable/).
2. Run `ddev start`.
3. Install Varbase: `ddev install-varbase full` or `ddev install-varbase minimal`.

### DDEV Commands

| Command | Description |
|---------|-------------|
| `ddev install-varbase minimal\|full` | Install Varbase from scratch with Drupal recipes |
| `ddev init-full-automated-testing` | Install (if needed) + recipes + test users + site prep |
| `ddev init-minimal-automated-testing` | Test users + site prep on an already installed site |
| `ddev add-testing-users` | Add testing user accounts |
| `ddev delete-testing-users` | Remove testing user accounts |

Join Our Slack Team for Feedback and Support
http://slack.varbase.vardot.com/

Sponsored and developed by [Vardot](https://www.drupal.org/vardot).
