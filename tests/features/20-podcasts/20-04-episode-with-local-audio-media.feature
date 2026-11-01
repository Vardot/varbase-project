@podcasts @audio
Feature: Podcasts Base - An episode with a local audio media item
      As a Content editor
      I want to give the episode an audio file held on this site
      So that a self-hosted show does not depend on an external platform.

  @regression @local @development @staging
  Scenario: A Content editor uploads an mp3 through the media library, and the episode plays it before and after an edit
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example Upload Episode 74507"
      And I fill in "Summary" with "Summary for the uploaded audio test episode 74507."
      And I add the first available cover art from the media library
      And I open the "Audio" tab on the podcast form
      And I open the media library for the "Audio" field
      And I upload the audio file "varbase-example-upload-episode.mp3" to the open media library
     Then the "Audio" field should show the selected media item "varbase-example-upload-episode.mp3"
     When I save the podcast episode
     Then the page title should contain "Varbase Example Upload Episode 74507 | "
      And the episode page should play media from "varbase-example-upload-episode"
      And the episode player should load its audio
     When I open the edit form for the podcast episode I am viewing
      And I fill in "Summary" with "Summary for the uploaded audio test episode 74507, edited."
      And I save the podcast episode
     Then I should see "Summary for the uploaded audio test episode 74507, edited."
      And the episode page should play media from "varbase-example-upload-episode"
      And the episode player should load its audio

  @regression @local @development @staging @production
  Scenario: An anonymous visitor can play the audio of a seeded episode
    Given I am an anonymous user
     When I go to "/podcasts/varbase-example-podcast-one/varbase-example-episode-01"
     Then the page title should contain "Varbase Example Episode 01 | "
      And I see visible episode player
      And the episode page should play media from "varbase-example-episode"
      And the episode player should load its audio
