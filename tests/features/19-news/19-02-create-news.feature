@news
Feature: News - Authoring - Create a news post
      As a Content editor
      I want to create a news post with its fields
      So that the news post page presents the details to visitors.

  @check @local @development @staging
  Scenario: Verify a Content editor creates a news post and its page shows the title
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/news"
      And I fill in "Title" with "Varbase Example Authoring News 73501"
      And I fill in "Description" with "Short summary for the authoring test news post 73501."
      And I save the news post
     Then I should see "Varbase Example Authoring News 73501"
     When I delete the news post I am viewing
     Then I should see "has been deleted"
