@podcasts @seo
Feature: Podcasts Base - Search engine basics on an episode
      As a site owner
      I want every episode page to carry a clean URL and its search metadata
      So that search engines and social networks present the episode well.

  @regression @local @development @staging @production
  Scenario: An episode page carries its title tag, meta description and canonical URL
    Given I am an anonymous user
     When I go to "/podcasts/varbase-example-podcast-one/varbase-example-episode-01"
     Then the page title should contain "Varbase Example Episode 01 | "
      And the meta tag should exist with the following attributes:
        | name    | description                                                                                                          |
        | content | Example podcast episode number 01 used by the Varbase Podcasts Base functional testing suite. This episode has an uploaded audio file. |
      And the "description" meta tag should not contain any HTML tags
      And the meta tag should exist with the following attributes:
        | property | og:title                   |
        | content  | Varbase Example Episode 01 |
      And the canonical URL should end with "/podcasts/varbase-example-podcast-one/varbase-example-episode-01"

  @regression @local @development @staging
  Scenario: A new episode gets its URL alias from the podcast pattern
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/podcast_episode"
      And I assign the episode to the "Varbase Example Authoring Podcast" podcast
      And I fill in "Title" with "Varbase Example Alias Episode 74512"
      And I fill in "Summary" with "Summary for the URL alias test episode 74512."
      And I add the first available cover art from the media library
      And I save the podcast episode
     Then the path should be "/podcasts/varbase-example-authoring-podcast/varbase-example-alias-episode-74512"
      And the meta tag should exist with the following attributes:
        | name    | description                                    |
        | content | Summary for the URL alias test episode 74512. |
