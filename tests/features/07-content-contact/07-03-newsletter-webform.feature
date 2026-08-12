@regression @any @content
Feature: Frontend Webform - Newsletter Subscribe
      As a marketer
      I want the Newsletter Subscribe form on the Home and Contact Us pages
      So that visitors can subscribe and we can see their emails in the back-end.

  @check @local @development
  Scenario: Add the Newsletter form to the bottom of the homepage
    Given I am a logged in user with the "webmaster" user
      And I add the "Newsletter Subscribe (newsletter_subscribe)" webform to the bottom of the "Home" Canvas page and publish it
     When I am an anonymous user
      And I go to the homepage
      And wait
     Then I should see "Subscribe"
      And I should see a "Email" element

  @check @local @development
  Scenario: Add the Newsletter form to the Contact Us page
    Given I am a logged in user with the "webmaster" user
      And I add the "Newsletter Subscribe (newsletter_subscribe)" webform to the bottom of the "Contact Us" Canvas page and publish it
     When I am an anonymous user
      And I go to "/contact-us"
      And wait
     Then I should see "Subscribe"
      And I should see a "Email" element

  @check @local @development
  Scenario: A subscription from the homepage is recorded in the back-end
    Given I am a logged in user with the "webmaster" user
      And I add the "Newsletter Subscribe (newsletter_subscribe)" webform to the bottom of the "Home" Canvas page and publish it
     When I am an anonymous user
      And I go to the homepage
      And wait
      And I fill in "Email" with "po.subscriber@example.com"
      And I press "Subscribe"
      And wait
     Then I should see "Nice to have you on board"
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/structure/webform/manage/newsletter_subscribe/results/submissions"
      And wait
     Then I should see "po.subscriber@example.com"
