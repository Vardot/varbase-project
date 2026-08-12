@regression @any @content
Feature: Varbase Recipe - Webform Base (contact form)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The webforms admin lists a contact form
     When I go to "/admin/structure/webform"
      And wait
      And I wait for the text "Webforms" to appear
     Then I should see "Webforms"
      And I should see "Contact"

  # Logical behaviour: the contact webform is fully built (its fields exist)
  # and its submissions results view is reachable for the webmaster.
  @check @recipes @local @development @staging @production
  Scenario: The contact webform exposes its fields and a submissions results view
     When I go to "/admin/structure/webform/manage/contact"
      And wait
      And I wait for the text "Your Name" to appear
     Then I should see "Your Name"
      And I should see "Your Email"
      And I should see "Subject"
      And I should see "Message"
     When I go to "/admin/structure/webform/manage/contact/results/submissions"
      And wait
      And I wait for the text "Results" to appear
     Then I should see "Results"
