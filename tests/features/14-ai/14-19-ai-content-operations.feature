@ai
Feature: Varbase AI Recipe - AI Content Operations Base - The assistant in the editor's toolbar
      As a content editor
      I want to open the content operations assistant from any admin page
      So that I can ask it to audit, report on or fix content in my own words.

  @check @ai @recipes @local @development @staging @production
  Scenario Outline: Check the "<user>" user opens the assistant from the toolbar
    Given I am a logged in user with the "<user>" user
     When I go to "/admin/content"
      And I click the "Open AI assistant" button
      And I click allow the chat assistant this time
     Then I should see "I help you keep the content correct, findable and consistent."
      And I see visible chat input

    Examples:
      | user           |
      | Content editor |
      | Content admin  |
      | SEO admin      |

  @check @ai @recipes @access @local @development @staging @production
  Scenario: Check a signed-in user without an editorial role has no assistant
    Given I am a logged in user with the "Normal user" user
     When I go to "/user"
     Then I should see "Member for"
      And I don't see assistant button

  @check @ai @recipes @a11y @local @development @staging @production
  Scenario: Check the content page gives every field a label and every link a name
    Given I am a logged in user with the "Content editor" user
     When I go to "/admin/content"
     Then every form field should have an accessible label
      And every link should have an accessible name
      And every ARIA role should be valid
