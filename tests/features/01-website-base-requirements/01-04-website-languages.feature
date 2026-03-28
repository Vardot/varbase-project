Feature: Website Base Requirements - Website Languages - Internationalization
      As a site admin user
      I want to be able to check the language configuration
      So that I can manage content in multiple languages.

  @javascript @check @local @development @staging @production
  Scenario: Check if the language configuration page is accessible
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/regional/language"
      And wait
     Then I should see "Languages"

  @javascript @check @local @development @staging @production
  Scenario: Check if Content translation settings page is accessible
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/regional/content-language"
      And wait
     Then I should see "Content language and translation"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Site admin can not access the language configuration page
    Given I am a logged in user with the "Site admin" user
     When I go to "/admin/config/regional/language"
      And wait
     Then I should not see "Languages"
