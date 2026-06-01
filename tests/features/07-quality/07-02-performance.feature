Feature: Quality - Performance budgets
      As a site owner
      I want the key pages to load within a reasonable time budget
      So that regressions in page weight or query count are caught early.

  # Uses the custom "the page should load in less than N ms/seconds" step
  # (Navigation Timing: navigationStart -> loadEventEnd). Budgets are
  # deliberately generous for a full Varbase install with CSS/JS aggregation
  # disabled (the automated-testing configuration); tighten on production.

  @perf @local @development @staging @production
  Scenario: The login page loads within budget
    Given I am an anonymous user
     When I go to "/user/login"
      And wait
     Then the page should load in less than 3 seconds

  @perf @local @development @staging @production
  Scenario: The homepage loads within budget
    Given I am an anonymous user
     When I go to homepage
      And wait
     Then the page should load in less than 20 seconds

  @perf @local @development @staging @production
  Scenario: The admin dashboard loads within budget for the webmaster
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/dashboard"
      And wait
     Then the page should load in less than 20 seconds
