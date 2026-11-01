@ai
Feature: Varbase AI Recipe - AI Readable Base - /llms.txt for AI tools
  As an AI tool reading the site
  I want a /llms.txt built from the site name, slogan, main menu and footer menu
  So that I find the site's main pages without crawling every page

  Background:
    Given the API base URL is "/"

  @check @ai @recipes @api @local @development @staging @production
  Scenario: Check /llms.txt is served as Markdown with the main and footer menus
     When I send a GET request to "llms.txt"
     Then the API response code should be 200
      And the response header "Content-Type" should contain "text/markdown"
      And the API response should contain "## Main navigation"
      And the API response should contain "[Blog]("
      And the API response should contain "## Footer"

  @check @ai @recipes @api @local @development @staging @production
  Scenario: Check other .txt files are still answered by Fast 404
     When I send a GET request to "no-such-file.txt"
     Then the API response code should be 404
