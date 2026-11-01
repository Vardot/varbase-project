@search
Feature: Search - The search page - Keyword bar, facet and date filter
      As a site visitor
      I want a search page with a keyword bar, results, a Content Type facet and a Date Published filter
      So that I can find content on the site and narrow down what I find.

  @check @local @development @staging @production
  Scenario: Check the search page is open to an anonymous visitor with its facet and filter
    Given I am an anonymous user
     When I go to "/search"
     Then the response status code should be 200
      And I should see "Search"
      And I should see "Content Type"
      And I should see "Date Published"

  @check @local @development @staging @production
  Scenario: Check the search page offers the keyword bar and the Date Published options
    Given I am an anonymous user
     When I go to "/search"
     Then I see visible search keywords
      And I see visible search date form
      And I should see "Any time"
      And I should see "Past 24 hours"
      And I should see "Past week"
      And I should see "Past month"
      And I should see "Past year"
      And the "Any time" Date Published filter should be chosen

  @check @local @development @staging @production
  Scenario: Check the search page lists and facets nothing until a keyword is given
    Given I am an anonymous user
     When I go to "/search"
     Then the Content Type facet should offer no content types
      And I should see "Date Published"
      And I should not see "Varbase Example Search Blog 01"

  @check @local @development @staging @production
  Scenario: Check the Search result view mode is there for a site builder
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/structure/display-modes/view"
     Then the response status code should be 200
      And I should see "Search result"
