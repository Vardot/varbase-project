# REASONS canvas
# Requirements: A visitor who searches gets a readable results page: a heading, their own
#               keyword still in the filter bar, one linked result per row, a count they can
#               read, and a plain notice when nothing matches.
# Entities:     Search results view at /search, exposed "keywords" filter in the results
#               filter bar, result rows, result summary, empty state.
# Approach:     Go straight to /search with a keyword in the query string, the same URL the
#               header search produces, then assert what the visitor reads. Search for
#               "Varbase", which the Varbase Starter demo content always contains.
# Structure:    Canvas page at /search holding the search view's results block, with its
#               own exposed keyword form from Varbase Starter.
# Operations:   1 heading and filter bar - 2 keyword survives the round trip -
#               3 results are listed and linked - 4 result summary is shown -
#               5 searching again from the results page works - 6 empty state.
# Norms:        Anonymous access; the visitor's own words are echoed back, never dropped.
# Safeguards:   A query with no matches renders the empty-state notice, never an error page
#               and never a stale result list. Result links are clicked scoped to their row:
#               a title like "About Varbase" also appears in the main nav and the footer.
#
# Two inputs are named "keywords" on this page, the header one and the results one, and
# both can carry the same label. The search steps scope to the results form; their
# selectors are in tests/selectors/default-theme.json.
@regression @any @content @search
Feature: Frontend Pages - Search results - Results page and empty state
      As a site visitor
      I want a readable search results page
      So that I can find the content I searched for, or be told plainly that there is none.

  @check @local @development @staging @production
  Scenario: Check that the search results page has its own heading and filter bar
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then I should see "Search"
      And the search results keyword field should be visible
      And the search results keyword field should show the placeholder "Search by keyword"

  @check @local @development @staging @production
  Scenario: Check that the search results page keeps the keyword the visitor searched for
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then the search results keyword field should hold "Varbase"

  @critical @check @local @development @staging @production
  Scenario: Check that matching content is listed on the search results page
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then every search result should link to its content
      And I should not see "No results match your search. Try other keywords or clear the filters."

  @check @local @development @staging @production
  Scenario: Check that each search result is a link the visitor can follow
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then every search result should link to its content
     When I follow the first search result
      And wait
     Then I should be on the page of the search result I followed
      And I should not see "Page not found"

  @check @local @development @staging @production
  Scenario: Check that the search results page tells the visitor how many results there are
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then I should see text matching "Displaying [0-9]+ - [0-9]+ of [0-9]+ results"

  @check @local @development @staging @production
  Scenario: Check that a visitor can search again from the search results page
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
      And I search again from the results page for "Blog"
      And wait until the URL contains "keywords=Blog"
     Then current url should have the "keywords" parameter with the "Blog" value
      And the search results keyword field should hold "Blog"

  @check @local @development @staging @production
  Scenario: Check that a search with no matches shows the empty state notice
    Given I am an anonymous user
     When I go to "/search?keywords=zzqqxxnoresultshere"
      And wait
     Then I should see "No results match your search. Try other keywords or clear the filters."
      And I should not see "Page not found"
      And I should not see "The website encountered an unexpected error"
