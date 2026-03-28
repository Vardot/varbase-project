Feature: User Management - User login session
  As a user which can login to the site.
  I want to be able to login and stay logged in during my session.
  So that I can access the site without re-entering credentials.

  @javascript @check @local @development @staging @production
  Scenario: Check if an authenticated user can login successfully
    Given I am an anonymous user
     When I go to "/user/login"
      And wait
     Then I should see "Log in"
     When I fill in "Normal user" for "Username or email address"
      And I fill in "dD.123123ddd" for "Password"
      And I scroll to the bottom
      And I wait 2s
      And I press the "Log in" button
      And wait
     Then I should see "Normal user"
