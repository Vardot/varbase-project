Feature: Content Management - Trash management
      As a site admin user
      I want to be able to access the Trash management page
      So that I can manage deleted content items.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Trash page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/trash"
      And wait
     Then I should see "Trash"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Content editor can access the Trash page
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/content/trash"
      And wait
     Then I should see "Trash"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Content admin can access the Trash page
    Given I am a logged in user with the "Content admin" user
     When I go to "/admin/content/trash"
      And wait
     Then I should see "Trash"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Site admin can access the Trash page
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/content/trash"
      And wait
     Then I should see "Trash"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Trash page
    Given I am an anonymous user
     When I go to "/admin/content/trash"
      And wait
     Then I should not see "Trash"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Trash page
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/content/trash"
      And wait
     Then I should not see "Trash"
