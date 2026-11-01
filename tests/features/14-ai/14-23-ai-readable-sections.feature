@ai
Feature: Varbase AI Recipe - AI Readable Base - SEO admins add to /llms.txt
  As an SEO admin
  I want to add my own sections to /llms.txt
  So that AI tools also get the facts our menus do not show

  @check @ai @recipes @local @development @staging @production
  Scenario: Verify a section added by the SEO admin is published in /llms.txt
    Given I am a logged in user with the "SEO admin" user
     When I go to "/admin/content/llms-txt/add-section"
      And I fill in "Title" with "Getting help"
      And I fill in the rich text editor field "Content" with "Write to the support team from the Contact Us page."
      And I check "Enabled"
      And I press "Save"
     When I go to "/llms.txt"
     Then I should see "Getting help"
      And I should see "Write to the support team from the Contact Us page."
