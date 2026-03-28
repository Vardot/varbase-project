Feature: Content Structure - Drupal Canvas Editor
      As a site admin user
      I want to access and use the Drupal Canvas page editor
      So that I can visually build and edit pages.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Canvas editor for the Home page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
      And I click "Edit" in the "Home" row
      And wait
     Then I should see "Library"
      And I should see "Preview"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Canvas editor for the Blog page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
      And I click "Edit" in the "Blog" row
      And wait
     Then I should see "Library"
      And I should see "Preview"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Canvas editor for the Contact Us page
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
      And I click "Edit" in the "Contact Us" row
      And wait
     Then I should see "Library"
      And I should see "Preview"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Pages listing
    Given I am an anonymous user
     When I go to "/admin/content/pages"
      And wait
     Then I should not see "Pages"
      And I should not see "Edit"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Pages listing
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/content/pages"
      And wait
     Then I should not see "Pages"
