@ai
Feature: Varbase AI Recipe - AI Context - Editorial roles read the published context
      As a content editor
      I want the AI to use the published context items when I use it
      So that what it writes for me follows the site's rules, while only administrators change them.

  @check @ai @recipes @access @local @development @staging @production
  Scenario Outline: Check the "<user>" user can read a published context item but not change it
    Given I am a logged in user with the "<user>" user
     When I go to "/admin/config/ai/context/items/1"
     Then the response status code should be 200
      And I should see "Varbase AI Editorial Rules"
     When I go to "/admin/config/ai/context/items/1/edit"
     Then the response status code should be 403
      And I should see "Access denied"

    Examples:
      | user           |
      | Content editor |
      | Content admin  |
      | SEO admin      |
      | Site admin     |

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check an editor cannot list or manage the context items
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/config/ai/context/items"
     Then the response status code should be 403
      And I should see "Access denied"

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check an anonymous visitor cannot read a context item
    Given I am an anonymous user
     When I go to "/admin/config/ai/context/items/1"
     Then I should not see "Varbase AI Editorial Rules"
      And I should see "Log in"
