@news
Feature: News - News post content type - The fields of a news post
      As a Content editor
      I want a News post content type with the fields the news recipe defines
      So that I can capture a news post's title, summary, content and media.

  @check @local @development @staging @production
  Scenario: Check the News post add form offers the news fields to a Content editor
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/news"
     Then I should see "Create News post"
      And I should see "Title"
      And I should see "Featured image"
      And I should see "Description"
      And I should see "Content"
      And I should see "Categories"
      And I should see "Tags"
      And I see visible news title field, news categories field
