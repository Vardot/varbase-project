@regression @any @content
Feature: Varbase Recipe - Content Base (content types + taxonomy)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Content types and taxonomy are available
     When I go to "/admin/structure/types"
      And wait
      And I wait for the text "Blog post" to appear
     Then I should see "Blog post"
      And I should see "Utility page"
     When I go to "/admin/structure/taxonomy"
      And wait
      And I wait for the text "Tags" to appear
     Then I should see "Tags"
