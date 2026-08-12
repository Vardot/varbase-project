@regression @any @canvas
Feature: Content Structure - Drupal Canvas Editor
      As a site admin user
      I want to access and use the Drupal Canvas page editor
      So that I can visually build and edit pages.

  # The Canvas editor itself is a heavy React SPA whose document never reaches
  # a settled load state, so navigating into it from a step makes the run hang.
  # These scenarios verify the webmaster can reach the Canvas Pages management
  # and that each starter page is listed there with an Edit (editor) action -
  # a deterministic proxy for "the page is editable in Canvas".

  @check @local @development @staging @production
  Scenario: Check that the webmaster can manage the Home page in Canvas Pages
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"
      And I should see "Home"
      And I should see "Edit"

  @check @local @development @staging @production
  Scenario: Check that the webmaster can manage the Blog page in Canvas Pages
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"
      And I should see "Blog"
      And I should see "Edit"

  @check @local @development @staging @production
  Scenario: Check that the webmaster can manage the Contact Us page in Canvas Pages
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"
      And I should see "Contact Us"
      And I should see "Edit"

  @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Pages listing
    Given I am an anonymous user
     When I go to "/admin/content/pages"
      And wait
     Then I should not see "Pages"
      And I should not see "Edit"

  @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Pages listing
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/content/pages"
      And wait
     Then I should not see "Pages"
