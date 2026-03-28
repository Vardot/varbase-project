Feature: Accessibility - Editorial Accessibility Checker permissions
      As a logged in user with permission to access the a11y checker tools
      I want to be able to use the tool to identify accessibility issues
      So that only users with permission can see and use the tool.

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Editoria11y settings
    Given I am an anonymous user
     When I go to "/admin/config/content/editoria11y"
      And wait
     Then I should not see "Editoria11y Settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that authenticated users can not access the Editoria11y settings
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/content/editoria11y"
      And wait
     Then I should not see "Editoria11y Settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content editor users can not access the Content Accessibility reports
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/reports/editoria11y"
      And wait
     Then I should not see "Content Accessibility"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content admin users can not access the Content Accessibility reports
    Given I am a logged in user with the "Content admin" user
     When I go to "/admin/reports/editoria11y"
      And wait
     Then I should not see "Content Accessibility"

  @javascript @check @local @development @staging @production
  Scenario: Check that SEO admin users can not access the Content Accessibility reports
    Given I am a logged in user with the "SEO admin" user
     When I go to "/admin/reports/editoria11y"
      And wait
     Then I should not see "Content Accessibility"

  @javascript @check @local @development @staging @production
  Scenario: Check that Site admin users can not access the Editoria11y settings
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/config/content/editoria11y"
      And wait
     Then I should not see "Editoria11y Settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Editoria11y settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/content/editoria11y"
      And wait
     Then I should see "Editoria11y Settings"
