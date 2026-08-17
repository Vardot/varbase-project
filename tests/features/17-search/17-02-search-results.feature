# REASONS canvas
# Requirements: A visitor who searches gets a readable results page: a heading, their own
#               keyword still in the filter bar, one linked result per row, a count they can
#               read, and a plain notice when nothing matches.
# Entities:     Search results view at /search, exposed "keywords" filter in the results
#               filter bar, result rows, result summary, empty state.
# Approach:     Go straight to /search with a keyword in the query string, the same URL the
#               header search produces, then assert what the visitor reads. Search for
#               "Varbase", which the Varbase Starter demo content always contains.
# Structure:    Views page display at /search rendering search-indexed content, with its own
#               exposed filter bar from Vartheme (Bootstrap 5).
# Operations:   1 heading and filter bar - 2 keyword survives the round trip -
#               3 results are listed and linked - 4 result summary is shown -
#               5 searching again from the results page works - 6 empty state.
# Norms:        Anonymous access; the visitor's own words are echoed back, never dropped.
# Safeguards:   A query with no matches renders the empty-state notice, never an error page
#               and never a stale result list. Result links are clicked scoped to their row:
#               a title like "About Varbase" also appears in the main nav and the footer.
#
# Two inputs are named "keywords" on this page: the collapsed header one inside
# .icon-toggle__panel and the visible results one inside .vb-filter-bar. Every step below
# scopes to .vb-filter-bar. A bare input[name='keywords'] selector matches the hidden header
# field first. Do not match on the accessible name either: both fields can carry the same
# label, which makes a label-based lookup ambiguous.
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
      And ".vb-filter-bar input[name='keywords']" should be visible
      And ".vb-filter-bar input[name='keywords']" should have attribute "placeholder" with value "Search by keyword"

  @check @local @development @staging @production
  Scenario: Check that the search results page keeps the keyword the visitor searched for
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then ".vb-filter-bar input[name='keywords']" should have value "Varbase"

  @critical @check @local @development @staging @production
  Scenario: Check that matching content is listed on the search results page
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then "div.views-row" should be visible
      And I should not see "There are no results for your search, please try another query."

  @check @local @development @staging @production
  Scenario: Check that each search result is a link the visitor can follow
    Given I am an anonymous user
     When I go to "/search?keywords=Varbase"
      And wait
     Then "div.views-row a" should be visible
     When I click on the element ".views-row a[href='/about-varbase']"
      And wait
     Then I should be on the "/about-varbase" page
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
      And I fill in the field ".vb-filter-bar input[name='keywords']" with "Blog"
      And I click on the element ".vb-filter-bar input[type='submit']"
      And wait until the URL contains "keywords=Blog"
     Then current url should have the "keywords" parameter with the "Blog" value
      And ".vb-filter-bar input[name='keywords']" should have value "Blog"

  @check @local @development @staging @production
  Scenario: Check that a search with no matches shows the empty state notice
    Given I am an anonymous user
     When I go to "/search?keywords=zzqqxxnoresultshere"
      And wait
     Then I should see "There are no results for your search, please try another query."
      And I should not see "Page not found"
      And I should not see "The website encountered an unexpected error"
