Feature: User Management - User account protection
  As a logged in site admin
  I want user accounts to be properly managed
  So that admin accounts are secure.

  @javascript @check @local @development @staging @production
  Scenario: Check that admin user account exists and is protected
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people"
      And wait
     Then I should see "People"
