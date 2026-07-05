Feature: File & Media Management - Assets Management - Image media and their usage list page for site admins
      As a user with permission to manage files in the site
      I want to be able to see the list of files
      So that I will be able to manage files, see where they have been used in contents.
  Background:
    Given I am a logged in user with the "Site admin" user
  @local @development @staging @production
  Scenario: Check if content admins can access the content files page
     When I go to "/admin/content/media"
      And wait
     Then I should see "Add media"
      And I should not see "Access denied"
  @local @development @staging @production
  Scenario: Check if we do have a file named Flag Earth, if not then upload the file dependently
     When I go to "/media/add/image"
      And wait
     Then I should see "Allowed types: png gif jpg jpeg."
     When I attach the file "flag-earth.jpg" to "#edit-field-media-image-0-upload"
      And wait
      And I press the "Save" button
      And wait
      And I fill in "Flag Earth in space" for "field_media_image[0][alt]"
      And I fill in "Flag Earth all earth in space" for "field_media_image[0][title]"
      And I fill in "Flag Earth" for "name[0][value]"
      And I check "Show in media library"
      And I press the "Save" button
      And wait
     Then I should see "Flag Earth"
      And wait
     When I go to "/admin/content/media"
     Then I should see "Add media"
      And I should see "Edit" in the "Flag Earth" row
  @local @development @staging @production
  Scenario: Check if content admins can edit files
     When I go to "/admin/content/media"
      And wait
     Then I should see "Add media"
     When I fill in "Flag Earth" for "edit-name" by attr
      And I press the "Filter" button
      And wait
     Then I should see "Flag Earth"
     When I click "Edit" in the "Flag Earth" row
      And wait
     Then I should see "Edit Image Flag Earth"
     When I fill in "Flag Earth after edit" for "name[0][value]"
      And I check "Show in media library"
      And I press the "Save" button
      And wait
     Then I should see "Image Flag Earth after edit has been updated."
  @local @development @staging @production
  Scenario: Check if content admins can delete files
     When I go to "/admin/content/media"
      And wait
     Then I should see "Add media"
     When I fill in "Flag Earth after edit" for "edit-name" by attr
      And I press the "Filter" button
      And wait
     Then I should see "Flag Earth after edit"
     When I click "Edit" in the "Flag Earth after edit" row
      And wait
     Then I should see "Flag Earth after edit"
     When I click "edit-delete" by its "id" attribute
      And wait
     Then I should see "This action cannot be undone."
     When I click "Delete" in the "button" element with the "class" attribute set to "ui-button"
      And wait
     Then I should see "The media item Flag Earth after edit has been deleted."
