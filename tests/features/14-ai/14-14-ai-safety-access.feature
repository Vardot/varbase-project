@ai
Feature: Varbase AI Recipe - AI Safety - Who can change the guardrails and read the AI log
      As a site owner
      I want only the super administrator to change the guardrails and read the AI log
      So that prompts, which can hold personal data, stay private.

  @check @ai @recipes @access @local @development @staging @production
  Scenario Outline: Check the "<user>" user cannot open the guardrails or the AI log
    Given I am a logged in user with the "<user>" user
     When I go to "/admin/config/ai/guardrails"
     Then the response status code should be 403
      And I should see "Access denied"
     When I go to "/admin/config/ai/logging"
     Then the response status code should be 403
      And I should see "Access denied"

    Examples:
      | user           |
      | Content editor |
      | Content admin  |
      | SEO admin      |
      | Site admin     |

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check an anonymous visitor cannot read the AI log
    Given I am an anonymous user
     When I go to "/admin/config/ai/logging"
     Then I should not see "AI Logging"
      And I should see "Log in"
