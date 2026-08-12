@regression @any @workflow
Feature: Workflow Automation - Existing models open in the Workflow Modeler
      As a site admin user
      I want a shipped ECA model to open and render in the Workflow Modeler
      So that existing automations can be edited with the Workflow Modeler.

  @check @js-fail @local @development @staging @production
  Scenario: Check that the "Redirect 403 to Login" model renders in the Workflow Modeler canvas
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/eca/redirect_403_to_login/edit_with/workflow_modeler"
      And wait
     Then ".react-flow" should be visible within 10 seconds
      And I wait until at least 2 elements match ".react-flow__node"
      And ".react-flow__node" should be visible within 10 seconds
      And there should be no JavaScript errors
