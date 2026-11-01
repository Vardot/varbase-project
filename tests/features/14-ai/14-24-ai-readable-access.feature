@ai
Feature: Varbase AI Recipe - AI Readable Base - Who configures /llms.txt and Markdownify
  As a site owner
  I want SEO and site admins to manage /llms.txt, and only site admins to change Markdownify
  So that what AI tools read stays with the people responsible for search and the site

  @check @ai @recipes @access @local @development @staging @production
  Scenario Outline: Check the "<user>" user can configure /llms.txt
    Given I am a logged in user with the "<user>" user
     When I go to "/admin/content/llms-txt"
     Then the response status code should be 200
      And I should see "/llms.txt configuration"

    Examples:
      | user       |
      | SEO admin  |
      | Site admin |

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check the site admin can change the Markdownify settings and the SEO admin cannot
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/config/services/markdownify"
     Then I should see "Markdownify Settings"
     When I logout
      And I am a logged in user with the "SEO admin" user
      And I go to "/admin/config/services/markdownify"
     Then the response status code should be 403
      And I should see "Access denied"

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check a content editor cannot configure /llms.txt
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/content/llms-txt"
     Then the response status code should be 403
      And I should see "Access denied"
