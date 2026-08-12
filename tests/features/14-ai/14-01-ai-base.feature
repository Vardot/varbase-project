@regression @any @ai
Feature: Varbase AI Recipe - AI Base (providers + prompts)
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: The AI providers and prompts are available
     When I go to "/admin/config/ai/providers"
      And wait
      And I wait for the text "AI Providers" to appear
     Then I should see "AI Providers"
      And I should see "OpenAI"
      And I should see "Anthropic"
     When I go to "/admin/config/ai/providers/openai"
      And wait
      And I wait for the text "Setup OpenAI Authentication" to appear
     Then I should see "Setup OpenAI Authentication"
     When I go to "/admin/config/ai/prompts"
      And wait
      And I wait for the text "Prompt" to appear
     Then I should see "Prompt"
