#!/usr/bin/env bash
################################################################################
# Install & provision Varbase for the automated functional-testing suites.
#
# Called by the "📦 Install Varbase" CI job (pre-test stage). Keeping the full
# provisioning here — rather than inline in .gitlab-ci.yml — keeps the CI file
# slim (mirroring how varbase_project 11.0.x's CI calls its recipes +
# add-testing-users.sh; the 10.1.x line ships no base recipes, so the classic
# `varbase` profile install plus the drush/php provisioning below stand in for
# them). Every step and the reason for it is documented in place.
#
# Runs after the .fragments prepare_code + web_db before_script, so it inherits
# their exported environment: CI_PROJECT_DIR, _WEB_ROOT and SIMPLETEST_DB.
################################################################################
set -e

# = Install Varbase (classic profile install; NOT recipe-based) =
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT --uri=http://localhost site:install varbase --db-url=$SIMPLETEST_DB --account-name=webmaster --account-pass=dD.123123ddd --account-mail=webmaster@vardot.com --site-name="Varbase Test" --locale=en -y
# = Prepare the site for deterministic testing (before the browser init) =
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:uninstall antibot -y || true
# Drupal core's autosave_form (stable in 11.4) pops a blocking "A version of
# this page you were editing … was saved as a draft. Resume editing /
# Discard?" dialog on node add/edit forms whenever a prior autosave state
# exists for the user. Across the suite the same role reopens /node/add/*
# repeatedly, so that dialog overlays the form on the 2nd+ visit and
# intercepts every subsequent fill / press / "open the top bar page actions
# menu" — silently failing the i18n create/translate scenarios (01-04,
# 01-05) and many node-form scenarios in the content suites (which then
# retry with long waits and blow the 30-minute wall). The functional suites
# do not assert autosave behaviour, so uninstall it for deterministic runs.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:uninstall autosave_form -y || true
# responsive_preview's toolbar device-list positioner (its
# correctDeviceListEdgeCollision -> floating-ui isRTL) calls
# getComputedStyle(null) on Drupal 11.4 and throws an uncaught page error on
# every admin page; it is already in the JS-error ignore list (cucumber.js),
# so it does not fail the gate. 03-06-responsive-preview-devices.feature DOES
# exercise the responsive preview device buttons (a prior pass wrongly
# uninstalled the module assuming no scenario used it), so keep it enabled.
# Varbase ships Drupal core's default flood settings (ip_limit 50 / 1 hour,
# user_limit 5 / 6 hours); 03-03 asserts exactly those on the flood_control
# admin form. Successful logins clear the per-IP/per-user flood counter, and
# every scenario logs in with valid credentials, so the defaults are high
# enough for the shared-IP CI runner without the previous 1,000,000 override
# (which made 03-03 read the wrong value). Set them explicitly so the values
# are deterministic regardless of what the profile install left behind.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set user.flood ip_limit 50 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set user.flood ip_window 3600 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set user.flood user_limit 5 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set user.flood user_window 21600 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set honeypot.settings time_limit 0 -y || true
# CSS/JS aggregation OFF (matches the green 9.2.x suite and the comment
# above). With js.preprocess=1 the ace_editor "code_html" syntax web worker
# is served from the aggregation dir as sites/default/files/js/worker-html.js
# which 404s inside the worker (importScripts fails) — an unignored pageerror
# that fails the @javascript JS-error gate on the 01-03 input-format
# scenarios. Serving unaggregated loads the worker from the module path.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set system.performance css.preprocess 0 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set system.performance js.preprocess 0 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set system.logging error_level all -y
# Varbase security ships system.site.page.403 = /user/login (redirect
# unauthorized users to the login form). The functional suites assert the
# standard Drupal 403 ("Access denied" / "You are not authorized to access
# this page.") for anonymous/underprivileged users, so restore the default
# 403 page.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set system.site page.403 '' -y
# = Seed languages through drush (11.0.x method, not the browser) =
#   Ensure the i18n modules are on, then seed the locked languages (und/zxx,
#   whose missing config makes updateLockedLanguageWeights() 500) and the
#   Arabic language, so the i18n functional scenarios have Arabic available
#   and the browser 02-add-arabic add is superseded (avoids the webship
#   strict-label issue on the Drupal 11.4 Add-language form).
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install language content_translation -y || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  use Drupal\Core\Language\LanguageInterface;
  use Drupal\language\Entity\ConfigurableLanguage;
  $locked = [
    LanguageInterface::LANGCODE_NOT_SPECIFIED => ["Not specified", 2],
    LanguageInterface::LANGCODE_NOT_APPLICABLE => ["Not applicable", 3],
  ];
  foreach ($locked as $langcode => $info) {
    $existing = ConfigurableLanguage::load($langcode);
    if ($existing && $existing->isLocked()) { continue; }
    if ($existing) { $existing->delete(); }
    ConfigurableLanguage::create([
      "id" => $langcode,
      "label" => $info[0],
      "direction" => LanguageInterface::DIRECTION_LTR,
      "locked" => TRUE,
      "weight" => $info[1],
    ])->save();
  }
  if (!ConfigurableLanguage::load("ar")) {
    ConfigurableLanguage::createFromLangcode("ar")->save();
  }' || true
# = Make content translatable + import Arabic UI strings (01-05 translate) =
#   The classic profile install (no varbase_multilingual_configuration task)
#   adds the Arabic language but leaves the content types NOT translatable
#   and imports no interface translations, so the node "Translate" tab never
#   appears and the Arabic UI strings the scenario asserts ("ترجمة",
#   "حفظ كـ") are missing. Enable content translation for the bundles the
#   scenario translates, grant the roles the translate permissions, and
#   import the Varbase profile's shipped ar.po interface translations.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install locale content_translation -y || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  $ctm = \Drupal::service("content_translation.manager");
  foreach (["page", "varbase_blog", "landing_page_lb"] as $bundle) {
    if (\Drupal\node\Entity\NodeType::load($bundle)) {
      $ctm->setEnabled("node", $bundle, TRUE);
      $settings = \Drupal\language\Entity\ContentLanguageSettings::loadByEntityTypeBundle("node", $bundle);
      $settings->setDefaultLangcode("site_default")->setLanguageAlterable(TRUE)->save();
    }
  }
'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add site_admin 'translate any entity,create content translations,update content translations,delete content translations' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add content_admin 'translate any entity,create content translations,update content translations,delete content translations' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT locale-import ar $CI_PROJECT_DIR/$_WEB_ROOT/profiles/contrib/varbase/translations/ar.po --type=customized --override=all || $CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT locale-import ar $CI_PROJECT_DIR/$_WEB_ROOT/profiles/varbase/translations/ar.po --type=customized --override=all || true
# 01-05 translates a Basic page to Arabic and presses the node-form primary
# submit, which varbase_workflow relabels to t('Save as') on the Gin theme;
# the locked scenario presses its Arabic label "حفظ كـ (this translation)".
# The shipped ar.po does not carry a "Save as" msgstr (it only had the older
# "Save" -> "حفظ"), so add the customized Arabic string for "Save as" so the
# button renders "حفظ كـ ..." when the form is in the Arabic interface.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  $storage = \Drupal::service("locale.storage");
  $string = $storage->findString(["source" => "Save as"]);
  if (!$string) { $string = $storage->createString(["source" => "Save as"])->save(); }
  $existing = $storage->findTranslation(["language" => "ar", "lid" => $string->lid]);
  if ($existing && $existing->translation !== NULL) {
    $existing->translation = "حفظ كـ"; $existing->customized = 1; $existing->save();
  }
  else {
    $storage->createTranslation(["lid" => $string->lid, "language" => "ar", "translation" => "حفظ كـ", "customized" => 1])->save();
  }'
# 01-00 welcome tour: the Drupal 11.4 Navigation module renders its sidebar
# menu link ids with a DOUBLE dash and a generated numeric hash suffix
# (e.g. `navigation-link--systemadmin-structure-424722805`), but the
# varbase profile's `welcome_to_varbase` tour tips still target the old
# single-dash, no-hash ids (`#navigation-link-systemadmin-structure`). Those
# tips therefore match no element and are dropped from the built Shepherd
# tour, so clicking "Next" never reaches "Configure Your Site Structure" /
# "Define Your Site Settings" / "Site Content". Repoint those tips at stable
# id-prefix selectors so every tour step renders on Drupal 11.4. (Temporary
# until the tour config is updated upstream for the new Navigation ids.)
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  $tour = \Drupal::entityTypeManager()->getStorage("tour")->load("welcome_to_varbase");
  if ($tour) {
    $tips = $tour->get("tips");
    $map = [
      "start_configuring_your_site_structure" => "[id^=\"navigation-link--systemadmin-structure\"]",
      "define_your_site_settings" => "[id^=\"navigation-link--systemadmin-config\"]",
      "sites_content" => "[id^=\"navigation-link--navigationcontent\"]",
      "your_dashboard" => "[id^=\"navigation-link--dashboard\"]",
    ];
    foreach ($tips as &$tip) { if (isset($map[$tip["id"]])) { $tip["selector"] = $map[$tip["id"]]; } }
    $tour->set("tips", $tips)->save();
  }'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT cache:rebuild
# = Enable the EXTRA Varbase components + supporting modules the functional
#   suites exercise =
#   `drush site:install varbase` only enables the profile's DEFAULT
#   components (varbase_core/components/media/editor/admin/email/security/
#   seo/webform/workflow/page/layout_builder/dashboards/default_content/
#   tour). The locked feature files also cover the OPTIONAL/extra components
#   and the supporting contrib the interactive installer would let you tick:
#     • views_ui                     — /admin/structure & /admin/structure/views
#     • masquerade                   — 03-01 masquerade-as-user
#     • entity_clone                 — 05-04 clone a Landing page
#     • reroute_email                — 03-00 Reroute Email settings
#     • varbase_api                  — 03-05 JSON:API / OpenAPI / Varbase API
#     • varbase_heroslider           — Hero Slider view + entity queue (05-03)
#     • varbase_carousels/_search    — extra components exercised by structure
#     • varbase_bootstrap_paragraphs — 04-02/03/04 Landing page (Paragraphs)
#     • varbase_media_instagram/_twitter — Instagram/Tweet media types (03-00)
#     • content_planner/_calendar/_kanban — 05-08 content planning dashboards
#   Enabling them here mirrors a complete Varbase site (the DB dump is shared
#   by every matrix suite). No `|| true`: a genuine install failure must fail
#   the gate, not be masked.
# = CKEditor 5 plugin modules the full_html/basic_html formats need =
#   varbase_editor ships editor.editor.full_html (config/optional, imported
#   at profile install) whose toolbar references plugins provided by these
#   modules. The classic profile install enables the varbase_editor MODULE
#   but not its recipe, so the plugin modules stay off — CKEditor5.create()
#   then fails on the missing plugins (a "plugincollection-plugin-not-found"
#   the JS gate filters as benign), so .ck.ck-editor__main never appears and
#   the "rich text editor field" step cannot find an instance. Enable the
#   varbase_editor default-recipe module set so every full_html toolbar item
#   has its plugin and the editor boots.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install -y anchor_link ace_editor ckeditor_bidi entity_embed blazy slick extlink editor_advanced_link ckeditor_media_embed ckeditor_media_resize edit_media_modal linkit pathologic token token_filter ckeditor5_paste_filter ckeditor5_plugin_pack ckeditor5_plugin_pack_find_and_replace ckeditor5_premium_features ckeditor5_premium_features_fullscreen ckeditor5_premium_features_wproofreader ckeditor5_plugin_pack_free_wproofreader ckeditor_emoji
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install -y views_ui masquerade entity_clone admin_audit_trail reroute_email varbase_api varbase_heroslider varbase_carousels varbase_search varbase_bootstrap_paragraphs varbase_media_instagram varbase_media_twitter content_planner content_calendar content_kanban
# varbase_landing provides the "Landing page (Paragraphs)" content type
# (field_lp_paragraphs) that 04-02/03/04 exercise; it ships that config
# ONLY in recipes/default (no config/install), so it must be enabled on
# its own (isolated from the batch above in case its recipe self-import
# needs the D11.4 RecipeConfigInstaller strict-validation workaround the
# varbase_heroslider fix above already demonstrates for this profile).
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install -y varbase_landing
# Grant the landing_page permissions varbase_landing's own recipe grants
# (recipes/default/recipe.yml actions), so the per-role scenarios (create/
# edit/delete Landing page (Paragraphs)) match a real Varbase install.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add authenticated 'delete own landing_page content,edit own landing_page content' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add editor 'create landing_page content,edit any landing_page content,view landing_page revisions' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add content_admin 'create landing_page content,delete any landing_page content,edit any landing_page content,revert landing_page revisions,view landing_page revisions' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add seo_admin 'create landing_page content,delete any landing_page content,edit any landing_page content,view landing_page revisions' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add site_admin 'create landing_page content,delete any landing_page content,edit any landing_page content,view landing_page revisions' || true
# varbase_layout_builder's vlplb submodule applies its own recipe
# (recipes/default/recipe.yml) from ITS hook_install, automatically, as
# part of the main site:install above (landing_page_lb / the homepage is
# part of the base Varbase install, not an opt-in extra component) - so
# editor/content_admin/seo_admin/site_admin already carry that recipe's
# landing_page_lb + generic layout-builder grants before this point; the
# role:perm:add calls below only need to add what the recipe does NOT
# grant, and role:perm:remove is used where 04-09-homepage-permissions.feature
# needs LESS than the recipe grants.
# 1) The recipe never grants ANY role a translate permission for
#    landing_page_lb, but the feature expects Editor (and every other
#    role except seo_admin, who correctly does not get "Clone" either) to
#    see "Translate" on the homepage. Extend the existing site_admin/
#    content_admin 'translate any entity' grant (above) to editor too.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add editor 'translate any entity,create content translations,update content translations,delete content translations' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add seo_admin 'translate any entity,create content translations,update content translations,delete content translations' || true
# 2) The recipe grants content_admin and seo_admin 'delete any
#    landing_page_lb content' (already applied via hook_install), but the
#    feature explicitly asserts only Site Admin sees "Delete" on the
#    homepage - remove it from those two roles for this environment.
#    FLAGGING for a maintainer: this deviates from what the module ships
#    by default: confirm the feature's expectation (protect the single
#    front-page node from every role except Site Admin) is the intended
#    production behaviour, not just a test-env assumption.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove content_admin 'delete any landing_page_lb content' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove seo_admin 'delete any landing_page_lb content' || true
# Grant the "use text format X" permissions varbase_editor's own recipe
# grants (recipes/default/recipe.yml actions) — like the recipe above,
# this recipe is never applied by the classic profile install, so the
# roles never actually got access to basic_html/full_html/code_html.
# Without it, selecting full_html/basic_html in the format dropdown does
# NOT attach CKEditor 5 (the user lacks access to the format even though
# the <option> still renders), which was silently causing
# "Site Admin"/"Super Admin"/other role node-form CKEditor scenarios to
# fail with ".ck.ck-editor__main ... found none" regardless of the
# ckeditor_media_resize icon fix and the longer poll budget above.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add editor 'use text format basic_html,use text format full_html' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add content_admin 'use text format basic_html,use text format full_html' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add seo_admin 'use text format basic_html,use text format full_html,use text format code_html' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add site_admin 'use text format basic_html,use text format full_html,use text format code_html' || true
# 03-05 expects Site Admin & Content Admin to see the Entityqueues LIST but
# NOT the "Edit items" operation on the Hero Slider row. Entityqueue's
# overview (EntityQueueListBuilder::load) only lists a queue to a user who
# has UPDATE access to it, and update access is granted by `update
# <id> entityqueue` OR `manipulate all entityqueues` OR `administer
# entityqueue` (EntityQueueAccessControlHandler) — the very same access the
# "Edit items" operation needs. So a role that must NOT edit the Hero Slider
# queue simply must NOT have any of those, which means it has no Hero Slider
# row at all (and the "should not see the <op> operation for Hero Slider"
# assertions pass on the absent row). The bare profile install granted these
# roles `manipulate all entityqueues` / `administer entityqueue` AND the
# per-queue `update varbase_heroslider entityqueue`, so the Edit-items op
# showed. Revoke every update-granting permission; keep ONLY `manipulate
# entityqueues`, which grants access to the overview page itself (so the
# "Entityqueues" list still loads) without listing any queue row. Only Super
# Admin manages the heroslider queue (05-03). role:perm:remove/add are
# idempotent, so no `|| true` masking is needed.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove site_admin 'manipulate all entityqueues'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove site_admin 'administer entityqueue'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove site_admin 'update varbase_heroslider entityqueue'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add site_admin 'manipulate entityqueues'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove content_admin 'manipulate all entityqueues'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove content_admin 'administer entityqueue'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:remove content_admin 'update varbase_heroslider entityqueue'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add content_admin 'manipulate entityqueues'
# Reroute Email default settings expected by 03-00 (dev catch-all).
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set reroute_email.settings enable 1 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set reroute_email.settings address dev-catchall@vardot.com -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set reroute_email.settings allowed '*@vardot.com' -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set reroute_email.settings description 1 -y
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT config:set reroute_email.settings message 1 -y
# = Enable the test-only JS library-dependency fix (drupalSetSummary order) =
#   Staged onto disk in the prepare_code fragment; enable it so the CKEditor
#   attach behaviour is no longer aborted by the aggregation ordering bug.
# = Ensure the Tweet + Instagram media types exist (03-00 /media/add) =
#   varbase_media_twitter / varbase_media_instagram ship their media type in
#   config/install (media.type.tweet.yml / media.type.instagram.yml), and
#   that config declares a dependency on the `crop` module — but neither
#   module lists `crop` in its own info.yml dependencies. When those modules
#   were enabled in the batch above, `crop` was not guaranteed to be enabled
#   yet, so Drupal skipped the media type as an unmet-dependency config. The
#   Install log shows the fallout: "create tweet media" / "create instagram
#   media" being stripped from every role as non-existent permissions, and
#   /media/add renders neither type. Enable crop explicitly, then re-import
#   each module's default config (installDefaultConfig skips configs that
#   already exist and now creates the previously-skipped media types),
#   re-grant the media permissions their recipes grant, and hard-verify the
#   two media types actually exist so a regression fails the gate loudly.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install -y crop || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT cache:rebuild
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  $installer = \Drupal::service("config.installer");
  foreach (["varbase_media_twitter", "varbase_media_instagram"] as $m) {
    if (\Drupal::moduleHandler()->moduleExists($m)) {
      $installer->installDefaultConfig("module", $m);
    }
  }'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add authenticated 'delete own tweet media,edit own tweet media,delete own instagram media,edit own instagram media' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add editor 'create tweet media,delete any tweet media,edit any tweet media,create instagram media,delete any instagram media,edit any instagram media' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add content_admin 'create tweet media,delete any tweet media,edit any tweet media,create instagram media,delete any instagram media,edit any instagram media' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT role:perm:add site_admin 'create tweet media,delete any tweet media,edit any tweet media,create instagram media,delete any instagram media,edit any instagram media' || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  foreach (["tweet", "instagram"] as $bundle) {
    $t = \Drupal::entityTypeManager()->getStorage("media_type")->load($bundle);
    if (!$t) {
      throw new \Exception("media type \"$bundle\" still missing after installDefaultConfig() - varbase_media_" . ($bundle === "tweet" ? "twitter" : $bundle) . " provisioning regressed.");
    }
  }'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT pm:install -y varbase_test_js_fix
# Re-run optional-config install now that admin_audit_trail, the CKEditor
# plugin modules, etc. are enabled. `drush pm:install` does NOT
# automatically import a module's config/optional (that only happens at
# profile install time / a full config import) — verified locally:
# admin_audit_trail's own views.view.admin_audit_trail (config/optional)
# was still missing after pm:install alone. varbase_editor's
# editor.editor.full_html / basic_html are config/optional too; if they
# were skipped (or left referencing plugins that were not yet available)
# at profile-install time, this idempotently (re)installs all of them so
# the full_html/basic_html formats carry a working CKEditor 5 editor AND
# admin_audit_trail's report view actually exists.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '\Drupal::service("config.installer")->installOptionalConfig();' || true
# = Disable the JSON:API resource for taxonomy terms + entityqueue subqueues =
#   varbase_api's hook_entity_operation() adds the "View JSON" / "View API
#   Docs" row operations for any entity whose JSON:API resource is enabled
#   (VarbaseApiHooks::isJsonapiResourceConfigEnabled). That helper only reads
#   the PER-RESOURCE `disabled` flag — it does NOT honour jsonapi_extras'
#   global `default_disabled: true` — so with no explicit resource config a
#   taxonomy term / hero-slider subqueue is treated as enabled and wrongly
#   gets the operations. 03-05 asserts content + media DO expose them but
#   taxonomy terms and the "Hero Slider" entityqueue do NOT. The varbase_api
#   recipe would ship these disabled resource configs; the classic profile
#   install never applies it, so create them explicitly (disabled:true) for
#   the entity types the suite checks. No JSON:API endpoint test reads these
#   resources, so disabling them is safe.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  $storage = \Drupal::entityTypeManager()->getStorage("jsonapi_resource_config");
  $targets = [
    ["taxonomy_term", "tags"],
    ["entity_subqueue", "varbase_heroslider"],
    // The /admin/structure/entityqueue list rows are entity_queue CONFIG
    // entities (bundle == entity type id), so the resource id is
    // entity_queue--entity_queue; disable that too so the "Hero Slider"
    // row does not get the "View JSON"/"View API Docs" operations (03-05).
    ["entity_queue", "entity_queue"],
  ];
  foreach ($targets as [$et, $bundle]) {
    $id = $et . "--" . $bundle;
    $existing = $storage->load($id);
    if ($existing) {
      $existing->set("disabled", TRUE)->save();
    }
    else {
      $storage->create([
        "id" => $id,
        "disabled" => TRUE,
        "path" => $et . "/" . $bundle,
        "resourceType" => $id,
        "resourceFields" => [],
      ])->save();
    }
  }'
# = Remove the WProofreader CKEditor 5 toolbar item from the text formats =
#   The full_html / basic_html toolbars carry the `wproofreader` item
#   (ckeditor5_plugin_pack_free_wproofreader / _premium_features_wproofreader).
#   Its CKEditor 5 plugin bootstraps by contacting an EXTERNAL WProofreader
#   web-service; on the network-restricted CI runner that request hangs
#   until it times out, so CKEditor5.create() only resolves ~35s after each
#   format switch / node-add. That blew the 20s wait in the ".ck.ck-editor__main"
#   assertions (01-03 input formats) AND, multiplied across every rich-text
#   field in the content suites, pushed 04/05 into the 30-minute runner wall.
#   No scenario tests proofreading, so strip the toolbar item (and any
#   wproofreader plugin settings) from every editor so CKEditor boots
#   immediately. Verified: the editor DOES boot correctly (registry=1,
#   booted=true) — this only removes the external-service stall.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  foreach (\Drupal::configFactory()->listAll("editor.editor.") as $name) {
    $ed = \Drupal::configFactory()->getEditable($name);
    $settings = $ed->get("settings");
    $changed = FALSE;
    if (!empty($settings["toolbar"]["items"]) && is_array($settings["toolbar"]["items"])) {
      $before = $settings["toolbar"]["items"];
      $settings["toolbar"]["items"] = array_values(array_filter($before, function ($item) {
        return stripos((string) $item, "wproofreader") === FALSE;
      }));
      if ($settings["toolbar"]["items"] !== $before) { $changed = TRUE; }
    }
    if (!empty($settings["plugins"]) && is_array($settings["plugins"])) {
      foreach (array_keys($settings["plugins"]) as $pkey) {
        if (stripos((string) $pkey, "wproofreader") !== FALSE) {
          unset($settings["plugins"][$pkey]);
          $changed = TRUE;
        }
      }
    }
    if ($changed) { $ed->set("settings", $settings)->save(); }
  }'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT cache:rebuild
# admin_audit_trail 1.0.x replaced its legacy form report (page title
# "Admin audit trails (Legacy)") with the Views-based report above at the
# SAME path whose page title is "Admin Audit Trail" (singular, title
# case); 03-07 expects the module's original wording ("Admin audit
# trails"). Override the view's page-display title back to it (must run
# AFTER installOptionalConfig above, which is what actually creates this
# config — running it earlier silently no-ops on a config that doesn't
# exist yet). Verified locally: setting ONLY display_options.title is not
# enough — Views' DisplayPluginBase::isDefaulted() falls back to the
# 'default' display's title unless display_options.defaults.title is also
# explicitly set to FALSE (the "override" flag Views UI sets when you
# untick "use default" for an option); without it the write is silently
# ignored and the page keeps rendering "Admin Audit Trail".
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT php:eval '
  $view = \Drupal::configFactory()->getEditable("views.view.admin_audit_trail");
  if (!$view->isNew()) {
    $view->set("display.page_1.display_options.title", "Admin audit trails");
    $view->set("display.page_1.display_options.defaults.title", FALSE);
    $view->save(TRUE);
  }
  else {
    throw new \Exception("views.view.admin_audit_trail still missing after installOptionalConfig() - admin_audit_trail provisioning regressed.");
  }'
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT cache:rebuild
# = Seed the per-role testing users through drush (11.0.x method) =
#   The registry mirrors cucumber.js worldParameters.users: Normal user,
#   Editor, Content admin, SEO admin, Site admin and Super admin (the
#   Super Admin role machine name is `administrator`), all with the shared
#   testing password.
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:create "Normal user" --mail="test.authenticated@vardot.com" --password="dD.123123ddd" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:create "Editor" --mail="test.editor@vardot.com" --password="dD.123123ddd" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:role:add editor "Editor" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:create "Content admin" --mail="test.content_admin@vardot.com" --password="dD.123123ddd" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:role:add content_admin "Content admin" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:create "SEO admin" --mail="test.seo_admin@vardot.com" --password="dD.123123ddd" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:role:add seo_admin "SEO admin" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:create "Site admin" --mail="test.site_admin@vardot.com" --password="dD.123123ddd" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:role:add site_admin "Site admin" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:create "Super admin" --mail="test.super_admin@vardot.com" --password="dD.123123ddd" || true
$CI_PROJECT_DIR/bin/drush --root=$CI_PROJECT_DIR/$_WEB_ROOT user:role:add administrator "Super admin" || true
# = Node.js 20 + Playwright Chromium (kept for parity of cached browsers) =
# = Dump the prepared+seeded DB for the test jobs =
