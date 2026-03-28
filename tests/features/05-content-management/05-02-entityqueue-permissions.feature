Feature: Content Management - Entityqueue permissions
      As a site admin user
      I want to control access to Entityqueues
      So that only authorized users can manage content queues.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Entityqueues listing
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/structure/entityqueue"
      And wait
     Then I should see "Entityqueues"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Site admin can access the Entityqueues listing
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/structure/entityqueue"
      And wait
     Then I should see "Entityqueues"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Entityqueues listing
    Given I am an anonymous user
     When I go to "/admin/structure/entityqueue"
      And wait
     Then I should not see "Entityqueues"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Entityqueues listing
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/structure/entityqueue"
      And wait
     Then I should not see "Entityqueues"
