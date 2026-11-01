@ai
Feature: Varbase AI Recipe - AI SEO - Fill meta tags in bulk
      As an SEO admin
      I want a page that lists blog posts and utility pages with actions to write their SEO fields
      So that I can fill the meta tags of existing content in one go.

  @check @ai @recipes @local @development @staging @production
  Scenario Outline: Check the "<user>" user gets the AI SEO meta tags page and its actions
    Given I am a logged in user with the "<user>" user
     When I go to "/admin/content/ai-seo-metatags"
     Then I should see "AI SEO meta tags"
      And I should see "AI: SEO title and description (guarded)"

    Examples:
      | user       |
      | SEO admin  |
      | Site admin |
