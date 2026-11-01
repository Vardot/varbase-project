@ai
Feature: Varbase AI Recipe - AI Taxonomy Tagging - Suggest tags while writing a page
      As a content editor
      I want a Suggest tags button beside the Tags of my page
      So that I can pick tags the AI proposes from the site's own vocabulary before I save.

  @check @ai @recipes @local @development @staging @production
  Scenario Outline: Check the "<user>" user gets one Suggest tags button and no automator status field
    Given I am a logged in user with the "<user>" user
     When I go to "/node/add/page"
     Then I should see "Tags"
      And I see visible suggest tags button
      And I don't see second suggest tags button
      And I should not see "AI Automator Status"

    Examples:
      | user           |
      | Content editor |
      | Content admin  |
      | SEO admin      |
      | Site admin     |

  @check @ai @recipes @a11y @local @development @staging @production
  Scenario: Check the page form gives every field a label and every link a name
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/page"
     Then every form field should have an accessible label
      And every link should have an accessible name
      And every ARIA role should be valid
