@regression @any @content
Feature: Varbase Recipe - Page Base (Utility page type)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: A Utility page can be created
     When I go to "/node/add/page"
      And wait
      And I wait for the text "Create Utility page" to appear
     Then I should see "Create Utility page"
      And I should see "Title"
