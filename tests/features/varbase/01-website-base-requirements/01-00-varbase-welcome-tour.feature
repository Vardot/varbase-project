Feature: The welcome message should be displayed on first visit to the site
The welcome message is made possible by having Varbase Tour module
  @local @development @staging @production
  Scenario: Check if welcome message is enabled
    Given I am a logged in user with the "webmaster" user
      And I go to "/admin/config/varbase/settings"
     Then I should see "Varbase general settings"
      And I should see "Allow site to show welcome message"
     When I check "Allow site to show welcome message"
     Then I should see the "Allow site to show welcome message" checkbox checked
     When I press "Save configuration"
      And wait
     Then I should see "The configuration options have been saved."
  @local @development @staging @production
  Scenario: Check if welcome message and tour are displayed
    Given I am a logged in user with the "webmaster" user
      And I go to "/?welcome"
      And I wait for 3 seconds
      And I scroll to the bottom of the page
     Then I should see "Welcome to "
      And I should see "Get started"
     When I click the "Get started" link
      And I wait for 3 seconds
     Then I should see "Tour Switch"
     When I click "Next" in the "button" element with the "class" attribute set to "button button--primary shepherd-button "
      And I wait for 3 seconds
     Then I should see "Editing Your Homepage Layout"
     When I click "Next" in the "button" element with the "class" attribute set to "button button--primary shepherd-button "
      And I wait for 3 seconds
     Then I should see "Start Configuring Your Site Structure"
     When I click "Next" in the "button" element with the "class" attribute set to "button button--primary shepherd-button "
      And I wait for 3 seconds
     Then I should see "Define Your Site Settings"
     When I click "Next" in the "button" element with the "class" attribute set to "button button--primary shepherd-button "
      And I wait for 3 seconds
     Then I should see "Site Content"
  @local @development @staging @production
  Scenario: Check if welcome message is disabled after closing it
    Given I am a logged in user with the "webmaster" user
     When I go to "/?welcome=done"
      And wait
     Then I go to "/admin/config/varbase/settings"
      And I should see "Varbase general settings"
      And I should see "Allow site to show welcome message"
      And I should see the "Allow site to show welcome message" checkbox unchecked
