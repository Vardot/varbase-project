Feature: Pre-check important administrator and development pages
      As a site admin user
      I want to be able to make sure that all admin and development tools are working
      So that I can use them after the install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @javascript @check @local @development @staging @production
  Scenario: Check the content page
     When I go to "/admin/content"
      And wait
     Then I should see "Content"


 @javascript @check @local @development @staging @production
  Scenario: Check Files admin page
     When I go to "/admin/content/files"
      And wait
     Then I should see "Files"

  @javascript @check @local @development @staging @production
  Scenario: Check Media Grid admin page
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"

  @javascript @check @local @development @staging @production
  Scenario: Check Media Table admin page
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"
      And I should see "Thumbnail"
      And I should see "Media name"
      And I should see "Type"
      And I should see "Author"
      And I should see "Status"
      And I should see "Updated"
      And I should see "Operations"

@javascript @check @local @development @staging @production
  Scenario: Check the structure page
     When I go to "/admin/structure"
      And wait
     Then I should see "Block layout"
      And I should see "Content types"
      And I should see "Display modes"
      And I should see "Entityqueues"
      And I should see "Media types"
      And I should see "Menu position rules"
      And I should see "Menus"
      And I should see "Taxonomy"
      And I should see "Views"
      And I should see "Webforms"

  @javascript @check @local @development @staging @production
  Scenario: Check the views page
     When I go to "/admin/structure/views"
      And wait
     Then I should see "Views"

  @javascript @check @local @development @staging @production
  Scenario: Check the Appearance page
     When I go to "/admin/appearance"
      And wait
     Then I should see "Appearance"
      And I should see "Claro"
      And I should see "Gin"

 @javascript @check @local @development @staging @production
  Scenario: Check active type of media types
     When I go to "/media/add"
      And wait
     Then I should see "File"
      And I should see "Image"
      And I should see "Video"
      And I should see "Remote video"
      And I should see "Audio"

  @javascript @check @local @development @staging
  Scenario: Check password policy constraints
     When I go to "/admin/config/security/password-policy/default_policy"
      And wait
      And I scroll to the bottom
     Then I should see "Policy Constraints"
      And I should see "Number of passwords that will be checked in the user password update history: 0"
      And I should see "Password must not contain the user's username."
      And I should see "Password character length of at least 8 characters"
      And I should see "Minimum password character types: 4"
      And I should see "Password must contain at least 1 special character"
      And I should see "Password must contain at least 1 numeric character"
      And I should see "Password must contain at least 1 uppercase character"
      And I should see "Password must contain at least 1 lowercase character"