# The default AI provider for the functional tests, sourced by the job that
# installs the site, AFTER the AI recipes are applied. The same file in Varbase
# Project Template, Varbase Starter and The Rightup: copy it unchanged.
#
# Set before sourcing it: DRUSH (drush for the site), DR (core's recipe
# runner), DRUPAL_CMS_AI (the drupal_cms_ai recipe path), AI_RECIPES (the AI
# recipe paths to apply again once amazee.ai answers) and SETTINGS_PHP.
#
# Varbase AI Base applies Drupal CMS AI, which sets up an amazee.ai trial.
# When amazee.ai cannot be reached or refuses the trial key, no default chat
# model is set, Varbase AI Base stops before Varbase AI Safety, and the AI
# admin pages wait on amazee.ai until the browser gives up. Then the AI
# module's Echo test provider takes the operations amazee.ai would have, and
# the amazee.ai key is cleared so no page asks amazee.ai for its models.
# Varbase AI Safety stays unapplied on Echo on purpose: Echo's reply is not a
# verdict, so its image check would refuse every upload.
# Exports AI_PROVIDER: amazeeio or echoai.

ai_default() {
  $DRUSH php:eval "echo \Drupal::config('ai.settings')->get('default_providers.$1.provider_id');"
}

ai_ready() {
  [ -n "$(ai_default chat)" ] && [ -n "$(ai_default embeddings)" ]
}

# The trial signup can fail for a moment on amazee.ai's side: two more tries,
# and when one works, the AI recipes again so they apply in full.
for try in 2 3; do
  if ai_ready; then break; fi
  sleep 30
  $DRUSH cache:rebuild
  $DR recipe "$DRUPAL_CMS_AI" || true
  $DRUSH cache:rebuild
  if ai_ready; then
    for r in $AI_RECIPES; do $DR recipe "$r" || true; $DRUSH cache:rebuild; done
  fi
done

if ! ai_ready; then
  echo "################################################################"
  echo "# amazee.ai unavailable: running with the Echo test provider"
  echo "################################################################"
  # Echo lives in the AI module's tests folder.
  chmod u+w "$(dirname "$SETTINGS_PHP")" "$SETTINGS_PHP"
  echo "\$settings['extension_discovery_scan_tests'] = TRUE;" >> "$SETTINGS_PHP"
  $DRUSH cache:rebuild
  $DRUSH pm:enable ai_test -y
  # The operations amazee.ai sets up. Not moderation: Echo flags everything.
  # With no key, amazee.ai is not usable, so no page asks it for models.
  $DRUSH php:eval '$c = \Drupal::configFactory()->getEditable("ai.settings"); foreach (["chat", "chat_with_tools", "chat_with_structured_response", "chat_with_complex_json", "chat_with_image_vision", "translate_text", "embeddings", "text_to_image"] as $op) { $c->set("default_providers.$op", ["provider_id" => "echoai", "model_id" => "gpt-test"]); } $c->save(); $a = \Drupal::configFactory()->getEditable("ai_provider_amazeeio.settings"); if (!$a->isNew()) { $a->set("api_key", "")->save(); }'
  $DRUSH cache:rebuild
  if [ "$(ai_default chat)" != "echoai" ]; then echo "Could not set up the Echo test provider."; return 1; fi
fi
AI_PROVIDER=$(ai_default chat)
export AI_PROVIDER
echo "Default AI provider: $AI_PROVIDER (chat), $(ai_default embeddings) (embeddings)"
