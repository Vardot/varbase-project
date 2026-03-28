Feature: Content Structure - Standard Breadcrumbs
      As a website visitor
      I want to see breadcrumb navigation on pages
      So that I can understand and navigate the site hierarchy.

  @javascript @check @local @development @staging @production
  Scenario: Check that the blog listing page has a breadcrumb
    Given I am an anonymous user
     When I go to "/blog"
      And wait
     Then I should see "Home"
      And I should see "Blog"

  @javascript @check @local @development @staging @production
  Scenario: Check that the contact us page has a breadcrumb
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Home"
      And I should see "Contact Us"
