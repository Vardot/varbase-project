Feature: Content Structure - Blog post permissions
      As a site admin user
      I want to control who can create and manage Blog posts
      So that only authorized users can publish blog content.

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Blog post creation page
    Given I am an anonymous user
     When I go to "/node/add/blog"
      And wait
     Then I should not see "Create Blog post"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Blog post creation page
    Given I am a logged in user with the "Normal user" user
     When I go to "/node/add/blog"
      And wait
     Then I should not see "Create Blog post"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content editor users can access the Blog post creation page
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/blog"
      And wait
     Then I should see "Create Blog post"

  @javascript @check @local @development @staging @production
  Scenario: Check that Content admin users can access the Blog post creation page
    Given I am a logged in user with the "Content admin" user
     When I go to "/node/add/blog"
      And wait
     Then I should see "Create Blog post"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Blog post creation page
    Given I am a logged in user with the "webmaster" user
     When I go to "/node/add/blog"
      And wait
     Then I should see "Create Blog post"

  @javascript @check @local @development @staging @production
  Scenario: Check that the blog listing page is accessible
    Given I am an anonymous user
     When I go to "/blog"
      And wait
     Then I should see "Blog"
