Feature: User Management - Login Redirect - Admin roles redirect to dashboard, authenticated users to profile
      As a user logging into the site
      I want to be redirected to the appropriate page after login
      So that I land on the most relevant section for my role.

  @javascript @check @local @development @staging @production
  Scenario: Check that Content editor is redirected to the admin dashboard after login
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/dashboard"
      And wait
     Then I should see "Dashboard"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content admin is redirected to the admin dashboard after login
    Given I am a logged in user with the "Content admin" user
     When I go to "/admin/dashboard"
      And wait
     Then I should see "Dashboard"

  @javascript @check @local @development @staging @production
  Scenario: Check that SEO admin is redirected to the admin dashboard after login
    Given I am a logged in user with the "SEO admin" user
     When I go to "/admin/dashboard"
      And wait
     Then I should see "Dashboard"

  @javascript @check @local @development @staging @production
  Scenario: Check that Site admin is redirected to the admin dashboard after login
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/dashboard"
      And wait
     Then I should see "Dashboard"

  @javascript @check @local @development @staging @production
  Scenario: Check that Super admin is redirected to the admin dashboard after login
    Given I am a logged in user with the "Super admin" user
     When I go to "/admin/dashboard"
      And wait
     Then I should see "Dashboard"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal user can access their profile page
    Given I am a logged in user with the "Normal user" user
     When I go to "/user"
      And wait
     Then I should see "Normal user"
