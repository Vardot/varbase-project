Feature: Content Structure - Utility Page
      As a logged in user with a permission to manage Utility pages
      I want to be able to add a "Utility page" to the site
      So that the "Utility page" will show up in the structured menu under its parent page

  @javascript @local @development @staging @production
  Scenario: Check if an authenticated user can NOT add content
    Given I am a logged in user with the "Normal user" user
     When I go to "/node/add"
      And wait
     Then I should see "You are not authorized to access this page."

  @javascript @local @development @staging @production
  Scenario: Check if a Content editor can add content of Utility page type
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add"
      And wait
     Then I should see "Utility page"

  @javascript @local @development @staging @production
  Scenario: Check if a Content Admin can add content of Utility page type
    Given I am a logged in user with the "Content admin" user
     When I go to "/node/add"
      And wait
     Then I should see "Utility page"

  @javascript @local @development @staging @production
  Scenario: Check if a Site Admin can add content of Utility page type
    Given I am a logged in user with the "Site admin" user
     When I go to "/node/add"
      And wait
     Then I should see "Utility page"

  @javascript @local @development @staging @production
  Scenario: Check if a Super Admin can add content of Utility page type
    Given I am a logged in user with the "Super admin" user
     When I go to "/node/add"
      And wait
     Then I should see "Utility page"

  @javascript @local @development @staging @production
  Scenario: Check if the admin can add content of Utility page type
    Given I am a logged in user with the "webmaster" user
     When I go to "/node/add"
      And wait
     Then I should see "Utility page"

  @javascript @local @development @staging @production
  Scenario: Check if a user with a permission to manage Utility page content type can create Utility pages content
    Given I am a logged in user with the "Super admin" user
     When I go to "/node/add/page"
      And wait
     Then I should see "Create Utility page"
      And I should see "Title"
      And I should see "Content"
