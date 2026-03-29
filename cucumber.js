module.exports = {
  default: {
    timeout: 30000,
    requireModule: ['ts-node/register'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
    ],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || process.env.DDEV_PRIMARY_URL || 'https://localhost',
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      users: {
        "webmaster":{
          "username": "webmaster",
          "email": "webmaster@vardot.com",
          "password": "dD.123123ddd"
        },
        "Normal user":{
          "email": "test.authenticated@vardot.com",
          "password": "dD.123123ddd"
        },
        "Content editor":{
          "email": "test.content_editor@vardot.com",
          "password": "dD.123123ddd"
        },
        "Content admin":{
          "email": "test.content_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "SEO admin":{
          "email": "test.seo_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "Site admin":{
          "email": "test.site_admin@vardot.com",
          "password": "dD.123123ddd"
        },
        "Super admin":{
          "email": "test.super_admin@vardot.com",
          "password": "dD.123123ddd"
        }
      }
    },
  },
};
