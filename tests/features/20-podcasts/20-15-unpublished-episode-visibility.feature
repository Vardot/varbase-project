@podcasts @permissions @security
Feature: Podcasts Base - Unpublished episodes stay private
      As a Content editor
      I want an episode that is not published yet to stay out of public view
      So that listeners never meet a draft on the site, in search or in the sitemap.

  @regression @security @local @development @staging
  Scenario: A draft episode is hidden from anonymous users everywhere a listener looks
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Podcast One" podcast
      And I fill in "Title" with "Varbase Example Draft Episode 74511"
      And I fill in "Summary" with "Summary for the private draft episode 74511."
      And I add the first available cover art from the media library
      And I select "Draft" from "Save as"
      And I save the podcast episode
     Then the page title should contain "Varbase Example Draft Episode 74511 | "
     When I logout
      And I am a logged in user with the "webmaster" user
      And I regenerate the XML sitemap
      And I logout
      And I am an anonymous user
     Then I should be denied access to "/podcasts/varbase-example-podcast-one/varbase-example-draft-episode-74511"
     When I go to "/podcast-episodes?search=74511"
     Then I should see "There are no podcast episodes yet."
      And I should not see "Varbase Example Draft Episode 74511"
     When I go to "/search?keywords=74511"
     Then I should not see "Varbase Example Draft Episode 74511"
     When I go to "/search?keywords=episode"
     Then I should see "Varbase Example Episode"
     When I go to "/sitemap.xml"
     Then I should see "/podcasts/varbase-example-podcast-one/varbase-example-episode-02"
      And I should not see "/podcasts/varbase-example-podcast-one/varbase-example-draft-episode-74511"
     When I go to "/podcasts"
     Then the "Varbase Example Podcast One" podcast should be listed with 10 episodes
     When I go to "/podcasts/varbase-example-podcast-one"
     Then I should see "10 Episodes"
      And I should not see "Varbase Example Draft Episode 74511"
