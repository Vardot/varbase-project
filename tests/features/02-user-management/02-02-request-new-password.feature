@regression @any @auth
Feature: User Management - Standard User Management - Request new password
      As a user with a ready user account
      I will want to be able to Request new password
      So that I can reset my password for the account

  Background:
    Given I am an anonymous user


  @local @development @staging @production
  Scenario: Check that an anonymous user can reset his or her password
     When I go to "/user/login"
      And wait
     Then I should see "Forgot your password?"

  @local @development @staging @production
  Scenario: Verify that the system cannot send an email to non-existing users or emails
     When I go to "/user/password"
      And I wait 6s
     Then I should see "Username or email address"
     When I fill in "not.existing.email@vardot.com" for "Username or email address"
      And I wait 2s
      And I press the "Reset" button
      And wait
      And I wait for the text "an email will be sent with instructions to reset your password." to appear
     Then I should see "an email will be sent with instructions to reset your password."