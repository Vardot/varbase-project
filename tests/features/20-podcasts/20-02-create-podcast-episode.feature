@podcasts @authoring
Feature: Podcasts Base - Authoring a podcast episode
      As a Content editor
      I want to create a podcast episode with its fields
      So that the episode page presents the episode to listeners.

  @regression @local @development @staging
  Scenario: A Content editor creates a podcast episode and its page shows what was entered
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example Authoring Episode 74501"
      And I fill in "Summary" with "Short summary for the authoring test episode 74501."
      And I add the first available cover art from the media library
      And I open the "Audio" tab on the podcast form
      And I fill in "Duration" with "44 Mins"
      And I fill in "Episode number" with "74501"
      And I save the podcast episode
     Then the page title should contain "Varbase Example Authoring Episode 74501 | "
      And I should see "Short summary for the authoring test episode 74501."
      And I should see "44 Mins"
      And I see visible episode cover art
     When I open the edit form for the podcast episode I am viewing
      And I open the "Audio" tab on the podcast form
     Then the field "Episode number" should have the value "74501"
     When I go to "/podcasts/varbase-example-authoring-podcast/varbase-example-authoring-episode-74501"
      And I delete the podcast episode I am viewing
     Then I should see "has been deleted"
