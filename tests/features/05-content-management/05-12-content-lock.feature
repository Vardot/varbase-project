Feature: Content Management - Content Lock
      As a site manager
      I want content to be locked when being edited
      So that multiple editors do not overwrite each other's changes.

  @javascript @check @local @development @staging @production
  Scenario: Set up content lock test content as the webmaster
    Given I am a logged in user with the "webmaster" user
     When I go to "/node/add/blog"
      And wait
     Then I should see "Create Blog post"
     When I fill in "Test Content Lock Blog Post" for "Title"
      And I fill in "Test description for content lock blog post." for "#edit-field-description-0-value" by attr
      And I scroll to the bottom
      And I press the "Save" button
      And wait
     Then I should see "Test Content Lock Blog Post"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access and verify Content Lock settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/content/content_lock"
      And wait
     Then I should see "Content lock settings"
      And I should see "Verbose"
      And I should see "Lock timeout"
      And I should see "Entity type protected"
      And I should see "Content"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can see the Content Lock module is enabled
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/modules"
      And wait
     Then I should see "Content Lock"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access Content Lock settings
    Given I am an anonymous user
     When I go to "/admin/config/content/content_lock"
      And wait
     Then I should not see "Content lock settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access Content Lock settings
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/content/content_lock"
      And wait
     Then I should not see "Content lock settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content editors can not access Content Lock settings
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/config/content/content_lock"
      And wait
     Then I should not see "Content lock settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content admins can not access Content Lock settings
    Given I am a logged in user with the "Content admin" user
     When I go to "/admin/config/content/content_lock"
      And wait
     Then I should not see "Content lock settings"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content editor locking a Blog post prevents Content admin from editing it simultaneously
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/content"
      And wait
     Then I should see "Content"
     When I fill in "Test Content Lock Blog Post" for "Title"
      And I press the "Filter" button
      And wait
     Then I should see "Test Content Lock Blog Post"
     When I click "Edit" in the "Test Content Lock Blog Post" row
      And wait
     Then I should see "Test Content Lock Blog Post"
      And I should see "simultaneous editing"
     When I am an anonymous user
      And I am a logged in user with the "Content admin" user
      And I go to "/admin/content"
      And wait
     Then I should see "Content"
     When I fill in "Test Content Lock Blog Post" for "Title"
      And I press the "Filter" button
      And wait
     Then I should see "Test Content Lock Blog Post"
     When I click "Edit" in the "Test Content Lock Blog Post" row
      And wait
     Then I should see "This content is being edited by the user"
      And I should see "Break lock"
     When I click "Break lock"
      And wait
     Then I should see "Confirm break lock"
     When I press the "Confirm break lock" button
      And wait
     Then I should see "Test Content Lock Blog Post"
