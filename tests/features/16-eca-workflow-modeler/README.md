# 16-eca-workflow-modeler — ECA Workflow Modeler

Automated functional acceptance test suite (one parallel CI job: `SUITE=16-eca-workflow-modeler`).

Coexistence-safe checks for the ECA Workflow Modeler on Varbase 11: the Workflow Modeler
(React Flow) is offered as an editor, a shipped model opens and renders in it, and the Workflow
Modeler's Review flow control is available on a model. These scenarios do NOT assert that
BPMN.iO is absent — on stock Varbase both editors are installed (BPMN.iO via the Drupal CMS
recipes, Workflow Modeler via the Varbase recipe). They use only shipped artifacts (the editor
picker and the shipped `redirect_403_to_login` model); no seeded or demo fixtures.

All scenarios use Varbase E2E built-in steps plus the existing Varbase login/wait steps
(`tests/step-definitions/varbase.steps.js`); this suite adds no custom step definitions.

Run locally:

```bash
FEATURES="tests/features/16-eca-workflow-modeler/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `16-01-workflow-modeler-is-the-editor.feature` | Workflow Automation - ECA Workflow Modeler is offered | 2 |
| `16-02-legacy-model-opens-in-modeler.feature` | Workflow Automation - Existing models open in the Workflow Modeler | 1 |
| `16-03-review-flow-capability.feature` | Workflow Automation - Workflow Modeler review capability | 1 |

**Total: 4 scenarios across 3 feature files.**
