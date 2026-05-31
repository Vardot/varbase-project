#!/bin/bash
# Server setup script for Varbase CI testing.
#
# Sets up Apache, directories, and permissions for running tests.

# Link project to web root
ln -sf $CI_PROJECT_DIR/$_WEB_ROOT /var/www/html

# Start Apache
sudo service apache2 start || service apache2 start

# Create required directories
mkdir -p $CI_PROJECT_DIR/$_WEB_ROOT/sites/simpletest
mkdir -p $CI_PROJECT_DIR/$_WEB_ROOT/sites/default/files
mkdir -p $CI_PROJECT_DIR/build/logs/junit
mkdir -p /var/www/.composer

# Set permissions
chown -R www-data:www-data $CI_PROJECT_DIR/$_WEB_ROOT/sites
chown -R www-data:www-data $CI_PROJECT_DIR/build/logs/junit
chown -R www-data:www-data $CI_PROJECT_DIR/vendor 2>/dev/null || true
chown -R www-data:www-data /var/www/

# Mark project directory as safe for git
sudo -u www-data git config --global --add safe.directory $CI_PROJECT_DIR 2>/dev/null || true
