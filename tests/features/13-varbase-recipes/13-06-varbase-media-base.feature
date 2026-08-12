@regression @any @media
Feature: Varbase Recipe - Media Base (media types + library)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: The media types are available on the media add page
     When I go to "/media/add"
      And wait
      And I wait for the text "Image" to appear
     Then I should see "Image"
      And I should see "Video"
      And I should see "Remote video"
      And I should see "Document"
