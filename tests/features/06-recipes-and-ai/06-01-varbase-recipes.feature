Feature: Varbase Recipes - base recipes are applied and their admin pages work
      As a webmaster
      I want to verify that the Varbase base recipes applied by the
      automated-testing initialization are available
      So that the recipe-provided features keep working after install or update.

  # Covers the recipes documented at
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-recipes
  # that ddev init-full-automated-testing applies (i18n, API, auth) plus the
  # content/SEO/workflow/webform pieces the Varbase Starter recipe installs.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Varbase i18n Base - the languages configuration page is available
     When I go to "/admin/config/regional/language"
      And wait
     Then I should see "Languages"
      And I should see "Interface translation"

  @check @recipes @local @development @staging @production
  Scenario: Varbase API Base - the OpenAPI resources page is available
     When I go to "/admin/config/services/openapi"
      And wait
     Then I should see "OpenAPI Resources"

  @check @recipes @local @development @staging @production
  Scenario: Varbase Auth Base - the social authentication page is available
     When I go to "/admin/config/social-api/social-auth"
      And wait
     Then I should see "User authentication"

  @check @recipes @local @development @staging @production
  Scenario: Varbase Webform Base - the webforms admin page is available
     When I go to "/admin/structure/webform"
      And wait
     Then I should see "Webforms"

  @check @recipes @local @development @staging @production
  Scenario: Varbase SEO Base - the metatag configuration page is available
     When I go to "/admin/config/search/metatag"
      And wait
     Then I should see "Metatag"

  @check @recipes @local @development @staging @production
  Scenario: Varbase Workflow Base - the workflows configuration page is available
     When I go to "/admin/config/workflow/workflows"
      And wait
     Then I should see "Workflows"
