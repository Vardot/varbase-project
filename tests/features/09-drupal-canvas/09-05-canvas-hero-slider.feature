@regression @any @canvas
Feature: Content Structure - Hero Slider in Drupal Canvas
      As a site builder
      I want a Bootstrap 5 carousel-based Hero Slider in Drupal Canvas
      So that I can present rotating hero slides with images, overlay content and buttons.

  @check @local @development @staging @production
  Scenario: The homepage renders a working hero slider carousel
    Given I am an anonymous user
     When I go to the homepage
      And wait
     Then the element ".carousel.hero-slider" should be displayed
      And the element ".carousel-indicators" should be displayed
      And the element "[data-bs-ride='carousel']" should be displayed
      And the element "[data-bs-slide='prev']" should be displayed
      And the element "[data-bs-slide='next']" should be displayed

  @check @local @development @staging @production
  Scenario: The hero slides show different styles with overlay content and a button
    Given I am an anonymous user
     When I go to the homepage
      And wait
     Then I should see 4 ".carousel-item" elements
      And I should see "Varbase, better than ever"
      And the element ".carousel-item.active" should be displayed
      And the element ".carousel-item .btn-primary" should be displayed

  @slow @flaky @check @local @development
  Scenario Outline: A site builder styles a Hero Slider in the editor - <name>
    Given I am a logged in user with the "webmaster" user
      And a new Canvas page "Test Hero Slider <name>" at "/test-hero-slider-<slug>"
     When I add the "Hero Slider (Container)" component to the "Test Hero Slider <name>" Canvas page using the editor
      And I set the Canvas component option "<option>" to "<value>"
      And I publish the Canvas page changes
     Then I am an anonymous user
      And I go to "/test-hero-slider-<slug>"
      And wait
      And the element ".carousel" should be displayed
      And the element "<selector>" should be displayed

    Examples:
      | name             | slug  | option           | value  | selector                        |
      | fade transition  | fade  | Transition       | Fade   | .carousel-fade                  |
      | tall height      | tall  | Slider height    | 900px  | .hero-slider--h-900             |
      | short height     | short | Slider height    | 500px  | .hero-slider--h-500             |
      | dark controller  | dark  | Controller color | Dark   | .hero-slider--controller-dark   |
      | light controller | light | Controller color | Light  | .hero-slider--controller-light  |
