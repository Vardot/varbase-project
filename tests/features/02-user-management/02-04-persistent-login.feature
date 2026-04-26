Feature: User Management - User login session
  As a user which can login to the site.
  I want to be able to login and stay logged in during my session.
  So that I can access the site without re-entering credentials.

  @javascript @check @local @development @staging @production
  Scenario: Check that an authenticated user can log in with the Remember me option for a persistent login session
    Given I am an anonymous user
     When I go to "/user/login"
      And wait
     Then I should see "Log in"
      And I should see "Remember me"
      And the "#edit-persistent-login" checkbox should not be checked
     When I fill in "Normal user" for "Username or email address"
      And I fill in "dD.123123ddd" for "Password"
      And I check "Remember me"
      And I scroll to the bottom
      And I wait 2s
      And I press the "Log in" button
      And wait
     Then I should see "Normal user"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Persistent Login settings and the Persistent Logins management page for a user
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/system/persistent_login"
      And wait
     Then I should see "Persistent Login"
     When I go to "/user/1/persistent-logins"
      And wait
     Then I should see "Persistent Logins"
      And I should see "Created"
      And I should see "Last Used"
      And I should see "Expires"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Persistent Login settings page
    Given I am an anonymous user
     When I go to "/admin/config/system/persistent_login"
      And wait
     Then I should not see "Persistent Login settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Persistent Login settings page
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/system/persistent_login"
      And wait
     Then I should see "You are not authorized to access this page."
