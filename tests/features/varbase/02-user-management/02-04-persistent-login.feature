Feature: User Management - Have persistent login options and configurations
      As a user which can login to the site.
      I want to have the option to have "Remember Me" option on the user login form.
      So I can persistent my login session independent of setting of a long session lifetime.
  @check @local @development @staging @production
  Scenario: Check the persistent login configuration
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/system/persistent_login"
      And wait
     Then I should see "Persistent Login"
      And "#edit-lifetime" should have value "30"
      And "#edit-max-tokens" should have value "0"
  @check @local @development @staging @production
  Scenario: Check if an authenticated user can login and use the [Remember me] option
    Given I am an anonymous user
     When I go to "/user/login"
      And wait
     Then I should see "Log in"
      And I should see "Remember me"
     When I fill in "Normal user" for "Email address or username"
      And I fill in "dD.123123ddd" for "Password"
      And I scroll to the bottom of the page
      And I wait 2s
      And I check "Remember me"
      And I press the "Log in" button
      And wait
     Then I should see "Normal user"
