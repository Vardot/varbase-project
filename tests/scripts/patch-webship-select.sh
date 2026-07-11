#!/usr/bin/env bash
################################################################################
# Make webship-js's getLocatorText() <select>-aware for the CI run.
#
# Called by the .fragments node_playwright before_script (after `yarn install`,
# so node_modules/webship-js is present). Idempotent; a genuine mismatch still
# fails. See the inline comment for the rationale.
#
# Inherits CI_PROJECT_DIR from the CI environment.
################################################################################
set -e

# webship-js's getLocatorText() (used by the "I should see X in the Y
# element" assertions) reads a form control via locator.inputValue(). For a
# <select> that returns the selected option's VALUE, not its label — so
# `I should see "1 hour" in the "#edit-ip-window" element` fails on the
# flood-control form (option value 3600, label "1 hour"), while counter
# fields pass only because their value equals their label. Patch the helper
# so a <select> returns "<selected option text> <value>" (both the human
# label and the raw value), making label- and value-based assertions pass.
# Idempotent; a genuine mismatch still fails.
WS="$CI_PROJECT_DIR/node_modules/webship-js/tests/step-definitions/webship.js"
if [ -f "$WS" ] && grep -q 'return await locator.inputValue();' "$WS"; then
  node -e '
    const fs = require("fs");
    const f = process.argv[1];
    let s = fs.readFileSync(f, "utf8");
    const patched = [
      "const _tag = await locator.evaluate((el) => el.tagName).catch(() => null);",
      "    if (_tag === \"SELECT\") {",
      "      return await locator.evaluate((el) => {",
      "        const o = el.options[el.selectedIndex];",
      "        return ((o ? o.textContent : \"\") + \" \" + el.value).trim();",
      "      });",
      "    }",
      "    return await locator.inputValue();",
    ].join("\n");
    s = s.replace("return await locator.inputValue();", patched);
    fs.writeFileSync(f, s);
    console.log("[patch] getLocatorText is now <select>-aware");
  ' "$WS"
fi
