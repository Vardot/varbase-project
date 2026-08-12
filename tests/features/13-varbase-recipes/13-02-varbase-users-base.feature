@regression @any @auth
Feature: Varbase Recipe - Users Base (editorial roles)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The editorial roles exist
     When I go to "/admin/people/roles"
      And wait
      And I wait for the text "Content editor" to appear
     Then I should see "Content editor"
      And I should see "Content Admin"
      And I should see "SEO Admin"
      And I should see "Site Admin"
