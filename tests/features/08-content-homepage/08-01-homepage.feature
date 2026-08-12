@regression @any @content
Feature: Frontend Pages - Homepage
      As a site visitor
      I want to verify the homepage loads correctly
      So that I can confirm the site is accessible and displays expected content.

  @check @local @development @staging @production
  Scenario: Check that the homepage loads and displays expected content
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Try Varbase for Free"
      And I should not see "Page not found"

  @check @local @development @staging @production
  Scenario: Check that the homepage has main navigation links
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "About Varbase"
      And I should see "Blog"
      And I should see "Contact Us"

  @check @local @development @staging @production
  Scenario: Check that the homepage has the hero section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Varbase, Better Than Ever"

  @check @local @development @staging @production
  Scenario: Check that the homepage has the features section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Built To Empower Organizations"
      And I should see "AI Integration"
      And I should see "Mobile Responsiveness"
      And I should see "Multilingual"

  @check @local @development @staging @production
  Scenario: Check that the homepage has the statistics section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Sites using Varbase"
      And I should see "Projects delivered by Vardot"

  @check @local @development @staging @production
  Scenario: Check that the homepage has the security section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Security Standards"

  @check @local @development @staging @production
  Scenario: Check that the homepage has the latest updates section
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Latest Updates"
      And I should see "View All Articles"

  @check @local @development @staging @production
  Scenario: Check that the homepage has footer with support links
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then I should see "Community Support"
      And I should see "Documentation"
      And I should see "Get Professional Support"
