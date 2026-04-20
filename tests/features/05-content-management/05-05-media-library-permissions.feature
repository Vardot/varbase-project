Feature: Content Management - Media Library permissions
      As a site admin user
      I want to control access to the Media Library
      So that only authorized users can manage media assets.

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Media Library
    Given I am an anonymous user
     When I go to "/admin/content/media"
      And wait
     Then I should not see "Media"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Media Library
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/content/media"
      And wait
     Then I should see "You are not authorized to access this page."

  @javascript @check @local @development @staging @production
  Scenario: Check that Content editor users can access the Media Library
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content admin users can access the Media Library
    Given I am a logged in user with the "Content admin" user
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Media Library
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"
