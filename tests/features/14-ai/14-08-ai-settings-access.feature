@ai
Feature: Varbase AI Recipe - AI Base - Who can change the AI settings
      As a site owner
      I want only the site's super administrator to change the AI providers and models
      So that editors use AI without being able to change where their content is sent.

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check the webmaster can open the AI settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/ai/settings"
     Then the response status code should be 200
      And I should see "AI Settings"

  @check @ai @recipes @access @local @development @staging @production
  Scenario Outline: Check the "<user>" user cannot open the AI settings
    Given I am a logged in user with the "<user>" user
     When I go to "/admin/config/ai/settings"
     Then the response status code should be 403
      And I should see "Access denied"

    Examples:
      | user           |
      | Content editor |
      | Content admin  |
      | SEO admin      |
      | Site admin     |

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check an anonymous visitor cannot open the AI settings
    Given I am an anonymous user
     When I go to "/admin/config/ai/settings"
     Then I should not see "AI Settings"
      And I should see "Log in"
