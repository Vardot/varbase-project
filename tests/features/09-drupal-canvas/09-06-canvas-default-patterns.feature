@regression @any @canvas
Feature: Drupal Canvas - the default Canvas pattern library
      As a site builder
      I want the 14 default Canvas patterns that ship with Varbase to work in Drupal Canvas
      So that I can build a page from ready-made sections, reuse one many times and publish it.

  # Every scenario drives the real Drupal Canvas editor the way a site builder
  # does: open the page in the editor, open the Library, read what is offered on
  # screen, insert a pattern by right-clicking its row and choosing Insert, and
  # publish through the editor's own Review -> Select All -> Publish widget. No
  # authoring/config API is read to prove the library or to insert a section.
  #
  # The default-patterns coverage is split across 09-06, 09-07 and 09-08 so each
  # CI job drives one shorter browser session. The Canvas editor is a heavy React
  # app and its toolbar intermittently fails to mount once a single session has
  # built and published many pages, which failed the job rather than the feature.

  Background:
    Given I am a logged in user with the "webmaster" user

  # Open the editor Library's Patterns tab and read the list on screen: all 14
  # default patterns are offered to a site builder, asserted by their human
  # labels, scoped to the Patterns tab panel so nothing else on the page can
  # satisfy the match.
  @slow @flaky @check @local @development
  Scenario: the library offers all 14 default Canvas patterns
    Given a new Canvas page "Pattern Library Check" at "/pattern-library-check"
     When I open the "Pattern Library Check" Canvas page in the editor
      And I open the "Patterns" tab in the Canvas Library
     Then the Canvas Library "Patterns" tab should list "Hero Slider"
      And the Canvas Library "Patterns" tab should list "Page Intro Banner"
      And the Canvas Library "Patterns" tab should list "Text with Cards"
      And the Canvas Library "Patterns" tab should list "Feature Cards"
      And the Canvas Library "Patterns" tab should list "Counters"
      And the Canvas Library "Patterns" tab should list "Feature Highlight"
      And the Canvas Library "Patterns" tab should list "Latest Blog Posts"
      And the Canvas Library "Patterns" tab should list "FAQ Accordion"
      And the Canvas Library "Patterns" tab should list "Image Cards"
      And the Canvas Library "Patterns" tab should list "Contact Form with Info"
      And the Canvas Library "Patterns" tab should list "Call to Action Cards"
      And the Canvas Library "Patterns" tab should list "Call to Action Banner"
      And the Canvas Library "Patterns" tab should list "Site Header"
      And the Canvas Library "Patterns" tab should list "Site Footer"
      # End on a light anonymous page so scenario teardown settles quickly
      # instead of stalling on the live editor React app.
      And I am an anonymous user

  # Open the editor Library's Components tab and read the list on screen: it
  # offers the content components a site builder needs (and a single Share), and
  # keeps the administrative, AI, social and duplicate components out - even
  # though those modules are enabled. Asserted by the visible labels, scoped to
  # the Components tab panel.
  @slow @flaky @check @local @development
  Scenario: the component library lists content components, not administrative ones
    Given a new Canvas page "Component Library Check" at "/component-library-check"
     When I open the "Component Library Check" Canvas page in the editor
      And I open the "Components" tab in the Canvas Library
     Then the Canvas Library "Components" tab should list "Webform"
      And the Canvas Library "Components" tab should list "Hero Slide"
      And the Canvas Library "Components" tab should list "Main navigation"
      And the Canvas Library "Components" tab should list "Share"
      And the Canvas Library "Components" tab should not list "Events Feed"
      And the Canvas Library "Components" tab should not list "Varbase recipes"
      And the Canvas Library "Components" tab should not list "Recommended AI Recipes"
      And the Canvas Library "Components" tab should not list "Admin Menu Links"
      And the Canvas Library "Components" tab should not list "AI Operations Status"
      And the Canvas Library "Components" tab should not list "Setup AI Provider"
      And the Canvas Library "Components" tab should not list "Social Auth Login"
      And the Canvas Library "Components" tab should not list "Recent pages"
      # End on a light anonymous page so scenario teardown settles quickly
      # instead of stalling on the live editor React app.
      And I am an anonymous user
