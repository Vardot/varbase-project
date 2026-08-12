@regression @any @auth
Feature: Varbase Recipe - Auth Base (social authentication)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The social authentication providers page is available
     When I go to "/admin/config/social-api/social-auth"
      And wait
      And I wait for the text "User authentication" to appear
     Then I should see "User authentication"
