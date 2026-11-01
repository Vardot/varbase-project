@podcasts @audio
Feature: Podcasts Base - Remote audio on an episode
      As a Content editor
      I want the episode's Audio field to accept audio hosted on a podcast platform
      So that a show published to SoundCloud or Spotify needs no file upload here.

  @regression @local @development @staging @production
  Scenario: The Audio field offers both a local and a remote audio media type
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I open the "Audio" tab on the podcast form
      And I open the media library for the "Audio" field
     Then the media library should offer the "Audio" media type
      And the media library should offer the "Remote audio" media type

  @regression @local @development @staging @production
  Scenario: A Content editor can reach the Remote audio media form
    Given I am a logged in user with the "Content editor" user
     When I go to "/media/add/remote_audio"
     Then I should see "Audio URL"
      And I see visible remote audio url field
      And the field "Audio URL" should be required
