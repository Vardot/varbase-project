@regression @any @perf
Feature: Varbase Recipe - Performance Base
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The performance settings page is available
     When I go to "/admin/config/development/performance"
      And wait
      And I wait for the text "Bandwidth optimization" to appear
     Then I should see "Bandwidth optimization"
