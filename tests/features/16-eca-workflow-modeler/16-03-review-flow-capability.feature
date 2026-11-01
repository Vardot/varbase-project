@regression @any @workflow
Feature: Workflow Automation - Workflow Modeler review capability
      As a site admin user
      I want the Workflow Modeler to offer its Review flow control on a model
      So that I can review and replay an automation from the Workflow Modeler.

  @check @js-fail @local @development @staging @production
  Scenario: Check that the Workflow Modeler offers the Review flow control on a model event step
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/eca/redirect_403_to_login/edit_with/workflow_modeler"
     Then I see visible workflow modeler canvas
     When I click workflow modeler start step
     Then eventually I should see "Review flow" within 10 seconds
      And there should be no JavaScript errors
