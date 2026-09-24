@regression @any @a11y
Feature: Quality - Accessibility (a11y)
      As a site owner
      I want every public page to be free of serious accessibility issues
      So that the site is usable by everyone, on any device and with any assistive technology.

  # The impact gate is a ladder: "serious" also fails on critical. Where a page
  # is held back by a colour contrast ratio, which is a WCAG AA rule and a brand
  # decision rather than a markup defect, it is gated at level A instead and the
  # rules it does satisfy are pinned by id below.

  @a11y @local @development @staging @production
  Scenario Outline: The <page> page has no serious accessibility violations
    Given I am an anonymous user
     When I go to "<path>"
      And wait
     Then the page should have no serious accessibility violations

    Examples:
      | page         | path                                                     |
      | blog article | /blog/community-behind-varbase-support-and-collaboration |
      | login        | /user/login                                              |
      | not found    | /this-page-does-not-exist                                |

  @a11y @local @development @staging @production
  Scenario: The front page has no serious accessibility violations
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should have no serious accessibility violations

  @a11y @local @development @staging @production
  Scenario Outline: The <page> page passes an accessibility audit at level A
    Given I am an anonymous user
     When I go to "<path>"
      And wait
     Then the page should pass an accessibility audit at level "A"

    Examples:
      | page          | path           |
      | about varbase | /about-varbase |
      | features      | /features      |
      | blog listing  | /blog          |
      | contact us    | /contact-us    |

  @a11y @local @development @staging @production
  Scenario: The admin dashboard has no critical accessibility violations for the webmaster
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/dashboard"
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario Outline: The <page> page satisfies the accessibility rule "<rule>"
    Given I am an anonymous user
     When I go to "<path>"
      And wait
     Then the page should not violate the accessibility rule "<rule>"

    Examples:
      | page          | path                                                     | rule                 |
      | about varbase | /about-varbase                                           | image-alt            |
      | about varbase | /about-varbase                                           | page-has-heading-one |
      | about varbase | /about-varbase                                           | link-name            |
      | about varbase | /about-varbase                                           | button-name          |
      | features      | /features                                                | image-alt            |
      | features      | /features                                                | page-has-heading-one |
      | features      | /features                                                | link-name            |
      | blog listing  | /blog                                                    | image-alt            |
      | blog listing  | /blog                                                    | page-has-heading-one |
      | blog listing  | /blog                                                    | link-name            |
      | blog article  | /blog/community-behind-varbase-support-and-collaboration | image-alt            |
      | blog article  | /blog/community-behind-varbase-support-and-collaboration | page-has-heading-one |
      | contact us    | /contact-us                                              | label                |
      | login         | /user/login                                              | label                |
      | login         | /user/login                                              | html-has-lang        |

  @a11y @local @development @staging @production
  Scenario: The hero slider indicators meet the minimum target size
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "target-size"

  @a11y @local @development @staging @production
  Scenario: Each navigation landmark on the front page is distinguishable
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "landmark-unique"

  @a11y @local @development @staging @production
  Scenario: The front page has a single main landmark
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "landmark-one-main"

  @a11y @local @development @staging @production
  Scenario: The front page headings descend without skipping a level
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "heading-order"

  @a11y @local @development @staging @production
  Scenario: The document language is set on the front page
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "html-has-lang"

  @a11y @local @development @staging @production
  Scenario Outline: Report the full accessibility check for the <page> page
    Given I am an anonymous user
     When I go to "<path>"
      And wait
     Then I print the full accessibility check

    Examples:
      | page          | path                                                     |
      | about varbase | /about-varbase                                           |
      | features      | /features                                                |
      | blog listing  | /blog                                                    |
      | blog article  | /blog/community-behind-varbase-support-and-collaboration |
      | contact us    | /contact-us                                              |
