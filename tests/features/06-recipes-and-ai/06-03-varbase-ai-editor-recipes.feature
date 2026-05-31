Feature: Varbase AI Recipes - editor, image-alt, taxonomy, context and safety
      As a webmaster
      I want each Varbase AI editor/content recipe to expose its admin surface
      So that the AI authoring features work after install or update.

  # One scenario per recipe documented under
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes
  #   - varbase_ai_editor_assistant
  #   - varbase_ai_image_alt
  #   - varbase_ai_taxonomy_tagging
  #   - varbase_ai_context
  #   - varbase_ai_safety
  # All applied by ddev init-full-automated-testing.

  Background:
    Given I am a logged in user with the "webmaster" user

  # = varbase_ai_editor_assistant =
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes/varbase-ai-editor-assistant
  @check @ai @recipes @local @development @staging @production
  Scenario: AI Editor Assistant - the CKEditor 5 AI assistant is wired into the Rich editor format
    When I go to "/admin/config/content/formats/manage/full_html"
      And wait
      And I wait for the text "AI Assistant" to appear
    Then I should see "Rich editor"
      And I should see "CKEditor 5"
      And I should see "AI Assistant"

  # = varbase_ai_image_alt =
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes/varbase-ai-image-alt
  @check @ai @recipes @local @development @staging @production
  Scenario: AI Image Alt - the automatic image alt-text settings page is available
    When I go to "/admin/config/ai/ai_image_alt_text"
      And wait
    Then I should see "AI Image Alt Text Settings"

  # = varbase_ai_taxonomy_tagging =
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes/varbase-ai-taxonomy-tagging
  @check @ai @recipes @local @development @staging @production
  Scenario: AI Taxonomy Tagging - the AI Automators administration page is available
    When I go to "/admin/config/ai/ai-automators"
      And wait
    Then I should see "AI Automators"
      And I should see "Automator Chain"

  # = varbase_ai_context =
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes/varbase-ai-context
  @check @ai @recipes @local @development @staging @production
  Scenario: AI Context - the Context Control Center overview is available
    When I go to "/admin/ai/context/overview"
      And wait
    Then I should see "Overview"

  @check @ai @recipes @local @development @staging @production
  Scenario: AI Context - the Context Items settings page is available
    When I go to "/admin/ai/context/settings/items"
      And wait
    Then I should see "Context Items Settings"

  # = varbase_ai_safety =
  # https://docs.varbase.vardot.com/developers/understanding-varbase/varbase-ai-recipes/varbase-ai-safety
  @check @ai @recipes @local @development @staging @production
  Scenario: AI Safety - the Safety & Compliance section and global guardrails are available
    When I go to "/admin/config/ai/safety-compliance"
      And wait
    Then I should see "Safety & Compliance"
    When I go to "/admin/config/ai/guardrails/global"
      And wait
    Then I should see "Global AI guardrails"
