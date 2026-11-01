'use strict';

// Steps for the ECA Workflow Modeler (React Flow). Selectors live in
// tests/selectors/content.json.

const { Then } = require('@cucumber/cucumber');
const { friendly } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');

/**
 * Wait for the Workflow Modeler to draw a model with at least N steps.
 *
 * Example #1: Then the Workflow Modeler should draw at least 5 steps
 * Example #2: And the Workflow Modeler should draw at least 2 steps
 * Example #3: Then the Workflow Modeler should draw at least 1 step
 * Example #4: And the Workflow Modeler should draw at least 3 steps
 * Example #5: Then the Workflow Modeler should draw at least 4 steps
 */
Then(/^the Workflow Modeler should draw at least (\d+) steps?$/, async function (least) {
  const step = (this.__selectorsCss || {})['workflow modeler step'];
  const budget = (this.minWaitTime && this.minWaitTime.page) || 8000;
  const steps = this.page.locator(step);
  try {
    await steps.nth(Number(least) - 1).waitFor({ state: 'visible', timeout: budget * 2 });
  } catch (e) {
    throw friendly({
      action: `see at least ${least} steps in the Workflow Modeler`,
      cause: e,
      hint: `it drew ${await steps.count()}. Check the model loads without JavaScript errors.`,
    });
  }
});
