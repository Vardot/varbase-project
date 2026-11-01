@podcasts @permissions
Feature: Podcasts Base - Podcast and Podcast episode permissions
      As a site administrator
      I want podcast and episode authoring restricted to editorial roles
      So that only trusted users can publish to the podcast.

  @regression @local @development @staging @production
  Scenario: An anonymous user cannot create a podcast or an episode but can read a published one
    Given I am an anonymous user
     Then I should be denied access to "/node/add/podcast_episode"
      And I should be denied access to "/node/add/podcast"
      And I should be allowed "/podcasts/varbase-example-podcast-one/varbase-example-episode-02"
      And the page title should contain "Varbase Example Episode 02 | "

  @regression @local @development @staging @production
  Scenario: A Normal user cannot create a podcast or an episode but can read a published one
    Given I am a logged in user with the "Normal user" user
     Then I should be denied access to "/node/add/podcast_episode"
      And I should be denied access to "/node/add/podcast"
      And I should be allowed "/podcasts/varbase-example-podcast-one/varbase-example-episode-02"

  @regression @local @development @staging @production
  Scenario Outline: Editorial roles can reach the Podcast and Podcast episode creation forms
    Given I am a logged in user with the "<role>" user
     When I go to "/node/add/podcast_episode"
     Then the page title should contain "Create Podcast episode"
      And I see visible podcast title field
     When I go to "/node/add/podcast"
     Then the page title should contain "Create Podcast"
      And I see visible podcast title field

    Examples:
      | role           |
      | Content editor |
      | Content admin  |
      | SEO admin      |
      | Site admin     |
      | webmaster      |
