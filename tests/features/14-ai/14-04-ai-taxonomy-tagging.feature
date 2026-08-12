@regression @any @ai
Feature: Varbase AI Recipe - AI Taxonomy Tagging (AI automators)
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: The AI Automators administration is available
     When I go to "/admin/config/ai/ai-automators"
      And wait
      And I wait for the text "AI Automators" to appear
     Then I should see "AI Automators"
      And I should see "Automator Chain"
