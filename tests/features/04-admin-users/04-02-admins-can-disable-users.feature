@regression @any @auth @admin
Feature: User Management - Standard User Management - Admins can disable users
      As a site admin user
      I want to be able Block user accounts
      So that they will be disabled and not be able to use the site.

  @local @development @staging @production
  Scenario: Check if the Normal user user is not blocked and can login
    Given I am on "/user/login"
      And I wait 6s
     When I fill in "Normal user" for "Username or email address"
      And I fill in "dD.123123ddd" for "Password"
      And I scroll to bottom
      And I wait 2s
      And I press "Log in"
      And wait
     Then I should see "Normal user"
