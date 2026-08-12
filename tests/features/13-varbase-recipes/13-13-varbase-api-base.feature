@regression @any @admin
Feature: Varbase Recipe - API Base (JSON:API + OpenAPI)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: JSON:API and OpenAPI resources are available
     When I go to "/admin/config/services/openapi"
      And wait
      And I wait for the text "OpenAPI Resources" to appear
     Then I should see "OpenAPI Resources"
     When I go to "/admin/config/services/jsonapi"
      And wait
      And I wait for the text "JSON:API" to appear
     Then I should see "Allowed operations"
