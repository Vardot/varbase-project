Feature: Content Management - Access Unpublished
      As a site manager
      I want to control who can access unpublished content
      So that editors and reviewers can preview content before it goes live.

  @javascript @check @local @development @staging @production
  Scenario: Set up unpublished test content as the webmaster
    Given I am a logged in user with the "webmaster" user
     When I go to "/node/add/page"
      And wait
     Then I should see "Create Utility page"
     When I fill in "Test Unpublished Page" for "Title"
      And I fill in "Test description for unpublished page." for "#edit-field-description-0-value" by attr
      And I scroll to the bottom
      And I press the "Save" button
      And wait
     Then I should see "Test Unpublished Page"
     When I go to "/node/add/blog"
      And wait
     Then I should see "Create Blog post"
     When I fill in "Test Unpublished Blog Post" for "Title"
      And I fill in "Test description for unpublished blog post." for "#edit-field-description-0-value" by attr
      And I scroll to the bottom
      And I press the "Save" button
      And wait
     Then I should see "Test Unpublished Blog Post"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Access Unpublished configuration and token list
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/content/access_unpublished"
      And wait
     Then I should see "Access Unpublished"
      And I should see "Hash key"
      And I should see "Lifetime"
     When I go to "/admin/content/access_token"
      And wait
     Then I should see "Access Unpublished"
      And I should see "Expire date"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access Access Unpublished administration pages
    Given I am an anonymous user
     When I go to "/admin/config/content/access_unpublished"
      And wait
     Then I should not see "Hash key"
     When I go to "/admin/content/access_token"
      And wait
     Then I should not see "Expire date"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access Access Unpublished administration pages
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/config/content/access_unpublished"
      And wait
     Then I should not see "Hash key"
     When I go to "/admin/content/access_token"
      And wait
     Then I should not see "Expire date"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can view an unpublished Page and see the Temporary unpublished access section
    Given I am a logged in user with the "webmaster" user
     When I go to "/test-unpublished-page"
      And wait
     Then I should see "Test Unpublished Page"
     When I go to "/admin/content"
      And wait
     Then I should see "Content"
     When I fill in "Test Unpublished Page" for "Title"
      And I press the "Filter" button
      And wait
     Then I should see "Test Unpublished Page"
     When I click "Edit" in the "Test Unpublished Page" row
      And wait
     Then I should see "Test Unpublished Page"
      And I should see "Temporary unpublished access"

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can view an unpublished Blog post and see the Temporary unpublished access section
    Given I am a logged in user with the "webmaster" user
     When I go to "/blog/test-unpublished-blog-post"
      And wait
     Then I should see "Test Unpublished Blog Post"
     When I go to "/admin/content"
      And wait
     Then I should see "Content"
     When I fill in "Test Unpublished Blog Post" for "Title"
      And I press the "Filter" button
      And wait
     Then I should see "Test Unpublished Blog Post"
     When I click "Edit" in the "Test Unpublished Blog Post" row
      And wait
     Then I should see "Test Unpublished Blog Post"
      And I should see "Temporary unpublished access"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Content editor can view unpublished Page and Blog post content
    Given I am a logged in user with the "Content editor" user
     When I go to "/test-unpublished-page"
      And wait
     Then I should see "Test Unpublished Page"
     When I go to "/blog/test-unpublished-blog-post"
      And wait
     Then I should see "Test Unpublished Blog Post"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Content admin can view unpublished Page and Blog post content
    Given I am a logged in user with the "Content admin" user
     When I go to "/test-unpublished-page"
      And wait
     Then I should see "Test Unpublished Page"
     When I go to "/blog/test-unpublished-blog-post"
      And wait
     Then I should see "Test Unpublished Blog Post"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not directly access unpublished Page or Blog post content without a token
    Given I am an anonymous user
     When I go to "/test-unpublished-page"
      And wait
     Then I should not see "Test Unpublished Page"
     When I go to "/blog/test-unpublished-blog-post"
      And wait
     Then I should not see "Test Unpublished Blog Post"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not directly access unpublished Page or Blog post content without a token
    Given I am a logged in user with the "Normal user" user
     When I go to "/test-unpublished-page"
      And wait
     Then I should not see "Test Unpublished Page"
     When I go to "/blog/test-unpublished-blog-post"
      And wait
     Then I should not see "Test Unpublished Blog Post"

  @javascript @check @local @development @staging @production
  Scenario: Check that Access Unpublished permissions are granted to anonymous and authenticated roles
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people/permissions/anonymous"
      And wait
     Then I should see "Access Unpublished"
     When I go to "/admin/people/permissions/authenticated"
      And wait
     Then I should see "Access Unpublished"
