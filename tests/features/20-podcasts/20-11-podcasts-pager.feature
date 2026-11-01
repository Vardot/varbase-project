@podcasts @listing
Feature: Podcasts Base - Podcasts listing pager
      As a site visitor
      I want the podcasts listing to paginate
      So that I can browse beyond the first page of episodes.

  @regression @local @development @staging @production
  Scenario: The podcasts listing paginates when there are more than 12 episodes
    Given I am an anonymous user
     When I go to "/podcast-episodes"
      And I fill in "Search by" with "Varbase Example Episode"
      And I press "Apply Filter"
     Then the podcasts result summary should show "1-12 of 15"
      And I see visible podcasts pager
     When I click podcasts next page link
     Then the podcasts result summary should show "13-15 of 15"
      And the podcasts listing should show 3 episode cards
      And I should see "Varbase Example Episode 15"
      And I should not see "Varbase Example Episode 01"
