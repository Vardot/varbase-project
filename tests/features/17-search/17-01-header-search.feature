# REASONS canvas
# Requirements: A site visitor can reach site search from any page through the header.
#               Done when the icon is discoverable, its expanded state is announced,
#               it opens a usable search box, it can be closed again, and submitting a
#               keyword lands on the search results page carrying that keyword.
# Entities:     Header region, search icon toggle, header search box (exposed "keywords"
#               filter inside the toggle panel), search results page at /search.
# Approach:     Drive the real header on the front end as an anonymous visitor. Assert the
#               accessible name and aria-expanded state the component publishes, and the
#               visible placeholder of the search box, not the theme's classes.
# Structure:    Vartheme (Bootstrap 5) icon toggle component with a bar panel, holding the
#               Varbase Starter search block; results view exposed form posts to /search.
# Operations:   1 icon present and collapsed - 2 opening reveals the box -
#               3 open state is announced - 4 closing collapses it -
#               5 submitting a keyword reaches the results page with the keyword.
# Norms:        Anonymous access; accessible name and state exposed to assistive technology.
# Safeguards:   The header search box must not be reachable while the panel is collapsed.
#
# Two inputs are named "keywords" on the results page: the header one inside
# .icon-toggle__panel and the results filter bar one inside .vb-filter-bar. Every step
# below scopes to the containing region. Do not match on the accessible name: both fields
# can carry the same label, which makes a label-based lookup ambiguous.
@regression @any @content @search
Feature: Frontend Pages - Header search - Icon toggle and search box
      As a site visitor
      I want to open the search box from the header on any page
      So that I can search the site without leaving the page I am on.

  @check @local @development @staging @production
  Scenario: Check that the header shows a collapsed search icon to an anonymous visitor
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then "button.icon-toggle__button" should be visible
      And "button.icon-toggle__button" should have attribute "aria-label" with value "Search"
      And "button.icon-toggle__button" should have attribute "aria-expanded" with value "false"

  @check @local @development @staging @production
  Scenario: Check that the header search box is not reachable while the panel is collapsed
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then ".icon-toggle__panel input[name='keywords']" should not be visible

  @check @local @development @staging @production
  Scenario: Check that clicking the search icon reveals the header search box
    Given I am an anonymous user
     When I go to homepage
      And wait
      And I click on the element "button.icon-toggle__button"
     Then ".icon-toggle__panel input[name='keywords']" should be visible within 5 seconds
      And ".icon-toggle__panel input[name='keywords']" should have attribute "placeholder" with value "Search by keyword"

  @check @local @development @staging @production
  Scenario: Check that the open search panel announces its state on the toggle
    Given I am an anonymous user
     When I go to homepage
      And wait
      And I click on the element "button.icon-toggle__button"
     Then "button.icon-toggle__button" should have attribute "aria-expanded" with value "true" within 5 seconds
      And "button.icon-toggle__button" should have attribute "aria-label" with value "Close search"
      And "button.icon-toggle__close" should have attribute "aria-label" with value "Close search"

  @check @local @development @staging @production
  Scenario: Check that the close control collapses the header search panel again
    Given I am an anonymous user
     When I go to homepage
      And wait
      And I click on the element "button.icon-toggle__button"
     Then ".icon-toggle__panel input[name='keywords']" should be visible within 5 seconds
     When I click on the element "button.icon-toggle__close"
     Then ".icon-toggle__panel input[name='keywords']" should not be visible within 5 seconds
      And "button.icon-toggle__button" should have attribute "aria-expanded" with value "false"

  @critical @check @local @development @staging @production
  Scenario: Check that submitting a keyword from the header reaches the search results page
    Given I am an anonymous user
     When I go to homepage
      And wait
      And I click on the element "button.icon-toggle__button"
     Then ".icon-toggle__panel input[name='keywords']" should be visible within 5 seconds
     When I fill in the field ".icon-toggle__panel input[name='keywords']" with "Varbase"
      And I press the key "Enter" on the element ".icon-toggle__panel input[name='keywords']"
      And wait until the URL contains "/search"
     Then current url should have the "keywords" parameter with the "Varbase" value
      And I should see "Search"
