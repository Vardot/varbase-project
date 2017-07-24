# Varbase Project

Project template for [Varbase distribution](http://www.drupal.org/project/varbase).


## Create a Varbase project with [Composer](https://getcomposer.org/download/):

```
composer create-project vardot/varbase-project:8.4.x-dev PROJECT_DIR_NAME --stability dev --no-interaction
```

## Create new Vartheme sub theme for a project.
```
composer create-new-vartheme "THEME_NAME" "ltr" "docroot/sites/default/themes/custom"
```

For right to left themes.
```
composer create-new-vartheme "THEME_NAME" "rtl" "docroot/sites/default/themes/custom"
```

or to create a new theme in the docroot/themes/custom
```
composer create-new-vartheme "THEME_NAME" "ltr"
```

# Automated testing
To run the automated testing with behat you will need to change the [ wd_host and base_url ] settings in the
[ behat.varbase.yml ] file to go with your project configuration and the selenium server.

```
    Behat\MinkExtension:
      files_path: "%paths.base%/tests/assets/"
      goutte: ~
      selenium2:
        wd_host: 127.0.0.1:4445/wd/hub
        capabilities:
          browser: 'firefox'
          # browser: 'chrome'
          # browser: 'phantomjs'
          nativeEvents: true
      base_url: 'http://127.0.0.1:8080'
      browser_name: 'firefox'
      # browser_name: 'chrome'
      # browser_name: 'phantomjs'
      javascript_session: selenium2
```
      
Testing scenarios are tagged with the Behat tags of:

* **@local = Local**
* **@development = Development server.**
* **@staging = Staging and testing server.**
* **@production = Production live server.**

So that we only run bin/behat --tags with the right tag for the environment.

Run the varbase check tests. Only to check, without any changes to the website.
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase --tags '@check' --format pretty --out std  --format html  --out tests/reports/varbase-check-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

Run the varbase full local tests. which developers could test all scenarios in their local machine environment.
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase --tags '@local' --format pretty --out std  --format html  --out tests/reports/varbase-full-local-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

Run the varbase full development tests. which developers could test scenarios on the website at the development environment.
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase --tags '@development' --format pretty --out std  --format html  --out tests/reports/varbase-full-development-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

Run the varbase full staging tests. which developers could test scenarios on the website at the staging environment.
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase --tags '@staging' --format pretty --out std  --format html  --out tests/reports/varbase-full-staging-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

Run the varbase full production only tests. not to change anything with test scenarios on the production environment.
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase --tags '@production' --format pretty --out std  --format html  --out tests/reports/varbase-full-production-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

Run the varbase full tests. init, apply, then cleanup.
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase/step1-init-tests --format pretty --out std  --format html  --out tests/reports/varbase-init-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
../../../bin/behat tests/features/varbase/step2-apply-tests --format pretty --out std  --format html  --out tests/reports/varbase-apply-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
../../../bin/behat tests/features/varbase/step3-cleanup-tests --format pretty --out std  --format html  --out tests/reports/varbase-cleanup-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

Run the varbase full tests. Which equivalent to varbase-init-tests, varbase-apply-tests, varbase-cleanup-tests
```
cd docroot/profiles/varbase;
../../../bin/behat tests/features/varbase --format pretty --out std  --format html  --out tests/reports/varbase-full-tests-report-$( date '+%Y-%m-%d_%H-%M-%S' );
```

We could run behat tests with this set
Go to [ PROJECT_DIR_NAME/docroot/profiles/varbase ] in the terminal then you could run the following command:
```
$ ../../../bin/behat tests/features/varbase

```

Then you will be able to open the full report for the automated test in a web browser at the following path:
[ PROJECT_DIR_NAME/docroot/profiles/varbase/tests/reports ]