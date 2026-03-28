Feature: Content Structure - Canvas Pages permissions
      As a site admin user
      I want to be able to manage Canvas Pages
      So that I can build and edit pages using the Canvas page builder.

  @javascript @check @local @development @staging @production
  Scenario: Check that the webmaster can access the Canvas Pages listing
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"
      And I should see "Home"
      And I should see "Blog"
      And I should see "Contact Us"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Content editor can access the Canvas Pages listing
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Content admin can access the Canvas Pages listing
    Given I am a logged in user with the "Content admin" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Site admin can access the Canvas Pages listing
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/content/pages"
      And wait
     Then I should see "Pages"

  @javascript @check @local @development @staging @production
  Scenario: Check that anonymous users can not access the Canvas Pages listing
    Given I am an anonymous user
     When I go to "/admin/content/pages"
      And wait
     Then I should not see "Pages"

  @javascript @check @local @development @staging @production
  Scenario: Check that Normal users can not access the Canvas Pages listing
    Given I am a logged in user with the "Normal user" user
     When I go to "/admin/content/pages"
      And wait
     Then I should not see "Pages"
