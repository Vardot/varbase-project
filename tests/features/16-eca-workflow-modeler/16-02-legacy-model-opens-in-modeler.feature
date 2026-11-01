@regression @any @workflow
Feature: Workflow Automation - Existing models open in the Workflow Modeler
      As a site admin user
      I want the shipped ECA models to open and render in the Workflow Modeler
      So that existing automations can be edited with the Workflow Modeler.

  @check @js-fail @local @development @staging @production
  Scenario: Check that the "Redirect 403 to Login" model draws its steps in the Workflow Modeler
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/eca/redirect_403_to_login/edit_with/workflow_modeler"
     Then I should see "ECA Model: Redirect 403 to Login"
      And I see visible workflow modeler canvas
      And the Workflow Modeler should draw at least 5 steps
      And I should see "Response created"
      And I should see "Redirect to URL"
      And there should be no JavaScript errors

  @check @js-fail @local @development @staging @production
  Scenario: Check that the "Enable full view mode for node type" model opens in the Workflow Modeler
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/eca/enable_full_view_mode_node_type/edit_with/workflow_modeler"
     Then I see visible workflow modeler canvas
      And the Workflow Modeler should draw at least 2 steps
      And there should be no JavaScript errors
