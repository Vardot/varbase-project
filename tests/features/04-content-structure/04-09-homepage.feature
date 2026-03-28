Feature: Frontend Pages - Homepage
      As a site visitor
      I want to verify the homepage loads correctly
      So that I can confirm the site is accessible and displays expected content.

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage loads and displays expected content
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Home"
      And I should not see "Page not found"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has main navigation links
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "About Varbase"
      And I should see "Blog"
      And I should see "Contact Us"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has the hero section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Varbase; better than ever"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has the features section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Build Your Site Using Varbase!"
      And I should see "Flexible Content and Fields"
      And I should see "Powerful Landing Page Builder"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has the statistics section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Varbase in Numbers"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has the security section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Security Standards"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has the latest updates section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Latest Updates"
      And I should see "View All Articles"

  @javascript @check @local @development @staging @production
  Scenario: Check that the homepage has footer with support links
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Community Support"
      And I should see "Documentation"
      And I should see "Get Professional Support"
