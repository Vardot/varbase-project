@regression @any @content
Feature: Frontend Pages - Contact Us Page
      As a site visitor
      I want to use the Contact Us page
      So that I can submit inquiries.

  @check @local @development @staging @production
  Scenario: Check that the Contact Us page loads with correct heading
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Contact Us"
      And I should see "Ask us about anything"
      And I should not see "Page not found"

  @check @local @development @staging @production
  Scenario: Check that the Contact Us page loads within the performance budget
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then the page should load in less than 10 seconds

  @check @local @development @staging @production
  Scenario: Check that all Business Contact form fields are present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see a "First Name" element
      And I should see a "Last name" element
      And I should see a "Company name" element
      And I should see a "Industry" element
      And I should see a "Country" element
      And I should see a "Email" element
      And I should see a "Phone number" element
      And I should see a "Subject" element
      And I should see a "Message" element

  @check @local @development @staging @production
  Scenario: Check that the required Business Contact fields are marked required
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then the field "First Name" should be required
      And the field "Last name" should be required
      And the field "Company name" should be required
      And the field "Email" should be required
      And the field "Subject" should be required

  @check @local @development @staging @production
  Scenario: Check that the Industry select lists its options
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then the option "Technology" should exist within the select element "[name='industry']"
      And the option "Finance & Banking" should exist within the select element "[name='industry']"
      And the option "Healthcare" should exist within the select element "[name='industry']"
      And the option "Other" should exist within the select element "[name='industry']"

  @check @local @development @staging @production
  Scenario: Check that the submit button is present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Submit Form"

  @check @local @development @staging @production
  Scenario: Check that legal links are present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Terms of Service"
      And I should see "Privacy Policy"

  @check @local @development @staging @production
  Scenario: Check that the contact information section is visible
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Contact Information"
      And I should see "(408) 329 9888"
      And I should see "3080 Olcott St"

  @check @local @development @staging @production
  Scenario: Check that the Contact Us page has breadcrumb navigation
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Home"
