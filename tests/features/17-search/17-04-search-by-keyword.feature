@search
Feature: Search - Searching by keyword - Results that match the keyword
      As a site visitor
      I want the keyword bar to search the site's content
      So that I only see the content that matches what I typed.

  @check @local @development @staging @production
  Scenario: Verify a keyword returns the content that carries it
    Given I am an anonymous user
     When I go to "/search"
      And I search for "Varbasesearchtest"
     Then the search results summary should show a total of 15
      And the search results should list 10 items

  @check @local @development @staging @production
  Scenario: Verify a keyword that only one item carries narrows the results to that item
    Given I am an anonymous user
     When I go to "/search"
      And I search for "Varbasesearchsingle"
     Then the search results summary should show a total of 1
      And the search results should include "Varbase Example Search Blog 07"
      And the search results should not include "Varbase Example Search Blog 01"

  @check @local @development @staging @production
  Scenario: Verify a search opens the page of the content it found
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchsingle"
      And I open the "Varbase Example Search Blog 07" search result
     Then the response status code should be 200
      And I should see "Varbase Example Search Blog 07"

  @check @local @development @staging @production
  Scenario: Verify the results pager carries the visitor past the first page
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchtest"
     Then I should see text matching "1 - 10 of 15"
      And I see visible search pager
     When I go to "/search?keywords=Varbasesearchtest&page=1"
     Then I should see text matching "11 - 15 of 15"
      And the search results should list 5 items
