@regression @any @ai
Feature: Varbase AI Recipe - AI Context (Context Control Center)
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: The Context Control Center overview and items are available
     When I go to "/admin/config/ai/context/overview"
      And wait
      And I wait for the text "Overview" to appear
     Then I should see "Overview"
     When I go to "/admin/config/ai/context/settings/items"
      And wait
      And I wait for the text "Context Items Settings" to appear
     Then I should see "Context Items Settings"
