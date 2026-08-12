@regression @any @auth @admin
Feature: User Management - Standard User Management - Admins can create users and assign a role to them
      As a site admin user
      I want to be able to create new user accounts and assign roles to them
      So that they will be able to use the site.
  @local @development @staging @production
  Scenario: Check if admins can see all parts and filters in the People administration page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people"
      And wait
     Then I should see "People"
      And I should see "Add user"
      And I should see "Name or email contains"
      And I should see "Status"
      And I should see "Role"
      And I should see "Registered date (from)"
      And I should see "Registered date (to)"
      And I should see "Username"
      And I should see "Operations"
  @local @development @staging @production
  Scenario: Check if admins can create a new user account as an authenticated user
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people/create"
      And wait
     When I fill in "tester@vardot.com" for "Email address"
      And I fill in "tester" for "Username"
      And I fill in "dD.123123ddd" for "Password"
      And I fill in "dD.123123ddd" for "Confirm password"
      And I scroll to the bottom of the page
      And I press "Create new account"
  @cleanup @local @development @staging @production
  Scenario: Delete the tester user
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people"
      And I fill in "tester" for "Name or email contains"
      And I press "Filter"
      And I wait 3s
     Then I should see "tester"
  @local @development @staging @production
  Scenario: Check the behavior when "Allow custom account name" option is NOT checked in Varbase general settings and NO provided username
    Given I am a logged in user with the "webmaster" user
      And I go to "/admin/config/varbase/settings"
     Then I should see "Varbase general settings"
      And I should see "Allow custom account name"
     When I uncheck "Allow custom account name"
     Then I should see the "Allow custom account name" checkbox unchecked
     When I press "Save configuration"
      And wait
     Then I should see "The configuration options have been saved."
     When I go to "/admin/people/create"
      And wait
     When I fill in "test.not.allwed.no.username@vardot.com" for "Email address"
      And I fill in "edit-name" with: by attr
      And I fill in "dD.123123ddd" for "Password"
      And I fill in "dD.123123ddd" for "Confirm password"
      And I scroll to the bottom of the page
      And I press "Create new account"
     When I go to "/admin/people"
     Then I should see "test.not.allwed.no.username"
  @local @development @staging @production
  Scenario: Check the behavior when "Allow custom account name" option is NOT checked in Varbase general settings and provided some username
    Given I am a logged in user with the "webmaster" user
      And I go to "/admin/config/varbase/settings"
     Then I should see "Varbase general settings"
      And I should see "Allow custom account name"
     When I uncheck "Allow custom account name"
     Then I should see the "Allow custom account name" checkbox unchecked
     When I press "Save configuration"
      And wait
     Then I should see "The configuration options have been saved."
     When I go to "/admin/people/create"
      And wait
     When I fill in "test.not.allwed.with.username@vardot.com" for "Email address"
      And I fill in "Some username" for "Username"
      And I fill in "dD.123123ddd" for "Password"
      And I fill in "dD.123123ddd" for "Confirm password"
      And I scroll to the bottom of the page
      And I press "Create new account"
     When I go to "/admin/people"
     Then I should see "Some username"
  @local @development @staging @production
  Scenario: Check the behavior when "Allow custom account name" option is checked in Varbase general settings and NO provided username
    Given I am a logged in user with the "webmaster" user
      And I go to "/admin/config/varbase/settings"
     Then I should see "Varbase general settings"
      And I should see "Allow custom account name"
     When I check "Allow custom account name"
     Then I should see the "Allow custom account name" checkbox checked
     When I press "Save configuration"
      And wait
     Then I should see "The configuration options have been saved."
     When I go to "/admin/people/create"
      And wait
     When I fill in "test.allwed.no.username@vardot.com" for "Email address"
      And I fill in "edit-name" with: by attr
      And I fill in "dD.123123ddd" for "Password"
      And I fill in "dD.123123ddd" for "Confirm password"
      And I scroll to the bottom of the page
      And I press "Create new account"
      And I wait 3s
     Then I should see "Created a new user account"
     When I go to "/admin/people"
      And I wait 3s
     Then I should see "email_registra…"
  @local @development @staging @production
  Scenario: Check the behavior when "Allow custom account name" option is checked in Varbase general settings and provided username
    Given I am a logged in user with the "webmaster" user
      And I go to "/admin/config/varbase/settings"
     Then I should see "Varbase general settings"
      And I should see "Allow custom account name"
     When I check "Allow custom account name"
     Then I should see the "Allow custom account name" checkbox checked
     When I press "Save configuration"
      And wait
     Then I should see "The configuration options have been saved."
     When I go to "/admin/people/create"
      And wait
     When I fill in "test.allwed.with.username@vardot.com" for "Email address"
      And I fill in "Test Account Name" for "Username"
      And I fill in "dD.123123ddd" for "Password"
      And I fill in "dD.123123ddd" for "Confirm password"
      And I scroll to the bottom of the page
      And I press "Create new account"
     When I go to "/admin/people"
     Then I should see "Test Account Name"
      And I should not see "test.allwed.with.username"
