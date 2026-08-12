@regression @exploratory @any @ai
Feature: Varbase AI Recipe - AI Safety guardrails (PII + prompt safety)
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: The global AI guardrails are configured
     When I go to "/admin/config/ai/guardrails/global"
      And wait
      And I wait for the text "Global AI guardrails" to appear
     Then I should see "Global AI guardrails"
