Feature: Content Management - Content Workflows
      As a site admin user
      I want to manage content moderation workflows
      So that content goes through proper review before publishing.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Workflows configuration
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/workflows"
      And wait
     Then I should see "Workflows"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Workflows configuration
    Given I am an anonymous user
     When I go to "/admin/config/workflow/workflows"
      And wait
     Then I should not see "Workflows"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Workflows configuration
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/workflow/workflows"
      And wait
     Then I should not see "Workflows"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the content listing with moderation
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content"
      And wait
     Then I should see "Content"
