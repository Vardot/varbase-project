Feature: File & Media Management - Assets Management - Image media and their usage list page for site admins
      As a user with permission to manage files in the site
      I want to be able to see the list of files
      So that I will be able to manage files, see where they have been used in contents.

  @javascript @local @development @staging @production
  Scenario: Check if site admins can access the media add image page
    Given I am a logged in user with the "Site admin" user
     When I go to "/media/add/image"
      And wait
     Then I should see "Add media item"

  @javascript @local @development @staging @production
  Scenario: Check if content admins can access media list
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/content/media"
      And wait
     Then I should see "Add media"
      And I should see "Media name"
