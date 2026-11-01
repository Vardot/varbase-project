@search
Feature: Search - Who can search - Every visitor and every role
      As a site administrator
      I want everyone who visits the site to be able to search it
      So that search is not something only an editor can use.

  @check @local @development @staging @production
  Scenario: Check an anonymous visitor can search
    Given I am an anonymous user
     When I go to "/search"
      And I search for "Varbasesearchtest"
     Then the search results summary should show a total of 15

  @check @local @development @staging @production
  Scenario Outline: Check the "<role>" user can search
    Given I am a logged in user with the "<role>" user
     When I go to "/search"
      And I search for "Varbasesearchtest"
     Then the search results summary should show a total of 15

    Examples:
      | role           |
      | Normal user    |
      | Content editor |
      | webmaster      |
