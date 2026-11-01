@events
Feature: Events - Events listing - Cards, summary, filters and pager
      As a site visitor
      I want an events listing with cards, a summary and filters
      So that I can browse and narrow down the events.

  @check @local @development @staging @production
  Scenario: Check the events listing shows event cards and a result summary
    Given I am an anonymous user
     When I go to "/events?search=Varbase+Example+Event"
     Then I should see text matching "1-12 of 15"
      And I should see "Varbase Example Event 01"
      And the page should link to "/events/varbase-example-event-01"

  @check @local @development @staging @production
  Scenario: Check the events listing offers only the Search by and Type filters
    Given I am an anonymous user
     When I go to "/events"
     Then I should see "Search by"
      And I should see "Type"
      And I should not see "Industry"

  @check @local @development @staging @production
  Scenario: Verify filtering the events listing by keyword narrows the results
    Given I am an anonymous user
     When I go to "/events"
      And I fill in the events keyword filter with "Varbase Example Event"
      And I press "Apply Filter"
     Then the events result summary should show a total of 15
      And I should see "Varbase Example Event 01"

  @check @local @development @staging @production
  Scenario: Verify filtering the events listing by keyword and Type narrows the results
    Given I am an anonymous user
     When I go to "/events"
      And I fill in the events keyword filter with "Varbase Example Event"
      And I choose "Workshop" in the events Type filter
      And I press "Apply Filter"
     Then the events result summary should show a total of 8

  @check @local @development @staging @production
  Scenario: Verify the events listing pages past the first 12 events
    Given I am an anonymous user
     When I go to "/events"
      And I fill in the events keyword filter with "Varbase Example Event"
      And I press "Apply Filter"
     Then the events result summary should show a total of 15
      And I should see text matching "1-12 of 15"
      And I see visible listing pager
     When I go to "/events?search=Varbase+Example+Event&page=1"
     Then I should see text matching "13-15 of 15"
