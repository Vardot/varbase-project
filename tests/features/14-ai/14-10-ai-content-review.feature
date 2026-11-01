@ai
Feature: Varbase AI Recipe - AI Base - The AI review of a saved post
      As a content editor
      I want to open the AI review of a post I saved
      So that I can check its quality before I publish it.

  @check @ai @recipes @local @development @staging
  Scenario: Verify a content editor opens the AI review of a saved post
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/blog"
      And I fill in "Title" with "A post to review with AI"
      And I fill in "Description" with "A short post written to try the AI review."
      And I fill in the rich text editor field "Content" with "Varbase helps teams build websites faster. It is free and open source."
      And I click the "Save" button
      And I open the top bar page actions menu
      And I click "AI Review"
     Then I should see "Editorial Quality"
      And I should see "Not run"
