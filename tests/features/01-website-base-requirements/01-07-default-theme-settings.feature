@regression @any @admin
Feature: Website Base Requirements - Default theme settings
      As a site visitor and a site administrator
      I want the default theme settings to work
      So that header behaviour can be configured per site.

  @check @local @development @staging @production
  Scenario: The default theme renders its main landmarks on the homepage
    Given I am an anonymous user
     When I go to the homepage
      And wait
     Then I see visible site header
      And I see visible main nav
      And I see visible main content
      And I see visible footer

  @check @local @development @staging @production
  Scenario: The sticky header is enabled by default on the homepage
    Given I am an anonymous user
     When I go to the homepage
      And wait
     Then I see visible site header
      And the "site header" should be sticky

  @check @local @development @staging @production
  Scenario: The header gains the scrolled state when the page is scrolled
    Given I am an anonymous user
     When I go to the homepage
      And wait
      And I scroll down 600
     Then the "site header" should have the "scrolled" class within 5 seconds

  @check @local @development @staging @production
  Scenario: The sticky header setting is available in the default theme settings
    Given I am a logged in user with the "webmaster" user
     When I go to the default theme settings page
      And wait
     Then I should see "Sticky header"

  @check @local @development @staging @production
  Scenario Outline: The sticky header stays sticky on a <device> screen
    Given I am an anonymous user
      And I set the viewport to the "<breakpoint>" breakpoint
     When I go to the homepage
      And wait
     Then I see visible site header
      And the "site header" should be sticky
      And I scroll down 600
      And the "site header" should have the "scrolled" class within 5 seconds

    Examples:
      | device  | breakpoint |
      | mobile  | xs         |
      | tablet  | md         |
      | desktop | xl         |

  @check @local @development
  Scenario: Disabling the sticky header setting removes the sticky header
    Given I am a logged in user with the "webmaster" user
      And I disable the sticky header theme setting
     When I go to the homepage
      And wait
     Then the "site header" should not be sticky
     When I enable the sticky header theme setting
      And I go to the homepage
      And wait
     Then I see visible site header
      And the "site header" should be sticky
