@podcasts @listing @shows
Feature: Podcasts Base - Podcast shows and their episodes
      As a site visitor
      I want to see each podcast with how many episodes it has, and each podcast's own episodes on its page
      So that I can pick a show and listen through it.

  @regression @local @development @staging @production
  Scenario: The podcasts listing shows each podcast with its episode count
    Given I am an anonymous user
     When I go to "/podcasts"
     Then the "Varbase Example Podcast One" podcast should be listed with 10 episodes
      And the "Varbase Example Podcast Two" podcast should be listed with 5 episodes
      And I should not see "Varbase Example Episode 01"

  @regression @local @development @staging @production
  Scenario: A listed podcast opens its show page
    Given I am an anonymous user
     When I go to "/podcasts"
      And I follow "Varbase Example Podcast Two"
     Then the path should be "/podcasts/varbase-example-podcast-two"
      And the page title should contain "Varbase Example Podcast Two | "
      And I should see "Example podcast two used by the Varbase Podcasts Base functional testing suite."

  @regression @local @development @staging @production
  Scenario: A show page lists only its own episodes
    Given I am an anonymous user
     When I go to "/podcasts/varbase-example-podcast-two"
     Then I should see "5 Episodes"
      And I should see "Varbase Example Episode 11"
      And I should see "Varbase Example Episode 15"
      And I should not see "Varbase Example Episode 01"
      And I should not see "Varbase Example Episode 10"

  @regression @local @development @staging @production
  Scenario: A show page loads its older episodes on demand
    Given I am an anonymous user
     When I go to "/podcasts/varbase-example-podcast-one"
     Then I should see "Varbase Example Episode 10"
      And I should see "Varbase Example Episode 04"
      And I should not see "Varbase Example Episode 03"
      And I should not see "Varbase Example Episode 11"
     When I click "View More Episodes"
     Then eventually I should see "Varbase Example Episode 01" within 10 seconds
      And I should see "Varbase Example Episode 03"
      And I should not see "Varbase Example Episode 11"

  @regression @local @development @staging @production
  Scenario: An episode page lives under its podcast's path
    Given I am an anonymous user
     When I go to "/podcasts/varbase-example-podcast-one"
      And I follow "Varbase Example Episode 10"
     Then the path should be "/podcasts/varbase-example-podcast-one/varbase-example-episode-10"
      And the page title should contain "Varbase Example Episode 10 | "
