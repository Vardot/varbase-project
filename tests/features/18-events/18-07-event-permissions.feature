@events
Feature: Events - Permissions - Who can author events
      As a site administrator
      I want event authoring restricted to the editorial roles
      So that only trusted users can create and manage events.

  @check @local @development @staging @production
  Scenario: Check an anonymous visitor cannot reach the Event creation form
    Given I am an anonymous user
     When I go to "/node/add/event"
     Then I should not see "Create Event"
      And I should see "Log in"

  @check @local @development @staging @production
  Scenario: Check a Normal user cannot reach the Event creation form
    Given I am a logged in user with the "Normal user" user
     When I go to "/node/add/event"
     Then I should not see "Create Event"
      And the response status code should be 403
      And I should see "You are not authorized to access this page."

  @check @local @development @staging @production
  Scenario Outline: Check the "<role>" user can reach the Event creation form
    Given I am a logged in user with the "<role>" user
     When I go to "/node/add/event"
     Then I should see "Create Event"

    Examples:
      | role           |
      | Content editor |
      | Content admin  |
      | webmaster      |

  @check @local @development @staging
  Scenario: Verify a Content editor can create, edit and delete an event
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/event"
      And I fill in "Title" with "Varbase Example Permission Event 73505"
      And I set the event "When" date to "2027-06-10" and time "08:30:00"
      And I fill in "Location" with "Permission Hall, 8 Editor Road"
      And I save the event
     Then I should see "Varbase Example Permission Event 73505"
     When I open the edit form for the event I am viewing
      And I fill in "Location" with "Permission Hall, 8 Editor Road (updated)"
      And I save the event
     Then I should see "Permission Hall, 8 Editor Road (updated)"
     When I delete the event I am viewing
     Then I should see "has been deleted"
