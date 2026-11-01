@search @a11y
Feature: Search - Accessibility - The search page in every state
      As a visitor who uses a screen reader, a keyboard or zoom
      I want the search page to be accessible in every state it can be in
      So that I can search the site and narrow the results like anyone else.

  @check @local @development @staging @production
  Scenario: Check the search page before a search has no serious accessibility violations
    Given I am an anonymous user
     When I go to "/search"
     Then I should see "Date Published"
      And the page should have no serious accessibility violations

  @check @local @development @staging @production
  Scenario: Check every search field on the search page has an accessible label
    Given I am an anonymous user
     When I go to "/search"
     Then I see visible search keywords
      And every form field should have an accessible label

  @check @local @development @staging @production
  Scenario: Check the search results have no serious accessibility violations
    Given I am an anonymous user
     When I go to "/search"
      And I search for "Varbasesearchtest"
     Then the search results summary should show a total of 15
      And the page should have no serious accessibility violations

  @check @local @development @staging @production
  Scenario: Check the search results pass the full accessibility check
    Given I am an anonymous user
     When I go to "/search"
      And I search for "Varbasesearchtest"
     Then the search results summary should show a total of 15
      And the page should pass the full accessibility check

  @check @local @development @staging @production
  Scenario: Check a search with no results has no serious accessibility violations
    Given I am an anonymous user
     When I go to "/search"
      And I search for "Zzzznothingmatchesthis"
     Then I should see "No results match your search. Try other keywords or clear the filters."
      And the page should have no serious accessibility violations

  @check @local @development @staging @production
  Scenario: Check results narrowed by content type have no serious accessibility violations
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchtest"
      And I choose the "Blog post" Content Type facet
     Then the search results summary should show a total of 9
      And the page should have no serious accessibility violations

  @check @local @development @staging @production
  Scenario: Check results narrowed by date published have no serious accessibility violations
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchtest"
      And I choose the "Past year" Date Published filter
     Then the "Past year" Date Published filter should be chosen
      And the search results summary should show a total of 12
      And the page should have no serious accessibility violations
