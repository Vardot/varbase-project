Feature: User Management - Standard User Management - Admins can create users and assign a role to them
      As a site admin user
      I want to be able to create new user accounts and assign roles to them
      So that they will be able to use the site.

  @javascript @local @development @staging @production
  Scenario: Check if admins can see all parts and filters in the People administration page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people"
      And wait
     Then I should see "People"
      And I should see "Add user"
      And I should see "Name or email contains"
      And I should see "Status"
      And I should see "Role"
      And I should see "Username"
      And I should see "Operations"

 @javascript @local @development @staging @production
  Scenario: Check if admins can access the create user page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people/create"
      And wait
     Then I should see "Email address"
      And I should see "Username"
      And I should see "Password"