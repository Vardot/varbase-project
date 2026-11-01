@regression @any @content @search
Feature: Frontend Pages - Header search - Icon toggle and search box
      As a site visitor
      I want to open the search box from the header on any page
      So that I can search the site without leaving the page I am on.

  @check @local @development @staging @production
  Scenario: Check that the header shows a collapsed search icon to an anonymous visitor
    Given I am an anonymous user
     When I go to homepage
     Then I see visible header search button
      And the header search should be collapsed

  @check @local @development @staging @production
  Scenario: Check that the header search box is not reachable while the panel is collapsed
    Given I am an anonymous user
     When I go to homepage
     Then I see visible header search button
      And I don't see header search box

  @check @local @development @staging @production
  Scenario: Check that clicking the search icon reveals the header search box
    Given I am an anonymous user
     When I go to homepage
      And I click header search button
     Then I see visible header search box
      And the header search box should show the placeholder "Search by keyword"

  @check @local @development @staging @production
  Scenario: Check that the open search panel announces its state on the toggle
    Given I am an anonymous user
     When I go to homepage
      And I click header search button
     Then the header search should be expanded

  @check @local @development @staging @production
  Scenario: Check that the close control collapses the header search panel again
    Given I am an anonymous user
     When I go to homepage
      And I click header search button
     Then I see visible header search box
     When I click header search close button
     Then I don't see header search box
      And the header search should be collapsed

  @critical @check @local @development @staging @production
  Scenario: Check that submitting a keyword from the header reaches the search results page
    Given I am an anonymous user
     When I go to homepage
      And I click header search button
     Then I see visible header search box
     When I search the site from the header for "Varbase"
     Then current url should have the "keywords" parameter with the "Varbase" value
      And I should see "Search"
