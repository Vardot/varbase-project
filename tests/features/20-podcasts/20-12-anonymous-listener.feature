@podcasts @listing @listener
Feature: Podcasts Base - An anonymous listener finds and plays an episode
      As a site visitor with no account
      I want to find an episode from the podcasts listing and listen to it
      So that the podcast section works for its audience without signing in.

  @regression @smoke @local @development @staging @production
  Scenario: A listener browses the podcasts, narrows them down and plays an episode
    Given I am an anonymous user
     When I go to "/podcast-episodes"
      And I fill in "Search by" with "Varbase Example Episode"
      And I press "Apply Filter"
     Then the text "Varbase Example Episode 02" should appear after the text "Varbase Example Episode 01"
     When I click podcasts next page link
     Then eventually I should see "Varbase Example Episode 14" within 10 seconds
     When I go to "/podcast-episodes"
      And I fill in "Search by" with "Varbase Example Episode 03"
      And I press "Apply Filter"
      And I follow "Varbase Example Episode 03"
     Then the path should be "/podcasts/varbase-example-podcast-one/varbase-example-episode-03"
      And the page title should contain "Varbase Example Episode 03 | "
      And I see visible breadcrumb, episode title, episode cover art, episode player, episode share row
      And I see breadcrumb above episode title
      And I see episode title above episode player
      And the episode player should load its audio
      And I should see "Transcript for example podcast episode 03."
      And I should see "Share on Facebook"
      And "Home" should be in the breadcrumb
      And "Varbase Example Podcast One" should be in the breadcrumb
     When I click breadcrumb home link
     Then I should be on the homepage
