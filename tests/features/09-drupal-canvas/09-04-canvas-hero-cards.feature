@regression @any @canvas
Feature: Content Structure - Hero Cards in Drupal Canvas
      As a site builder
      I want to drag a Hero Card onto a page and configure its options
      So that I can build hero sections the way a human site builder does.

  @slow @flaky @check @local @development
  Scenario: A site builder adds a Hero Card with the editor
    Given I am a logged in user with the "webmaster" user
      And a new Canvas page "Test Hero Default" at "/test-hero-default"
     When I add the "Hero Card" component to the "Test Hero Default" Canvas page using the editor
      And I set the Canvas component option "Media position" to "No media"
      And I publish the Canvas page changes
     Then I am an anonymous user
      And I go to "/test-hero-default"
      And wait
      And I should see "Demo title"
      And I should see "Learn more"

  @slow @flaky @check @local @development
  Scenario: A site builder configures the Hero Card options matrix in the editor
    Given I am a logged in user with the "webmaster" user
      And a new Canvas page "Test Hero Options" at "/test-hero-options"
     When I add the "Hero Card" component to the "Test Hero Options" Canvas page using the editor
      And I set the Canvas component option "Media position" to "No media"
      And I set the Canvas component option "Title" to "Configured hero"
      And I set the Canvas component option "Heading tag" to "H3"
      And I set the Canvas component option "Background color" to "Primary"
      And I set the Canvas component option "Horizontal alignment" to "Center"
      And I set the Canvas component option "Card border" to "1"
      And I set the Canvas component option "Container width" to "Full width container"
      And I set the Canvas component option "Button label" to "Get started"
      And I set the Canvas component option "Button style" to "Success"
      And I publish the Canvas page changes
     Then I am an anonymous user
      And I go to "/test-hero-options"
      And wait
      And I should see "Configured hero"
      And the element "h3" should be displayed
      And the element ".bg-primary" should be displayed
      And the element ".card-body.text-center" should be displayed
      And the element ".card.border" should be displayed
      And the element ".container-fluid" should be displayed
      And the element "a.btn-success" should be displayed
      And I should see "Get started"
