Feature: Pre-check important administrator and development pages
      As a site admin user
      I want to be able to make sure that all admin and development tools are working
      So that I can use them after the install or update.
  Background:
    Given I am a logged in user with the "webmaster" user
  @check @local @development @staging @production
  Scenario: Check the content page
     When I go to "/admin/content"
      And wait
     Then I should see "Content"
  @check @local @development @staging @production
  Scenario: Check the Homepage content with Layout Builder
     When I go to "/admin/content"
      And wait
     Then I should see "Homepage"
      And I should see "Landing page (Layout Builder)" in the "Homepage" row
  @check @local @development @staging @production
  Scenario: Check Files admin page
     When I go to "/admin/content/files"
      And wait
     Then I should see "Files"
  @check @local @development @staging @production
  Scenario: Check Media Grid admin page
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"
  @check @local @development @staging @production
  Scenario: Check Media Table admin page
     When I go to "/admin/content/media"
      And wait
     Then I should see "Media"
      And I should see "Thumbnail"
      And I should see "Cover Image"
      And I should see "Media name"
      And I should see "Type"
      And I should see "Author"
      And I should see "Status"
      And I should see "Updated"
      And I should see "Operations"
  @check @local @development @staging @production
  Scenario: Check the structure page
     When I go to "/admin/structure"
      And wait
     Then I should see "Block layout"
      And I should see "Content types"
      And I should see "Display Suite"
      And I should see "Display modes"
      And I should see "Entityqueues"
      And I should see "Media types"
      And I should see "Menu position rules"
      And I should see "Menus"
      And I should see "Pages"
      And I should see "Paragraph types"
      And I should see "Taxonomy"
      And I should see "Views"
      And I should see "Webforms"
  @check @local @development @staging @production
  Scenario: Check the structure page
     When I go to "/admin/structure/page_manager"
      And wait
     Then I should see "Pages"
      And I should see "Total Control dashboard"
  @check @local @development @staging @production
  Scenario: Check the views page
     When I go to "/admin/structure/views"
      And wait
     Then I should see "Views"
      And I should see "Browser"
      And I should see "Media Hero Slider"
  @check @local @development @staging @production
  Scenario: Check the Appearance page
     When I go to "/admin/appearance"
      And wait
     Then I should see "Appearance"
      And I should see "Vartheme"
      And I should see "(Bootstrap 4 - SASS)"
      And I should see "Claro"
      And I should see "Bootstrap"
      And I should see "Bootstrap Barrio"
      And I should see "Vartheme Claro"
  @check @local @development @staging @production
  Scenario: Check active type of media types
     When I go to "/media/add"
      And wait
     Then I should see "File"
      And I should see "Image"
      And I should see "Video"
      And I should see "Remote video"
      And I should see "Audio"
      And I should see "Instagram"
      And I should see "Tweet"
  @check @local @development @staging
  Scenario: Check Varbase default Reroute Email settings
     When I go to "/admin/config/development/reroute_email"
      And wait
     Then I should see "Reroute Email"
      And the Drupal checkbox "edit-enable" is checked
      And "#edit-address" should have value "dev-catchall@vardot.com"
      And "#edit-allowed" should have value "*@vardot.com"
      And the Drupal checkbox "edit-description" is checked
      And the Drupal checkbox "edit-message" is checked
  @check @local @development @staging
  Scenario: Check Varbase password suggestions settings
     When I go to "/admin/config/system/varbase/varbase-security/password-suggestions-settings"
      And wait
     Then I should see "Password Suggestions settings"
      And "#edit-confirmtitle" should have value "Passwords match:"
      And "#edit-confirmsuccess" should have value "yes"
      And "#edit-confirmfailure" should have value "no"
      And "#edit-strengthtitle" should have value "Password strength:"
      And "#edit-hasweaknesses" should have value "Recommendations to make your password stronger:"
      And "#edit-tooshort" should have value "Make it at least 8 characters"
      And "#edit-addlowercase" should have value "Add lowercase letters"
      And "#edit-adduppercase" should have value "Add uppercase letters"
      And "#edit-addnumbers" should have value "Add numbers"
      And "#edit-addpunctuation" should have value "Add punctuation"
      And "#edit-sameasusername" should have value "Make it different from your username"
      And "#edit-weak" should have value "Weak"
      And "#edit-fair" should have value "Fair"
      And "#edit-good" should have value "Good"
      And "#edit-strong" should have value "Strong"
  @check @local @development @staging
  Scenario: Check password policy constraints
     When I go to "/admin/config/security/password-policy/default_policy"
      And wait
      And I scroll to the bottom of the page
     Then I should see "Policy Constraints"
      And I should see "Number of passwords that will be checked in the user password update history: 0"
      And I should see "Password must not contain the user's username."
      And I should see "Password character length of at least 8 characters"
      And I should see "Minimum password character types: 4"
      And I should see "Password must contain at least 1 special character"
      And I should see "Password must contain at least 1 numeric character"
      And I should see "Password must contain at least 1 uppercase character"
      And I should see "Password must contain at least 1 lowercase character"
