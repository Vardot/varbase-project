@news
Feature: News - Authoring - A featured image for a news post
      As a Content editor
      I want to add a featured image to a news post from the media library
      So that the news post has a visual on its page and on its listing card.

  @check @local @development @staging
  Scenario: Verify a Content editor adds a featured image to a news post from the media library
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/news"
      And I fill in "Title" with "Varbase Example Image News 73503"
      And I fill in "Description" with "Summary for the featured-image test news post 73503."
      And I add the first available featured image from the media library
      And I save the news post
     Then I should see "Varbase Example Image News 73503"
     When I delete the news post I am viewing
     Then I should see "has been deleted"
