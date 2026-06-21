# 09-drupal-canvas — Drupal Canvas

Automated functional acceptance test suite (one parallel CI job: `SUITE=09-drupal-canvas`).

Run locally:

```bash
FEATURES="tests/features/09-drupal-canvas/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `09-01-canvas-pages-permissions.feature` | Content Structure - Canvas Pages permissions | 6 |
| `09-02-canvas-editor.feature` | Content Structure - Drupal Canvas Editor | 5 |
| `09-03-canvas-menus.feature` | Content Structure - Menus in Drupal Canvas (system menus offered in the component library) | 1 |
| `09-04-canvas-hero-cards.feature` | Content Structure - Hero Cards in Drupal Canvas (added via the real editor drag-and-drop, options matrix: heading, background, alignment, button, border, container) | 2 |

**Total: 14 scenarios across 4 feature files.**
