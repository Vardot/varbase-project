Feature: Content Editing - Rich Text Editor - Input formats
      As a logged in user with a permission to edit content
      I want to be able to use the rich text editor
      So that I can format content properly.

  @javascript @local @development @staging @production
  Scenario: Check if Site Admin user can access the rich text editor on Utility page
    Given I am a logged in user with the "Site admin"
     When I go to "/node/add/page"
      And wait
     Then I should see "Create Utility page"
      And I should see "Content"

  @javascript @local @development @staging @production
  Scenario: Check if Super Admin user can access the rich text editor on Utility page
    Given I am a logged in user with the "Super admin"
     When I go to "/node/add/page"
      And wait
     Then I should see "Create Utility page"
      And I should see "Content"
