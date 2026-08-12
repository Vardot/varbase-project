@regression @any @admin
Feature: Varbase Recipe - Admin Base (Gin admin theme)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Gin is the active administration theme
     When I go to "/admin/appearance"
      And wait
      And I wait for the text "Administration theme" to appear
     Then I should see "Gin"
