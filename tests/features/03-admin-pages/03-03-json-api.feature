@regression @any @admin
Feature: Check JSON API admin interface and services and Varbase API settings
      As a site admin user
      I want to be able to check the JSON:API available interface options
      So that I can use them to enable or disable API service for Varbase APIs.

  @check @local @development @staging @production
  Scenario: Check the Varbase API settings in admin configurations page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config"
      And wait
      And I wait for the text "JSON:API" to appear
     Then I should see "JSON:API"

  @check @local @development @staging @production
  Scenario: Check JSON:API configurations
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/services/jsonapi"
      And wait
     Then I should see "JSON:API"
      And I should see "Allowed operations"

  @check @local @development @staging @production
  Scenario: Check JSON:API Extras configurations
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/services/jsonapi/extras"
      And I wait 6s
     Then I should see "JSON:API Extras"

  @check @local @development @staging @production
  Scenario: Check JSON:API Resource overrides
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/services/jsonapi/resource_types"
      And I wait 6s
     Then I should see "JSON:API Resource overrides"

  @check @local @development @staging @production
  Scenario: Check Open API settings and documentation pages
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/services/openapi"
      And wait
     Then I should see "OpenAPI Resources"
      And I should see "Rest"
      And I should see "JSON:API"

@local @development @staging @production
  Scenario: Add a term "space" tag term for JSON:API to test.
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/structure/taxonomy/manage/tags/add"
      And wait
      And I wait for the text "Add term" to appear
     Then I should see "Add term"
     When I fill in "space" for "Name"
      And I scroll to the bottom
      And I submit by id "edit-submit"
      And wait
      And I go to "/admin/structure/taxonomy/manage/tags/overview"
      And I wait for the text "space" to appear
     Then I should see "Tags"
      And I should see "space"
