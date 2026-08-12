@regression @any @content
Feature: Varbase Recipe - Blog Base (Blog post type)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: A Blog post can be created
     When I go to "/node/add/blog"
      And wait
      And I wait for the text "Create Blog post" to appear
     Then I should see "Create Blog post"
      And I should see "Title"
