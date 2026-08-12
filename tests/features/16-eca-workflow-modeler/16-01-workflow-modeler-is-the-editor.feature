@regression @acceptance @any @workflow
Feature: Workflow Automation - ECA Workflow Modeler is offered
      As a site admin user
      I want the ECA "add model" screen to offer the Workflow Modeler editor
      So that new automations can be authored with the Workflow Modeler.

  @check @local @development @staging @production
  Scenario: Check that the add model screen offers the Workflow Modeler editor
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/eca/add"
      And wait
     Then I should see "Available modelers"
      And I should see "Workflow modeler"

  @check @local @development @staging @production
  Scenario: Check that the Workflow Modeler opens for a new ECA model
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/workflow/eca/add/workflow_modeler"
      And wait
     Then I should see "Create new ECA model"
