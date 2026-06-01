# 13-recipes-and-ai — Recipes And Ai

Automated functional acceptance test suite (one parallel CI job: `SUITE=13-recipes-and-ai`).

Run locally:

```bash
FEATURES="tests/features/13-recipes-and-ai/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `13-01-varbase-recipes.feature` | Varbase Recipes - base recipes are applied and their admin pages work | 6 |
| `13-02-varbase-ai-recipes.feature` | Varbase AI Recipes - AI recipes are applied and their admin pages work | 8 |
| `13-03-varbase-ai-editor-recipes.feature` | Varbase AI Recipes - editor, image-alt, taxonomy, context and safety | 6 |

**Total: 20 scenarios across 3 feature files.**
