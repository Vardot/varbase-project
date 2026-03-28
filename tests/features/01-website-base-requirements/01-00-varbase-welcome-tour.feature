Feature: The admin dashboard should be displayed after login
  The admin dashboard is the default landing page for admin users in Varbase 11

  @javascript @local @development @staging @production
  Scenario: Check if the admin dashboard is accessible after login
    Given I am a logged in user with the "webmaster" user
      And I go to "/admin/dashboard"
      And wait
     Then I should see "Dashboard"
      And I should see "Recent pages"
      And I should see "Recent content"
