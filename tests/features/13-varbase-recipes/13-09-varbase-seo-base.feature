@regression @any @content
Feature: Varbase Recipe - SEO Base (metatag + pathauto)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Metatag defaults and pathauto URL patterns exist
     When I go to "/admin/config/search/metatag"
      And wait
      And I wait for the text "Metatag" to appear
     Then I should see "Metatag"
     When I go to "/admin/config/search/path/patterns"
      And wait
      And I wait for the text "Pattern" to appear
     Then I should see "Pattern"
