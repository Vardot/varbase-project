@ai
Feature: Varbase AI Recipe - AI Image Alt - Generate with AI on the image form
      As a content editor
      I want a Generate with AI button for the alt text of the images I add
      So that every image can get an accessible description without extra work.

  @check @ai @recipes @local @development @staging
  Scenario Outline: Check the "<user>" user gets Generate with AI for the alt text
    Given I am a logged in user with the "<user>" user
     When I go to "/media/add/image"
     Then I should see "AI description and tags"
     When I attach the file "house.jpg" to the "Add a new file" field
      And I click allow the image AI this time
     Then I see visible generate with ai button

    Examples:
      | user           |
      | Content editor |
      | Content admin  |
      | SEO admin      |
      | Site admin     |
