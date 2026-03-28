Feature: Content Management - Content Planning and Scheduling
      As a site admin user
      I want to be able to access the Scheduler configuration
      So that I can schedule content publishing and unpublishing.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Scheduler settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/content/scheduler"
      And wait
     Then I should see "Scheduler"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Scheduler settings
    Given I am an anonymous user
     When I go to "/admin/config/content/scheduler"
      And wait
     Then I should not see "Scheduler"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Scheduler settings
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/content/scheduler"
      And wait
     Then I should not see "Scheduler"
