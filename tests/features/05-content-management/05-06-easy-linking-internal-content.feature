Feature: Content Management - Easy Linking internal content with Linkit
      As a site admin user
      I want to be able to access the Linkit configuration
      So that content editors can easily link to internal content.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Linkit configuration
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/content/linkit"
      And wait
     Then I should see "Linkit"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Linkit configuration
    Given I am an anonymous user
     When I go to "/admin/config/content/linkit"
      And wait
     Then I should not see "Linkit"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Linkit configuration
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/content/linkit"
      And wait
     Then I should not see "Linkit"
