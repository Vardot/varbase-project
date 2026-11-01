@podcasts @authoring @workflow
Feature: Podcasts Base - Publishing an episode through the editorial workflow
      As a Content editor
      I want to prepare a complete episode and send it for review
      So that a Content admin can publish it to the podcasts listing.

  @regression @smoke @local @development @staging
  Scenario: An episode written by a Content editor is published by a Content admin and reaches the listing
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example Journey Episode 74510"
      And I fill in "Summary" with "A complete episode written for the editorial journey test 74510."
      And I add the first available cover art from the media library
      And I open the "Audio" tab on the podcast form
      And I open the media library for the "Audio" field
      And I select the media "Varbase Example Episode Audio"
      And I insert the selected media
     Then the "Audio" field should show the selected media item "Varbase Example Episode Audio"
     When I fill in "Duration" with "31 Mins"
      And I fill in "Episode number" with "74510"
      And I open the "General" tab on the podcast form
      And I fill in the rich text editor field "Show notes" with "<p>Transcript of the editorial journey episode 74510.</p>"
      And I select "In review" from "Save as"
      And I save the podcast episode
     Then the page title should contain "Varbase Example Journey Episode 74510 | "
     When I logout
      And I am an anonymous user
      And I go to "/podcast-episodes?search=74510"
     Then I should not see "Varbase Example Journey Episode 74510"
      And I should see "There are no podcast episodes yet."
     When I am a logged in user with the "Content admin" user
      And I go to "/podcasts/varbase-example-authoring-podcast/varbase-example-journey-episode-74510"
      And I open the edit form for the podcast episode I am viewing
      And I select "Published" from "Change to"
      And I save the podcast episode
      And I logout
      And I am an anonymous user
      And I go to "/podcast-episodes?search=Varbase+Example"
     Then I should see "Varbase Example Journey Episode 74510"
      And the text "Varbase Example Episode 01" should appear after the text "Varbase Example Journey Episode 74510"
     When I follow "Varbase Example Journey Episode 74510"
     Then the path should be "/podcasts/varbase-example-authoring-podcast/varbase-example-journey-episode-74510"
      And I should see "A complete episode written for the editorial journey test 74510."
      And I should see "Transcript of the editorial journey episode 74510."
      And I should see "31 Mins"
      And I see visible episode cover art, episode player
      And the episode player should load its audio
