@news
Feature: News - Authoring - Edit a news post
      As a Content editor
      I want to edit a news post I created
      So that I can correct its details after publishing.

  @check @local @development @staging
  Scenario: Verify a Content editor changes the title of a news post
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/news"
      And I fill in "Title" with "Varbase Example Edit News 73502 before"
      And I fill in "Description" with "Summary for the edit test news post 73502."
      And I save the news post
     Then I should see "Varbase Example Edit News 73502 before"
     When I open the edit form for the news post I am viewing
      And I fill in "Title" with "Varbase Example Edit News 73502 after"
      And I save the news post
     Then I should see "Varbase Example Edit News 73502 after"
      And I should not see "Varbase Example Edit News 73502 before"
     When I delete the news post I am viewing
     Then I should see "has been deleted"
