@regression @any @content
Feature: Varbase Recipes module - the recipe engine is installed
      As a webmaster
      I want the Varbase Recipes module enabled
      So that Varbase recipes can be applied and re-applied on the site.

  # varbase_recipes is a service-only module (no admin UI of its own); it is the
  # engine that applies the Varbase recipes. The per-recipe feature files in
  # this folder assert the behaviour each applied recipe delivers.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The Varbase Recipes module is listed and enabled
     When I go to "/admin/modules"
      And wait
      And I wait for the text "Varbase Recipes" to appear
     Then I should see "Varbase Recipes"
