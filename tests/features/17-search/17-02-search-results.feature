@regression @any @content @search
Feature: Frontend Pages - Search results - Results page and empty state
      As a site visitor
      I want a readable search results page
      So that I can find the content I searched for, or be told plainly that there is none.

  @check @local @development @staging @production
  Scenario: Check that the search results page has its own heading and filter bar
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
     Then I should see "Search"
      And the search results keyword field should be visible
      And the search results keyword field should show the placeholder "Search by keyword"

  @check @local @development @staging @production
  Scenario: Check that the search results page keeps the keyword the visitor searched for
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
     Then the search results keyword field should hold "Varbase"

  @critical @check @local @development @staging @production
  Scenario: Check that matching content is listed on the search results page
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
     Then every search result should link to its content
      And I should not see "No results match your search. Try other keywords or clear the filters."

  @check @local @development @staging @production
  Scenario: Check that each search result is a link the visitor can follow
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
     Then every search result should link to its content
     When I follow the first search result
     Then I should be on the page of the search result I followed
      And I should not see "Page not found"

  @check @local @development @staging @production
  Scenario: Check that the search results page tells the visitor how many results there are
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
     Then I should see text matching "Displaying [0-9]+ - [0-9]+ of [0-9]+ results"

  @check @local @development @staging @production
  Scenario: Check that a visitor can search again from the search results page
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And I search again from the results page for "Blog"
      And wait until the URL contains "keywords=Blog"
     Then current url should have the "keywords" parameter with the "Blog" value
      And the search results keyword field should hold "Blog"

  @check @local @development @staging @production
  Scenario: Check that a search with no matches shows the empty state notice
    Given I am an anonymous user
     When I go to "/search?keywords=zzqqxxnoresultshere"
     Then I should see "No results match your search. Try other keywords or clear the filters."
      And I should not see "Page not found"
      And I should not see "The website encountered an unexpected error"
