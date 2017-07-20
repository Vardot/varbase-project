# Varbase Project

Project template for [Varbase distribution](http://www.drupal.org/project/varbase).


## Create a Varbase project with [Composer](https://getcomposer.org/download/):

```
composer create-project vardot/varbase-project:8.4.x-dev PROJECT_DIR_NAME --no-dev --no-interaction
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