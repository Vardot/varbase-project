@events
Feature: Events - Authoring - Create an event
      As a Content editor
      I want to create an event with all of its fields
      So that the event page presents the schedule, place and details to visitors.

  @check @local @development @staging
  Scenario: Verify a Content editor creates an event and its page shows the details
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/event"
      And I fill in "Title" with "Varbase Example Authoring Event 73501"
      And I set the event "When" date to "2027-03-18" and time "10:00:00"
      And I fill in "Location" with "Authoring Hall, 5 Editor Road"
      And I fill in "Description" with "Short summary for the authoring test event 73501."
      And I fill in "Type" with "Workshop"
      And I save the event
     Then I should see "Varbase Example Authoring Event 73501"
      And I should see "Mar 18, 2027"
      And I should see "Authoring Hall, 5 Editor Road"
     When I delete the event I am viewing
     Then I should see "has been deleted"
