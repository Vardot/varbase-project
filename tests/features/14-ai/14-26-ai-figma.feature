@ai
Feature: Varbase AI Recipe - AI Figma Base - The AI Figma stack is ready
      As a Varbase site builder
      I want the AI Figma engine, its Varbase settings and its AI Context items in place
      So that the site can build Drupal Canvas pages from a Figma link.

  @check @ai @recipes @local @development @staging @production
  Scenario: Check the AI Figma modules are enabled
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/modules"
     Then I should see "AI Figma"
      And I should see "Varbase AI Figma"

  @check @ai @recipes @local @development @staging @production
  Scenario: Check the webmaster can open the AI Figma settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/ai/figma"
     Then I should see "AI Figma"
      And I see visible ai figma settings form

  @check @ai @recipes @local @development @staging @production
  Scenario: Check the AI Figma context items are ready for the AI agents
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/ai/context/items"
     Then I should see "Figma Build Rules"
      And I should see "Figma Accessibility Rules"

  @check @ai @recipes @local @development @staging @production
  Scenario: Check the AI agents page opens for the webmaster
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/ai/tools-automation/agents"
     Then the response status code should be 200
      And I should not see "The website encountered an unexpected error"

  @check @ai @recipes @local @development @staging @production
  Scenario: Check the status report lists AI Figma without errors
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/reports/status"
     Then I should see "Status report"
      And I should see "AI Figma"
