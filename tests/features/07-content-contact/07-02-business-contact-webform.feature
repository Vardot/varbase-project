@regression @any @content
Feature: Frontend Webform - Business Contact on the Contact Us page
      As a site visitor
      I want to fill in the Business Contact webform on the Contact Us page
      So that I can prepare a business inquiry to the Varbase team.

  @check @local @development @staging @production
  Scenario: Check that the visitor can fill the Business Contact text fields
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
      And I fill in "First Name" with "Test"
      And I fill in "Last name" with "Tester"
      And I fill in "Company name" with "Vardot QA"
      And I fill in "Subject" with "Automated test inquiry"
     Then the field "First Name" should not be empty
      And the field "Last name" should not be empty
      And the field "Company name" should not be empty
      And the field "Subject" should not be empty

  @check @local @development @staging @production
  Scenario: Check that the visitor can choose Industry and Country
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
      And I select "Technology" from "industry"
      And I select "United States" from "country"
     Then the option "Technology" should be selected within the select element "[name='industry']"
      And the option "United States" should be selected within the select element "[name='country']"

  @check @local @development @staging @production
  Scenario: Check that the international phone field accepts a valid number
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
      And I fill in the international phone number with "+14155552671"
     Then the field "Phone number" should not be empty

  @check @local @development @staging @production
  Scenario: Check that the Message field shows its character counter
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see a "Message" element
      And I should see "0/200 Characters"

  @check @local @development @staging @production
  Scenario: Check that the agreement and legal links are present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "By submitting this form you agree to"
      And I should see "Terms of Service"
      And I should see "Privacy Policy"
