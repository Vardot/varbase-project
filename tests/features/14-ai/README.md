# 14-ai — Ai

Automated functional acceptance test suite (one parallel CI job: `SUITE=14-ai`).

Run locally:

```bash
FEATURES="tests/features/14-ai/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `14-00-ai-recipes.feature` | Varbase AI Recipes module - AI core is installed | 1 |
| `14-01-ai-base.feature` | Varbase AI Recipe - AI Base (providers + prompts) | 1 |
| `14-02-ai-editor-assistant.feature` | Varbase AI Recipe - AI Editor Assistant (CKEditor 5) | 2 |
| `14-03-ai-image-alt.feature` | Varbase AI Recipe - AI Image Alt (automatic alt text) | 1 |
| `14-04-ai-taxonomy-tagging.feature` | Varbase AI Recipe - AI Taxonomy Tagging (AI automators) | 1 |
| `14-05-ai-context.feature` | Varbase AI Recipe - AI Context (Context Control Center) | 1 |
| `14-06-ai-safety.feature` | Varbase AI Recipe - AI Safety (logging + observability) | 1 |
| `14-07-ai-guardrails.feature` | Varbase AI Recipe - AI Safety guardrails (PII + prompt safety) | 1 |

**Total: 9 scenarios across 8 feature files.**
