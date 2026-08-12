@regression @any @content @ai
Feature: Varbase AI Recipe - AI Editor Assistant (CKEditor 5)
      As a webmaster
      I want this Varbase AI recipe to deliver its admin surface and behaviour
      So that the AI feature keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @ai @recipes @local @development @staging @production
  Scenario: The AI CKEditor integration module is enabled
     When I go to "/admin/modules"
      And wait
      And I wait for the text "AI CKEditor integration" to appear
     Then I should see "AI CKEditor integration"

  @check @ai @recipes @local @development @staging @production
  Scenario: The Rich text format is configured with the CKEditor 5 editor
     When I go to "/admin/config/content/formats/manage/full_html"
      And wait
      And I wait for the text "Rich editor" to appear
     Then I should see "CKEditor 5"
