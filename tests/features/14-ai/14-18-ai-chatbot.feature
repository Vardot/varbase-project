@ai
Feature: Varbase AI Recipe - AI Chatbot Base - Visitors talk to the chatbot, only administrators change it
      As a site owner
      I want visitors to use the chatbot without being able to change it
      So that the chatbot keeps answering the way the site set it up.

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check an anonymous visitor cannot change the chatbot
    Given I am an anonymous user
     When I go to "/admin/config/ai/ai-assistant/varbase_ai_chatbot"
     Then I should not see "Sorry, I could not answer that just now."
      And I should see "Log in"

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check the webmaster can open the chatbot settings
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/ai/ai-assistant/varbase_ai_chatbot"
     Then I should see "Sorry, I could not answer that just now. Please try again."

  @check @ai @recipes @a11y @local @development @staging @production
  Scenario: Check the chatbot settings page gives every field a label and every link a name
    Given I am a logged in user with the "webmaster" user
     When I go to "/admin/config/ai/ai-assistant/varbase_ai_chatbot"
     Then every form field should have an accessible label
      And every link should have an accessible name
      And every ARIA role should be valid
