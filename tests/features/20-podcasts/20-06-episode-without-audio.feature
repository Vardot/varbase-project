@podcasts @audio
Feature: Podcasts Base - An episode with no audio at all
      As a Content editor
      I want to draft an episode before its recording exists
      So that the show notes and cover art can be prepared ahead of the audio.

  @regression @local @development @staging
  Scenario: A Content editor saves an episode with no audio media referenced
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example No Audio Episode 74505"
      And I fill in "Summary" with "Summary for the no-audio test episode 74505."
      And I add the first available cover art from the media library
      And I open the "Audio" tab on the podcast form
      And I fill in "Duration" with "12 Mins"
      And I save the podcast episode
     Then the page title should contain "Varbase Example No Audio Episode 74505 | "
      And I should see "Summary for the no-audio test episode 74505."
      And I don't see episode player
      And the podcast episode page should offer no audio
     When I delete the podcast episode I am viewing
     Then I should see "has been deleted"

  @regression @local @development @staging @production
  Scenario: An anonymous visitor can read an episode that has no audio yet
    Given I am an anonymous user
     When I go to "/podcasts/varbase-example-podcast-two/varbase-example-episode-13"
     Then the page title should contain "Varbase Example Episode 13 | "
      And I should see "Transcript for example podcast episode 13."
      And the podcast episode page should offer no audio
