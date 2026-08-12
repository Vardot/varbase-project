@regression @any @auth
Feature: Varbase Recipe - Security Base (password policy + CAPTCHA)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Password policy and CAPTCHA are configured
     When I go to "/admin/config/security/password-policy"
      And wait
      And I wait for the text "Password" to appear
     Then I should see "Password"
     When I go to "/admin/config/people/captcha"
      And wait
      And I wait for the text "CAPTCHA" to appear
     Then I should see "CAPTCHA"
