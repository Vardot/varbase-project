@search
Feature: Search - The Content Type facet - Narrow results by content type
      As a site visitor looking at search results
      I want a Content Type facet with counts
      So that I can narrow the results to the kind of content I am after.

  @check @local @development @staging @production
  Scenario: Check the facet offers each content type in the results with its count
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchtest"
     Then the search results summary should show a total of 15
      And the Content Type facet should offer "Blog post" with a count of 9
      And the Content Type facet should offer "Utility page" with a count of 6

  @check @local @development @staging @production
  Scenario: Verify choosing Blog post narrows the results to blog posts
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchtest"
      And I choose the "Blog post" Content Type facet
     Then the search results summary should show a total of 9
      And the search results should include "Varbase Example Search Blog 01"
      And the search results should not include "Varbase Example Search Page 01"

  @check @local @development @staging @production
  Scenario: Verify choosing Utility page narrows the results to utility pages
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchtest"
      And I choose the "Utility page" Content Type facet
     Then the search results summary should show a total of 6
      And the search results should include "Varbase Example Search Page 01"
      And the search results should not include "Varbase Example Search Blog 01"

  @check @local @development @staging @production
  Scenario: Check a search with one result facets only that result's content type
    Given I am an anonymous user
     When I go to "/search?keywords=Varbasesearchsingle"
     Then the Content Type facet should offer "Blog post" with a count of 1
