@regression @any @ai
Feature: Varbase AI Recipes module - AI core is installed
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: AI core and AI dashboard are available
     When I go to "/admin/config/ai"
      And wait
      And I wait for the text "AI Setup and Configuration" to appear
     Then I should see "AI Setup and Configuration"
