@regression @any @content
Feature: Varbase Recipe - Editor Base (CKEditor 5)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The Rich text format uses CKEditor 5
     When I go to "/admin/config/content/formats/manage/full_html"
      And wait
      And I wait for the text "Rich editor" to appear
     Then I should see "CKEditor 5"
