/**
 * @file
 * Defines a safe fallback for jQuery.fn.drupalSetSummary / drupalGetSummary.
 *
 * On Drupal 11.4 these plugins live in core/misc/form.js (library
 * core/drupal.form). Under JS aggregation on the heavy Varbase admin the
 * aggregate that contains form.js can be evaluated AFTER a vertical-tab
 * "summary" behaviour (node/menu/path/scheduler/simple_sitemap/…) has already
 * run, so `$(...).drupalSetSummary(...)` throws `is not a function`. That throw
 * aborts Drupal.attachBehaviors() for the whole page, so CKEditor 5 never
 * attaches on node forms.
 *
 * This file is appended to the core/jquery library (see
 * varbase_test_js_fix_library_info_alter), so it runs immediately after jQuery
 * core and long before any behaviour. It installs a no-op fallback ONLY when
 * the real plugin is not yet present; once core/drupal.form loads it replaces
 * the fallback with the real implementation. The fallback simply prevents the
 * crash so attachBehaviors completes — it never masks a genuinely dead editor,
 * which still fails its own step.
 */
(function () {
  'use strict';
  var $ = window.jQuery;
  if (!$ || !$.fn) {
    return;
  }
  if (typeof $.fn.drupalSetSummary !== 'function') {
    $.fn.drupalSetSummary = function () {
      return this;
    };
  }
  if (typeof $.fn.drupalGetSummary !== 'function') {
    $.fn.drupalGetSummary = function () {
      return '';
    };
  }
})();
