# 16-eca-workflow-modeler — ECA Workflow Modeler

Automated functional acceptance test suite (CI matrix jobs named `16-eca-workflow-modeler*`).

Coexistence-safe checks for the ECA Workflow Modeler on Varbase 11: the Workflow Modeler
(React Flow) is offered as an editor, the two models Varbase Content Base ships open and draw in it,
and its Review flow control is available. These scenarios do NOT assert that BPMN.iO is absent: on
stock Varbase both editors are installed (BPMN.iO via the Drupal CMS recipes, Workflow Modeler via the
Varbase recipe). They use only shipped models; no seeded fixtures.

Run locally:

```bash
FEATURES="tests/features/16-eca-workflow-modeler/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `16-01-workflow-modeler-is-the-editor.feature` | Workflow Automation - ECA Workflow Modeler is offered | 2 |
| `16-02-legacy-model-opens-in-modeler.feature` | Workflow Automation - Existing models open in the Workflow Modeler | 2 |
| `16-03-review-flow-capability.feature` | Workflow Automation - Workflow Modeler review capability | 1 |

**Total: 5 scenarios across 3 feature files.**
