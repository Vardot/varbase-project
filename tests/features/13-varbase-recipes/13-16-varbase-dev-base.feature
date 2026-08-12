@regression @any @admin
Feature: Varbase Recipe - Dev Base (config sync tooling)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The configuration synchronization tool is available
     When I go to "/admin/config/development/configuration"
      And wait
      And I wait for the text "Configuration synchronization" to appear
     Then I should see "Configuration synchronization"
