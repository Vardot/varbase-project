@regression @any @i18n
Feature: Varbase Recipe - i18n Base (languages + translation)
      As a webmaster
      I want this Varbase recipe to deliver its user-facing behaviour
      So that it keeps working after install or update.

  Background:
    Given I am a logged in user with the "webmaster" user

  @check @recipes @local @development @staging @production
  Scenario: Language admin and content translation are available
     When I go to "/admin/config/regional/language"
      And wait
      And I wait for the text "Languages" to appear
     Then I should see "Languages"
     When I go to "/admin/config/regional/content-language"
      And wait
      And I wait for the text "Custom language settings" to appear
     Then I should see "Custom language settings"

  # The recipe makes the Translation Management Tool (TMGMT) AVAILABLE - it ships
  # in the codebase - but deliberately does not install it: which translation
  # workflow a site runs is the site's decision, not the distribution's. Read
  # that straight off the Extend page a site builder uses: TMGMT is offered with
  # its install checkbox clear, while the translation modules the recipe DOES
  # install are already checked.
  @check @recipes @local @development @staging @production
  Scenario: The Translation Management Tool is offered for the site to enable, not enabled by the recipe
     When I go to "/admin/modules"
      And wait
      And I wait for the text "Translation Management Core" to appear
     Then I should see "Translation Management Core"
      And the checkbox labeled "Translation Management Core" should be unchecked
      And the checkbox labeled "Content Translation" should be checked
      And the checkbox labeled "Configuration Translation" should be checked
      And the checkbox labeled "Interface Translation" should be checked

  # Content translation is switched on for the Drupal Canvas "Page" entity, and
  # the field that holds what an editor typed into each component - "Component
  # input values" - is translatable, which is what lets a translator rewrite a
  # Canvas page's copy instead of only its title. Read on the Content language
  # and translation screen; the entity types the recipe does not translate stay
  # clear, so the scope is deliberate rather than blanket.
  @check @recipes @local @development @staging @production
  Scenario: Content translation is enabled for the Drupal Canvas Page and its component input values
     When I go to "/admin/config/regional/content-language"
      And wait
      And I wait for the text "Custom language settings" to appear
     Then I should see "Custom language settings"
      And the Drupal checkbox "edit-entity-types-canvas-page" is checked
      And the Drupal checkbox "edit-entity-types-node" is unchecked
      And I should see "Component input values"
      And the Drupal checkbox "edit-settings-canvas-page-canvas-page-fields-components" is checked
      And the Drupal checkbox "edit-settings-canvas-page-canvas-page-fields-title" is checked
      And the Drupal checkbox "edit-settings-canvas-page-canvas-page-translatable" is checked

  # The recipe grants the translation permissions to the Varbase editorial roles,
  # and grants them unevenly on purpose: everyone editorial may create and edit a
  # translation, only Content Admin and Site Admin may delete one, and a plain
  # authenticated user may do none of it. Read on the permissions screen for the
  # Content Translation module.
  @check @recipes @local @development @staging @production
  Scenario: The Varbase editorial roles hold the content translation permissions
     When I go to "/admin/people/permissions/module/content_translation"
      And wait
      And I wait for the text "Create translations" to appear
     Then I should see "Create translations"
      And I should see "Edit translations"
      And I should see "Delete translations"
      And I should see "Translate any entity"
      And the Drupal checkbox "edit-content-editor-create-content-translations" is checked
      And the Drupal checkbox "edit-content-editor-update-content-translations" is checked
      And the Drupal checkbox "edit-content-editor-translate-any-entity" is checked
      And the Drupal checkbox "edit-content-editor-delete-content-translations" is unchecked
      And the Drupal checkbox "edit-content-admin-create-content-translations" is checked
      And the Drupal checkbox "edit-content-admin-update-content-translations" is checked
      And the Drupal checkbox "edit-content-admin-translate-any-entity" is checked
      And the Drupal checkbox "edit-content-admin-delete-content-translations" is checked
      And the Drupal checkbox "edit-seo-admin-create-content-translations" is checked
      And the Drupal checkbox "edit-seo-admin-update-content-translations" is checked
      And the Drupal checkbox "edit-seo-admin-delete-content-translations" is unchecked
      And the Drupal checkbox "edit-site-admin-create-content-translations" is checked
      And the Drupal checkbox "edit-site-admin-update-content-translations" is checked
      And the Drupal checkbox "edit-site-admin-delete-content-translations" is checked
      And the Drupal checkbox "edit-authenticated-create-content-translations" is unchecked
      And the Drupal checkbox "edit-authenticated-update-content-translations" is unchecked
      And the Drupal checkbox "edit-authenticated-translate-any-entity" is unchecked
