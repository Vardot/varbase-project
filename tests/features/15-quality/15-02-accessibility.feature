@regression @any @a11y
Feature: Quality - Accessibility (a11y)
      As a site owner
      I want the key public pages to be free of critical accessibility issues
      So that the site is usable by everyone and meets WCAG expectations.

  # Uses varbase-e2e axe-core integration. We gate on "critical" violations
  # (the highest impact level) so the suite stays green on the shipped theme
  # while still catching the show-stoppers. Tighten to "serious" / an "AA"
  # audit per page once the theme is clean at that level.

  @a11y @local @development @staging @production
  Scenario: The homepage has no critical accessibility violations
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario: The login page has no critical accessibility violations
    Given I am an anonymous user
     When I go to "/user/login"
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario: A blog article page has no critical accessibility violations
    Given I am an anonymous user
     When I go to "/blog/community-behind-varbase-support-and-collaboration"
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario: The admin dashboard has no critical accessibility violations for the webmaster
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/dashboard"
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario: The contact page has no critical accessibility violations
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario: The blog listing page has no critical accessibility violations
    Given I am an anonymous user
     When I go to "/blog"
      And wait
     Then the page should have no critical accessibility violations

  @a11y @local @development @staging @production
  Scenario: The homepage has no serious accessibility violations
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should have no serious accessibility violations

  @a11y @local @development @staging @production
  Scenario: Images on the homepage have a text alternative
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "image-alt"

  @a11y @local @development @staging @production
  Scenario: Form fields have labels on the login page
    Given I am an anonymous user
     When I go to "/user/login"
      And wait
     Then the page should not violate the accessibility rule "label"

  @a11y @local @development @staging @production
  Scenario: The document language is set on the homepage
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should not violate the accessibility rule "html-has-lang"
