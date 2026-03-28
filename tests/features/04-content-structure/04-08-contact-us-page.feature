Feature: Frontend Pages - Contact Us Page
      As a site visitor
      I want to use the Contact Us page
      So that I can submit inquiries.

  @javascript @check @local @development @staging @production
  Scenario: Check that the Contact Us page loads with correct heading
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Contact Us"
      And I should see "Ask Us About Anything!"
      And I should not see "Page not found"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Contact Us form fields are present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see a "First Name" element
      And I should see a "Last Name" element
      And I should see a "Business" element
      And I should see a "Industry" element
      And I should see a "Country" element
      And I should see a "Email" element
      And I should see a "Phone Number" element
      And I should see a "Message" element

  @javascript @check @local @development @staging @production
  Scenario: Check that the submit button is present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Submit Your Request"

  @javascript @check @local @development @staging @production
  Scenario: Check that legal links are present
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Terms of Service"
      And I should see "Privacy Policy"

  @javascript @check @local @development @staging @production
  Scenario: Check that the contact information section is visible
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Contact Information"
      And I should see "(408) 329 9888"
      And I should see "3080 Olcott St"

  @javascript @check @local @development @staging @production
  Scenario: Check that the Contact Us page has breadcrumb navigation
    Given I am an anonymous user
     When I go to "/contact-us"
      And wait
     Then I should see "Home"
