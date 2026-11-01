@events
Feature: Events - Event content type - The fields of an event
      As a Content editor
      I want an Event content type with the fields the events recipe defines
      So that I can capture an event's title, schedule, place, summary and media.

  @check @local @development @staging @production
  Scenario: Check the Event add form offers the event fields to a Content editor
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/event"
     Then I should see "Create Event"
      And I should see "Title"
      And I should see "When"
      And I should see "Location"
      And I should see "Description"
      And I should see "Type"
      And I should see "Featured image"
      And I should see "Body"
      And I see visible event location field, event type field
