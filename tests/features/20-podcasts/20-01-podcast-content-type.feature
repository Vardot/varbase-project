@podcasts @content-model
Feature: Podcasts Base - Podcast and Podcast episode content types
      As a Content editor
      I want a Podcast content type for the show and a Podcast episode content type for each episode
      So that I can publish a show once and add its episodes, with their audio, under it.

  @regression @local @development @staging @production
  Scenario: The Podcast add form describes the show, with no audio of its own
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast"
     Then the page title should contain "Create Podcast"
      And I see visible podcast title field
      And the field "Title" should be required
      And the field "Summary" should be required
      And I should see "Cover art"
      And I should see "Host"
      And I should see "Listen on"
      And I don't see audio media button, duration field, episode number field, podcast reference field

  @regression @local @development @staging @production
  Scenario: The Podcast episode add form asks for its podcast, a title, a summary and cover art
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
     Then the page title should contain "Create Podcast episode"
      And I see visible podcast title field, podcast reference field
      And the field "Title" should be required
      And the field "Podcast" should be required
      And the field "Summary" should be required
      And the field "Show notes" should exist
      And the field "Summary" should be empty
      And I should see "Cover art"
      And I should see "Add media"
      And I should see "Listen on"

  @regression @local @development @staging @production
  Scenario: The Audio tab offers the Audio field as a media reference, not a file upload or a link
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I open the "Audio" tab on the podcast form
     Then I see visible audio media button, duration field, episode number field
      And I don't see audio file upload, audio link field
      And the field "Duration" should not be required
      And the field "Episode number" should not be required

  @regression @local @development @staging
  Scenario: An episode cannot be saved without the podcast it belongs to
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I fill in "Title" with "Varbase Example Orphan Episode 74513"
      And I fill in "Summary" with "Summary for the orphan test episode 74513."
      And I add the first available cover art from the media library
      And I try to save the podcast episode
     Then I should see "Podcast field is required."
      And the url should match "/node/add/podcast_episode"
