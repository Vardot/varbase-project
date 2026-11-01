@news
Feature: News - News listing - Cards, summary, filters and pager
      As a site visitor
      I want a news listing with cards, a summary and filters
      So that I can browse and narrow down the news.

  @check @local @development @staging @production
  Scenario: Check the news listing shows news cards and a result summary
    Given I am an anonymous user
     When I go to "/news?search=Varbase+Example+News"
     Then I should see text matching "1-12 of 15"
      And I should see "Varbase Example News 01"
      And the page should link to "/news/varbase-example-news-01"

  @check @local @development @staging @production
  Scenario: Check the news listing offers the keyword, Type and Industry filters
    Given I am an anonymous user
     When I go to "/news?search=Varbase+Example+News"
     Then I should see "Search by"
      And I should see "Type"
      And I should see "Industry"

  @check @local @development @staging @production
  Scenario: Verify filtering the news listing by keyword narrows the results
    Given I am an anonymous user
     When I go to "/news"
      And I fill in "Search by" with "Varbase Example News"
      And I press "Apply Filter"
     Then the news result summary should show a total of 15
      And I should see "Varbase Example News 01"

  @check @local @development @staging @production
  Scenario: Verify filtering the news listing by keyword and Type narrows the results
    Given I am an anonymous user
     When I go to "/news"
      And I fill in "Search by" with "Varbase Example News"
      And I choose "Announcements" in the news Type filter
      And I press "Apply Filter"
     Then the news result summary should show a total of 8

  @check @local @development @staging @production
  Scenario: Verify the news listing pages past the first 12 news posts
    Given I am an anonymous user
     When I go to "/news"
      And I fill in "Search by" with "Varbase Example News"
      And I press "Apply Filter"
     Then the news result summary should show a total of 15
      And I should see text matching "1-12 of 15"
      And I see visible listing pager
     When I go to "/news?search=Varbase+Example+News&page=1"
     Then I should see text matching "13-15 of 15"
