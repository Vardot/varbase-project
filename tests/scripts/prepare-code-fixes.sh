#!/usr/bin/env bash
################################################################################
# On-disk code fixes applied after the composer build, before installing.
#
# Called by the .fragments prepare_code before_script (after `composer install`)
# in every browser-test job, so the fixes are present on disk in the install job
# AND in each restored-site test job. Each block is idempotent and self-healing
# (it only touches the known-broken pattern and hard-fails loudly if a patch
# does not take, so an upstream version drift is never silently ignored). These
# are temporary until the corresponding upstream releases land.
#
# Inherits CI_PROJECT_DIR and _WEB_ROOT from the CI environment.
################################################################################
set -e

# Relax the runtime core_version_requirement of the dependencies that still
# declare ~11.3.0 (varbase family + some contrib) so Drupal 11.4 accepts
# them at module-install time. This mirrors, on disk, the composer Drupal
# Lenient relaxation that let the suite resolve; without it drush
# site:install fails with "module ... is incompatible with this version of
# Drupal core".
find "$CI_PROJECT_DIR/$_WEB_ROOT/profiles" "$CI_PROJECT_DIR/$_WEB_ROOT/modules" "$CI_PROJECT_DIR/$_WEB_ROOT/themes" -name '*.info.yml' -print0 2>/dev/null \
  | xargs -0 -r sed -i -E "s/core_version_requirement:[[:space:]]*'?~11\.3\.0'?/core_version_requirement: ^11.3 || ^11.4/"
# Repoint the varbase_media_demo demo content away from Vimeo entirely.
# A prior fix repointed the dead demo Vimeo video ID to another Vimeo
# video ("The Mountain", 22439234), which resolves fine via a direct curl
# to Vimeo's own oEmbed API — but `drush site:install` still fails with
# "No matching oEmbed provider found for resource" (verified across 5
# separate CI attempts, not flakiness). Root cause, confirmed by fetching
# https://oembed.com/providers.json directly: Vimeo has been removed
# entirely from that community-maintained provider registry (it now lives
# under iamcal/oembed's providers-disabled/vimeo.yml on GitHub, not the
# published providers.json) — Drupal's UrlResolver has no scheme to match
# ANY vimeo.com URL against, permanently, regardless of video ID. Switch
# the two demo "Remote Vimeo Video" media items to YouTube instead
# (confirmed present in the current providers.json), reusing the same
# sample video ID varbase_media_demo's own "Remote Youtube Video" demo
# item already ships, so the imported entity stays schema-valid. Also
# relabel them so the demo content doesn't claim to be Vimeo. Temporary:
# remove once varbase_media_demo ships oEmbed-provider-agnostic demo
# content upstream.
DEMO="$CI_PROJECT_DIR/$_WEB_ROOT/modules/contrib/varbase_media_demo"
if [ -d "$DEMO" ]; then
  (grep -rlZ "vimeo\.com/[0-9]" "$DEMO" 2>/dev/null \
    | xargs -0 -r sed -i -E \
        -e "s#(https?://)?(www\.)?vimeo\.com/[0-9]+#https://www.youtube.com/watch?v=bTqVqk7FSmY#g" \
        -e "s/value: vimeo/value: youtube/g" \
        -e "s/Remote Vimeo Video/Remote Youtube Video/g") || true
fi
# varbase_heroslider's default recipe re-imports configuration its own
# module install has already created; on Drupal 11.4 the recipe runner
# strict-compares and fails ("exists already and does not match") because
# profile-site modules add third-party settings to the node type on save.
# Drop the redundant self-import block for the test install (the module's
# config/install ships the same files). Temporary until the module recipe
# is fixed upstream.
HS_RECIPE="$CI_PROJECT_DIR/$_WEB_ROOT/modules/contrib/varbase_heroslider/recipes/default/recipe.yml"
if [ -f "$HS_RECIPE" ]; then
  sed -i '/^  import:$/,/^  actions:$/{/^  actions:$/!d}' "$HS_RECIPE"
fi
# = Stage the test-only JS library-dependency fix module =
#   varbase_test_js_fix repairs contrib libraries (scheduler /
#   simple_sitemap / …) that call drupalSetSummary() without depending on
#   core/drupal.form. Under JS aggregation that ordering gap throws
#   `drupalSetSummary is not a function`, which aborts
#   Drupal.attachBehaviors and stops CKEditor 5 from booting on node forms.
#   The module must be present in EVERY job so the restored (module-enabled)
#   DB dump has its files on disk after the fresh composer build.
mkdir -p "$CI_PROJECT_DIR/$_WEB_ROOT/modules/custom"
cp -r "$CI_PROJECT_DIR/tests/fixtures/modules/varbase_test_js_fix" "$CI_PROJECT_DIR/$_WEB_ROOT/modules/custom/"
# = Fix ckeditor_media_resize 1.0.0's dead CKEditor5 icons import =
#   THE actual root cause of "CKEditor 5 never boots on /node/add/*":
#   released 1.0.0's built bundle (js/build/mediaResize.js) reads
#   `icons.objectSizeSmall` (and medium/large/full) off the `ckeditor5/src/
#   core` DLL module. Drupal 11.4's CKEditor5 moved icons into their OWN
#   `ckeditor5/src/icons` DLL module (core's own drupalMedia.js already
#   requires it that way) — `core.icons` is undefined, so the very first
#   line of the MediaResizeButtons plugin throws "Cannot read properties of
#   undefined (reading 'objectSizeSmall')" as an uncaught page error. That
#   throw aborts Drupal.attachBehaviors() for the WHOLE page (same failure
#   class as the drupalSetSummary bug above), so CKEditor 5 never attaches
#   on ANY node/add or node/edit form — not a benign console warning, a
#   fatal one despite matching the JS-error-gate's "objectSizeSmall|
#   plugincollection-plugin-not-found" ignore pattern (that pattern assumed
#   this was cosmetic; it is not). A fixed dev fork exists upstream
#   (imports IconObjectSizeSmall &c. from ckeditor5/src/icons) but is not
#   released. Patch the built bundle on disk to require the real icons
#   module and use it instead. Idempotent and self-healing: only touches
#   the file when the known-broken pattern is present, and hard-fails if
#   the patch does not take (so a version drift is never silently ignored).
MR_JS="$CI_PROJECT_DIR/$_WEB_ROOT/modules/contrib/ckeditor_media_resize/js/build/mediaResize.js"
if [ -f "$MR_JS" ] && grep -q 'icons.objectSizeSmall' "$MR_JS"; then
  sed -i 's#"ckeditor5/src/widget.js":(e,t,i)=>{e.exports=i("dll-reference CKEditor5.dll")("./src/widget.js")},"dll-reference CKEditor5.dll"#"ckeditor5/src/widget.js":(e,t,i)=>{e.exports=i("dll-reference CKEditor5.dll")("./src/widget.js")},"ckeditor5/src/icons.js":(e,t,i)=>{e.exports=i("dll-reference CKEditor5.dll")("./src/icons.js")},"dll-reference CKEditor5.dll"#' "$MR_JS"
  sed -i 's#var e=i("ckeditor5/src/core.js"),t=i("ckeditor5/src/ui.js"),r=i("ckeditor5/src/utils.js");#var e=i("ckeditor5/src/core.js"),t=i("ckeditor5/src/ui.js"),r=i("ckeditor5/src/utils.js"),ic=i("ckeditor5/src/icons.js");#' "$MR_JS"
  sed -i 's#a={small:e.icons.objectSizeSmall,medium:e.icons.objectSizeMedium,large:e.icons.objectSizeLarge,original:e.icons.objectSizeFull}#a={small:ic.IconObjectSizeSmall,medium:ic.IconObjectSizeMedium,large:ic.IconObjectSizeLarge,original:ic.IconObjectSizeFull}#' "$MR_JS"
  if grep -q 'icons.objectSizeSmall' "$MR_JS"; then
    echo "ckeditor_media_resize icons patch did not apply (upstream file changed) - failing loudly instead of shipping a dead editor"
    exit 1
  fi
fi
# = Guard reroute_email's Symfony Mailer route link (WSOD on 03-00) =
#   reroute_email 2.3.0-rc2's SettingsForm links to the Symfony Mailer
#   "mailer policy" collection route whenever the `symfony_mailer` module is
#   enabled. The Varbase profile enables symfony_mailer 2.0.x (a rewrite that
#   dropped the `entity.mailer_policy.collection` route reroute_email still
#   assumes), so building /admin/config/development/reroute_email throws
#   RouteNotFoundException — a white screen — and 03-00's "Reroute Email"
#   assertions all fail. Also require the route to actually exist before the
#   integration block runs; when it is absent the form renders its plain
#   settings page (which is what Varbase's symfony_mailer_lite path wants).
#   Idempotent: only rewrites the exact known condition line.
RE_FORM="$CI_PROJECT_DIR/$_WEB_ROOT/modules/contrib/reroute_email/src/Form/SettingsForm.php"
if [ -f "$RE_FORM" ] && grep -q "moduleExists('symfony_mailer')) {" "$RE_FORM"; then
  sed -i "s#\$this->moduleHandler->moduleExists('symfony_mailer')) {#\$this->moduleHandler->moduleExists('symfony_mailer') \&\& \\\\Drupal::service('router.route_provider')->getRoutesByNames(['entity.mailer_policy.collection'])) {#" "$RE_FORM"
  if grep -q "moduleExists('symfony_mailer')) {" "$RE_FORM"; then
    echo "reroute_email symfony_mailer route guard did not apply (upstream file changed) - failing loudly instead of shipping a WSOD"
    exit 1
  fi
fi
