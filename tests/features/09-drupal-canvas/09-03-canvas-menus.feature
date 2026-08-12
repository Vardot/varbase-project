@regression @any @canvas
Feature: Content Structure - Menus in Drupal Canvas
      As a site administrator
      I want the system menus offered as Canvas components
      So that I can place them on Drupal Canvas pages and regions.

  @check @local @development @staging @production
  Scenario: The system menus are offered in the Canvas component library
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
     Then the Drupal Canvas component library should list the "block.system_menu_block.main" component
      And the Drupal Canvas component library should list the "block.system_menu_block.footer" component
      And the Drupal Canvas component library should list the "block.system_menu_block.social-media-menu" component
