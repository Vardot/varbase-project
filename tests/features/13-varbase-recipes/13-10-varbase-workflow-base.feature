@regression @acceptance @any @workflow
Feature: Varbase Recipe - Workflow Base (moderation + scheduler)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Content moderation and scheduler are available
     When I go to "/admin/config/workflow/workflows"
      And wait
      And I wait for the text "Workflows" to appear
     Then I should see "Workflows"
     When I go to "/admin/config/content/scheduler"
      And wait
      And I wait for the text "Lightweight cron" to appear
     Then I should see "Lightweight cron"
