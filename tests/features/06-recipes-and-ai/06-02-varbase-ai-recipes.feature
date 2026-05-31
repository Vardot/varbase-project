Feature: Varbase AI Recipes - AI recipes are applied and their admin pages work
      As a webmaster
      I want to verify that the Varbase AI recipes applied by the
      automated-testing initialization are available
      So that the AI features keep working after install or update.

  # Covers the recipes documented at
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes
  # applied by ddev init-full-automated-testing:
  #   varbase_ai_base, varbase_ai_context, varbase_ai_safety.

  Background:
    Given I am a logged in user with the "webmaster" user

  # = Varbase AI Base =

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Base - the AI setup and configuration page is available
     When I go to "/admin/config/ai"
      And wait
     Then I should see "AI Setup and Configuration"

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Base - the AI providers page lists the configured providers
     When I go to "/admin/config/ai/providers"
      And wait
     Then I should see "AI Providers"
      And I should see "OpenAI"
      And I should see "Anthropic"

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Base - the OpenAI provider settings page is available
     When I go to "/admin/config/ai/providers/openai"
      And wait
     Then I should see "Setup OpenAI Authentication"

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Base - the AI image alt text settings page is available
     When I go to "/admin/config/ai/ai_image_alt_text"
      And wait
     Then I should see "AI Image Alt Text Settings"

  # = Varbase AI Safety =

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Safety - the Safety & Compliance section is available
     When I go to "/admin/config/ai/safety-compliance"
      And wait
     Then I should see "Safety & Compliance"

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Safety - the global AI guardrails page is available
     When I go to "/admin/config/ai/guardrails/global"
      And wait
     Then I should see "Global AI guardrails"

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Safety - the AI logging page is available
     When I go to "/admin/config/ai/logging"
      And wait
     Then I should see "AI Logging"

  @check @ai @recipes @local @development @staging @production
  Scenario: Varbase AI Safety - the AI observability settings page is available
     When I go to "/admin/config/ai/observability"
      And wait
     Then I should see "AI Observability Settings"
