@news
Feature: News - Permissions - Who can author news posts
      As a site administrator
      I want news authoring restricted to the editorial roles
      So that only trusted users can create and manage news posts.

  @check @local @development @staging @production
  Scenario: Check an anonymous visitor cannot reach the News post creation form
    Given I am an anonymous user
     When I go to "/node/add/news"
     Then I should not see "Create News post"
      And I should see "Log in"

  @check @local @development @staging @production
  Scenario: Check a Normal user cannot reach the News post creation form
    Given I am a logged in user with the "Normal user" user
     When I go to "/node/add/news"
     Then I should not see "Create News post"
      And the response status code should be 403
      And I should see "You are not authorized to access this page."

  @check @local @development @staging @production
  Scenario Outline: Check the "<role>" user can reach the News post creation form
    Given I am a logged in user with the "<role>" user
     When I go to "/node/add/news"
     Then I should see "Create News post"

    Examples:
      | role           |
      | Content editor |
      | Content admin  |
      | webmaster      |

  @check @local @development @staging
  Scenario: Verify a Content editor can create, edit and delete a news post
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/news"
      And I fill in "Title" with "Varbase Example Permission News 73505"
      And I fill in "Description" with "Summary for the permission test news post 73505."
      And I save the news post
     Then I should see "Varbase Example Permission News 73505"
     When I open the edit form for the news post I am viewing
      And I fill in "Description" with "Summary for the permission test news post 73505 (updated)."
      And I save the news post
     Then I should see "Varbase Example Permission News 73505"
     When I delete the news post I am viewing
     Then I should see "has been deleted"
