Feature: Content Management - Cloning content and entities
      As a site admin user
      I want to be able to access the Entity Clone settings
      So that I can configure content cloning options.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Entity clone settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/system/entity-clone"
      And wait
     Then I should see "Entity Clone Settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Entity clone settings
    Given I am an anonymous user
     When I go to "/admin/config/system/entity-clone"
      And wait
     Then I should not see "Entity Clone Settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Entity clone settings
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/system/entity-clone"
      And wait
     Then I should not see "Entity Clone Settings"
