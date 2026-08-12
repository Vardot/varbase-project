@regression @any @content @i18n
Feature: Website Base Requirements - Website Languages - All content translatable to all languages
      As a logged in user with a permission to translate content
      I want to be able to check if all content types are translatable
      So that I will be able to create a content then I will have the option to translate the content to other languages in the site
  @local @development @staging @production
  Scenario: Check if site admin can translate an existing English Basic Page to an Arabic version.
    Given I am a logged in user with the "Site admin" user
     When I go to "/node/add/page"
      And I wait for 2 seconds
      And I fill in "Title" with "Test English Basic page"
      And I fill in the rich text editor field "Body" with the "Test English Basic page body"
      And I select "en" from "#edit-langcode-0-value"
      And I select "published" from "edit-moderation-state-0-state"
      And I press "Save"
      And I wait for 2 seconds
     Then I should see "Test English Basic page"
      And I should see "Test English Basic page body"
     When I open the moderation sidebar
      And I wait for AJAX to finish
      And I close the a11y checker
     Then I should see "Translate"
     When I click "Translate" in the "a" element with the "class" attribute set to "moderation-sidebar-link button use-ajax"
      And I wait for AJAX to finish
      And I wait for 2 seconds
     Then I should see "Translate"
      And I should see "View all translations"
     When I click "Create translation"
      And I wait for 2 seconds
      And I fill in "edit-title-0-value" with "تجربة صفحة بسيطة عربية العنوان" by attr
      And I fill in the rich text editor field "edit-body-0-value" with the "تجربة صفحة بسيطة عربية المحتوى"
      And I press "حفظ (this translation)"
      And I wait for 2 seconds
     Then I should see "تجربة صفحة بسيطة عربية العنوان"
     When I open the moderation sidebar
      And I wait for AJAX to finish
     Then I should see "ترجمة"
     When I click "ترجمة" in the "a" element with the "class" attribute set to "moderation-sidebar-link button use-ajax"
      And I wait for AJAX to finish
      And I wait for 2 seconds
     Then I should see "ترجمة"
      And I should see "View all translations"
      And I wait for 2 seconds
     When I click "View all translations"
      And I wait for 2 seconds
     Then I should see "Test English Basic page"
