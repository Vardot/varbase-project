@ai
Feature: Varbase AI Recipe - AI Readable Base - A Markdown version of every page
  As an AI tool reading the site
  I want each content item and term as Markdown at its path with .md, or when I ask for text/markdown
  So that I read the content without the page's HTML

  Background:
    Given the API base URL is "/"

  @check @ai @recipes @api @local @development @staging @production
  Scenario: Check a blog post is served as Markdown at its path with .md
     When I send a GET request to "blog/community-behind-varbase-support-and-collaboration.md"
     Then the API response code should be 200
      And the response header "Content-Type" should contain "text/markdown"
      And the API response should contain "# "
      And the API response should contain "The Community Behind Varbase: Support and Collaboration"
      And the API response should not contain "<div"

  @check @ai @recipes @api @local @development @staging @production
  Scenario: Check a blog post is served as Markdown when Markdown is asked for
    Given I set header "Accept" with value "text/markdown"
     When I send a GET request to "blog/community-behind-varbase-support-and-collaboration"
     Then the API response code should be 200
      And the response header "Content-Type" should contain "text/markdown"
      And the API response should contain "The Community Behind Varbase: Support and Collaboration"

  @check @ai @recipes @api @local @development @staging @production
  Scenario: Check the same path still serves HTML to browsers
     When I send a GET request to "blog/community-behind-varbase-support-and-collaboration"
     Then the API response code should be 200
      And the response header "Content-Type" should contain "text/html"

  @check @ai @recipes @api @local @development @staging @production
  Scenario: Check a taxonomy term is served as Markdown
     When I send a GET request to "taxonomy/term/1.md"
     Then the API response code should be 200
      And the response header "Content-Type" should contain "text/markdown"
