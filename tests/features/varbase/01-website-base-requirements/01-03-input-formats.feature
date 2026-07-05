Feature: Content Editing - Rich Text Editor - Input formats
      As a logged in user with a permission to edit content
      I want to be able to switch between input formats
      So that can use different type of rich text editors.
  @local @development @staging @production
  Scenario: Check if Site Admin user can change the text format for the body of Basic page
    Given I am a logged in user with the "Site admin" user
     When I go to "/node/add/page"
      And wait
     Then I should see "Create Basic page"
      And I should see "Body"
      And I should not see "HTML Editor"
     When I select "full_html" from "Text format"
      And I wait for AJAX to finish
     Then "#edit-body-0-value" should be attached
     When I select "basic_html" from "Text format"
      And I wait for AJAX to finish
     Then "#edit-body-0-value" should be attached
     When I select "code_html" from "Text format"
      And I wait for AJAX to finish
     Then "#edit-body-0-value" should be attached
      And ".ck.ck-editor__main" should not be visible
  @local @development @staging @production
  Scenario: Check if Super Admin user can change the text format for the body of Basic page
    Given I am a logged in user with the "Super admin" user
     When I go to "/node/add/page"
      And wait
     Then I should see "Create Basic page"
      And I should see "Body"
     When I select "full_html" from "Text format"
      And I wait for AJAX to finish
     Then "#edit-body-0-value" should be attached
     When I select "basic_html" from "Text format"
      And I wait for AJAX to finish
     Then "#edit-body-0-value" should be attached
     When I select "code_html" from "Text format"
      And I wait for AJAX to finish
     Then "#edit-body-0-value" should be attached
      And ".ck.ck-editor__main" should not be visible
