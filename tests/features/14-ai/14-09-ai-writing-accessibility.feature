@ai @a11y
Feature: Varbase AI Recipe - AI Base - Accessible writing with AI
      As a content editor who uses assistive technology
      I want the blog form with its AI and SEO tools to work with a keyboard and a screen reader
      So that I can write with AI help like anyone else.

  @check @ai @recipes @a11y @local @development @staging @production
  Scenario: Check the blog form gives every field a label and every link a name
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/blog"
     Then every form field should have an accessible label
      And every link should have an accessible name
      And every ARIA role should be valid

  @check @ai @recipes @a11y @local @development @staging @production
  Scenario Outline: Check the blog form keeps the "<rule>" accessibility rule
    Given I am a logged in user with the "Content editor" user
     When I go to "/node/add/blog"
     Then the page should not violate the accessibility rule "<rule>"

    Examples:
      | rule              |
      | label             |
      | link-name         |
      | duplicate-id-aria |
      | aria-valid-attr   |
