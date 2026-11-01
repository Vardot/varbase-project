@events
Feature: Events - Related events - Other events on an event page
      As a site visitor reading an event
      I want to see other related events
      So that I can discover more events like the one I am reading.

  @check @local @development @staging @production
  Scenario: Check the related events list other events and leave out the current one
    Given I am an anonymous user
     When I go to "/events/varbase-example-event-01"
     Then I should see "Events you may also like"
      And eventually I should see "Varbase Example Event 02" within 10 seconds
      And the page should not link to "/events/varbase-example-event-01"
