@regression @any @ai
Feature: Varbase AI Recipe - AI Image Alt (automatic alt text)
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: The automatic image alt-text settings are available
     When I go to "/admin/config/ai/ai_image_alt_text"
      And wait
      And I wait for the text "AI Image Alt Text Settings" to appear
     Then I should see "AI Image Alt Text Settings"
