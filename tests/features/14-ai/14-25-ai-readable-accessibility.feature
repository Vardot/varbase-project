@ai
Feature: Varbase AI Recipe - AI Readable Base - Accessible llms.txt sections
  As an SEO admin who uses assistive technology
  I want the llms.txt section form to work with a keyboard and a screen reader
  So that I can describe the site to AI tools like anyone else

  @check @ai @recipes @a11y @local @development @staging @production
  Scenario: Check the llms.txt section form gives every field a label and every link a name
    Given I am a logged in user with the "SEO admin" user
     When I go to "/admin/content/llms-txt/add-section"
     Then every form field should have an accessible label
      And every link should have an accessible name
      And every ARIA role should be valid
