Feature: Frontend Pages - Blog Listing Page
      As a site visitor
      I want to see the blog listing page
      So that I can browse blog posts.

  @javascript @check @local @development @staging @production
  Scenario: Check that the blog listing page loads correctly
    Given I am an anonymous user
     When I go to "/blog"
      And wait
     Then I should see "Blog"
      And I should not see "Page not found"

  @javascript @check @local @development @staging @production
  Scenario: Check that the blog listing page shows blog posts
    Given I am an anonymous user
     When I go to "/blog"
      And wait
     Then I should see "Blog post"

  @javascript @check @local @development @staging @production
  Scenario: Check that a blog post page loads with breadcrumbs
    Given I am an anonymous user
     When I go to "/blog/case-studies-successful-websites-powered-varbase"
      And wait
     Then I should see "Case Studies"
      And I should see "Home"
      And I should see "Blog"

  @javascript @check @local @development @staging @production
  Scenario: Check that a blog post page has the main navigation
    Given I am an anonymous user
     When I go to "/blog/case-studies-successful-websites-powered-varbase"
      And wait
     Then I should see "About Varbase"
      And I should see "Contact Us"
