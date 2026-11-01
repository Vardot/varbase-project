@podcasts @authoring
Feature: Podcasts Base - Editing a podcast episode
      As a Content editor
      I want to edit an episode I created
      So that I can correct its details after publishing.

  @regression @local @development @staging
  Scenario: A Content editor edits an episode's title and duration
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example Edit Episode 74502 before"
      And I fill in "Summary" with "Summary for the edit test episode 74502."
      And I add the first available cover art from the media library
      And I open the "Audio" tab on the podcast form
      And I fill in "Duration" with "12 Mins"
      And I save the podcast episode
     Then the page title should contain "Varbase Example Edit Episode 74502 before | "
     When I open the edit form for the podcast episode I am viewing
      And I fill in "Title" with "Varbase Example Edit Episode 74502 after"
      And I open the "Audio" tab on the podcast form
      And I fill in "Duration" with "58 Mins"
      And I save the podcast episode
     Then the page title should contain "Varbase Example Edit Episode 74502 after | "
      And I should see "58 Mins"
      And I should not see "12 Mins"
      And I should not see "Varbase Example Edit Episode 74502 before"
     When I reload the page
     Then I should see "58 Mins"
     When I delete the podcast episode I am viewing
     Then I should see "has been deleted"
