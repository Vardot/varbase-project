@regression @any @canvas
Feature: Drupal Canvas - default patterns insert and render (part 2), and reuse
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

  # Each content pattern is inserted from the editor Library (right-click ->
  # Insert), published through the editor, then rendered for a logged-out visitor
  # who sees the pattern's own text.
  @slow @flaky @check @local @development
  Scenario Outline: a default pattern inserts through the editor, publishes and renders - <label>
    Given a new Canvas page "Test Pattern <label>" at "/test-pattern-<slug>"
     When I open the "Test Pattern <label>" Canvas page in the editor
      And I open the "Patterns" tab in the Canvas Library
      And I insert the "<label>" pattern from the Canvas Library
      And I publish the Canvas page changes through the editor
     Then I am an anonymous user
      And I go to "/test-pattern-<slug>"
      And wait
      And I should see "<marker>"
      And I should not see "The website encountered an unexpected error"

    # A representative sample of patterns (the FAQ Accordion plus four more),
    # each visually distinct with its own on-page text. The remaining default
    # patterns are covered for availability by the "library offers all 14"
    # scenario above.
    Examples:
      | label                 | slug        | marker                                 |
      | Feature Cards         | feature     | Multilingual                           |
      | Call to Action Banner | cta-banner  | Kick-start Your Journey with us Today! |

  # The same pattern can be inserted more than once from the Library, each copy
  # independent. Two Counters inserts render two independent counters sections;
  # the Counters pattern renders three stat text blocks, so two copies produce
  # six - proven on the front end with an element count, no layout-API read.
  @slow @flaky @check @local @development
  Scenario: the same pattern used twice gives two independent copies
    Given a new Canvas page "Test Pattern Twice" at "/test-pattern-twice"
     When I open the "Test Pattern Twice" Canvas page in the editor
      And I open the "Patterns" tab in the Canvas Library
      And I insert the "Counters" pattern from the Canvas Library
      And I insert the "Counters" pattern from the Canvas Library
      And I publish the Canvas page changes through the editor
     Then I am an anonymous user
      And I go to "/test-pattern-twice"
      And wait
      And I should see "Sites using Varbase"
      And I should see 6 "[data-component-id='vartheme_bs5:text']" elements
      And I should not see "The website encountered an unexpected error"
