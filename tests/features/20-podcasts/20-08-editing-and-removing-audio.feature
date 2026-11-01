@podcasts @audio @authoring
Feature: Podcasts Base - Removing an episode's audio
      As a Content editor
      I want an episode's page to survive losing its audio
      So that removing a recording never leaves listeners with a broken episode.

  @regression @local @development @staging
  Scenario: Deleting the audio media leaves the episode page readable
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example Lost Audio Episode 74509"
      And I fill in "Summary" with "Summary for the lost audio test episode 74509."
      And I add the first available cover art from the media library
      And I open the "Audio" tab on the podcast form
      And I open the media library for the "Audio" field
      And I upload the audio file "varbase-example-lost-audio-episode.mp3" to the open media library
      And I save the podcast episode
     Then the episode page should play media from "varbase-example-lost-audio-episode"
     When I delete the "varbase-example-lost-audio-episode.mp3" media item
     Then I should see "has been deleted"
     When I go to "/podcasts/varbase-example-authoring-podcast/varbase-example-lost-audio-episode-74509"
     Then the page title should contain "Varbase Example Lost Audio Episode 74509 | "
      And I should see "Summary for the lost audio test episode 74509."
      And the podcast episode page should offer no audio
