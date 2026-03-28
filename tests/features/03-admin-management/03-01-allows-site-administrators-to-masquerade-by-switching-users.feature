Feature: Support Requirements - Standard Support Navigation - Allow site super administrators to switch users and surf the site as that user
      As the site super admin
      I want to be able to switch users and surf the site as that user with no password required
      So that I can see what is the selected user is seeing in the site then switch back to my own user account at any time.

  @javascript @check @local @development @staging @production
  Scenario: Check if the admin user UID 1 can masquerade as any user
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/people"
      And wait
      And I fill in "Normal user" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Normal user"
     When I click "Normal user" in the "Normal user" row
      And wait
     Then I should see "Masquerade as Normal user"

# Check if the admin user UID 1 can masquerade as a Content editor user.
     When I go to "/admin/people"
      And wait
      And I fill in "Content editor" for "Name or email contains"
      And I press "Filter"
      And wait
      And I scroll to bottom
     Then I should see "Content editor"
     When I click "Content editor" in the "Content editor" row
      And wait
     Then I should see "Masquerade as Content editor"

    # Check if the admin user UID 1 can masquerade as a content admin user.
     When I go to "/admin/people"
      And wait
      And I fill in "Content admin" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Content admin"
     When I click "Content admin" in the "Content admin" row
      And wait
     Then I should see "Masquerade as Content admin"

# Check if the admin user UID 1 can masquerade as a site admin user.
     When I go to "/admin/people"
      And wait
      And I fill in "Site admin" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Site admin"
     When I click "Site admin" in the "Site admin" row
      And wait
     Then I should see "Masquerade as Site admin"

    # Check if the admin user UID 1 can masquerade as a super admin user.
     When I go to "/admin/people"
      And wait
      And I fill in "Super admin" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Super admin"
     When I click "Super admin" in the "Super admin" row
      And wait
     Then I should see "Masquerade as Super admin"

  @javascript @check @local @development @staging @production
  Scenario: Check if a super admin user can masquerade as any user
    Given I am a logged in user with the "Super admin" user
     When I go to "/admin/people"
      And wait
      And I fill in "Normal user" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Normal user"
     When I click "Normal user" in the "Normal user" row
      And wait
     Then I should see "Masquerade as Normal user"

  # Check if a super admin user can masquerade as an Editor user.
     When I go to "/admin/people"
      And wait
      And I fill in "Content editor" for "Name or email contains"
      And I press "Filter"
      And wait
      And I scroll to bottom
     Then I should see "Content editor"
     When I click "Content editor" in the "Content editor" row
      And wait
     Then I should see "Masquerade as Content editor"

    # Check if a super admin user can masquerade as a content admin user.
     When I go to "/admin/people"
      And wait
      And I fill in "Content admin" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Content admin"
     When I click "Content admin" in the "Content admin" row
      And wait
     Then I should see "Masquerade as Content admin"

    # Check if a super admin user can masquerade as a site admin user.
     When I go to "/admin/people"
      And wait
      And I fill in "Site admin" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Site admin"
     When I click "Site admin" in the "Site admin" row
      And wait
     Then I should see "Masquerade as Site admin"

    # Check if a super admin user can masquerade as the super user (UID 1) "admin".
     When I go to "/user/1"
      And wait
     Then I should see "Masquerade as webmaster"

  @javascript @check @local @development @staging @production
  Scenario: Check if a site admin user can NOT masquerade as any user
    Given I am a logged in user with the "Site admin" user
     When I go to "/user/1"
      And wait
     Then I should not see "Masquerade as webmaster"

    # Check if a site admin user can masquerade as an authenticated user.
     When I go to "/admin/people"
      And wait
      And I fill in "Normal user" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Normal user"
     When I click "Normal user" in the "Normal user" row
      And wait
     Then I should see "Masquerade as Normal user"

# Check if a site admin user can masquerade as a Content editor user.
     When I go to "/admin/people"
      And wait
      And I fill in "Content editor" for "Name or email contains"
      And I press "Filter"
      And wait
      And I scroll to bottom
     Then I should see "Content editor"
     When I click "Content editor" in the "Content editor" row
      And wait
     Then I should see "Masquerade as Content editor"

    # Check if a site admin user can masquerade as a content admin user.
     When I go to "/admin/people"
      And wait
      And I fill in "Content admin" for "Name or email contains"
      And I press "Filter"
      And wait
     Then I should see "Content admin"
     When I click "Content admin" in the "Content admin" row
      And wait
     Then I should see "Masquerade as Content admin"

  @javascript @check @local @development @staging @production
  Scenario: Check if a content admin user can NOT masquerade as the super user ID 1 the admin
    Given I am a logged in user with the "Content admin" user
     When I go to "/user/1"
      And wait
     Then I should not see "Masquerade as webmaster"

  @javascript @check @local @development @staging @production
  Scenario: Check if an editor user can NOT masquerade as the super user ID 1 the admin
    Given I am a logged in user with the "Content editor" user
     When I go to "/user/1"
      And wait
     Then I should not see "Masquerade as webmaster"

  @javascript @check @local @development @staging @production
  Scenario: Check if an authenticated user can NOT masquerade as the super user ID 1 the admin
    Given I am a logged in user with the "Normal user" user
     When I go to "/user/1"
      And wait
     Then I should not see "Masquerade as webmaster"
