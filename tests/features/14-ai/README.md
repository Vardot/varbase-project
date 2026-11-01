# 14-ai — Ai

Automated functional acceptance test suite (CI matrix jobs named `14-ai*`).

Admin surfaces, access rules and accessibility of the Varbase AI recipes on a full Varbase
site. Varbase applies AI Base, AI Context and AI Safety; the install job also applies the AI recipes
Varbase ships but does not apply (Readable, SEO, Chatbot, Content Operations and Figma) so their
scenarios run here. AI Search Base and AI Answers are not applied: they need a vector database, and
without one every content save fails.

CI has no AI provider key, so no scenario here calls a model. Scenarios that need a real provider
(drafting text, alt text, tags or SEO fields with AI, chatbot and Ask AI answers, the image safety
check, the vector index) stay in each recipe's own suite. The AI Assistant button in the
rich editor is removed in CI (its settings form looks up a provider), so the editor toolbar
scenarios stay there too.

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
| `14-08-ai-settings-access.feature` | Varbase AI Recipe - AI Base - Who can change the AI settings | 3 |
| `14-09-ai-writing-accessibility.feature` | Varbase AI Recipe - AI Base - Accessible writing with AI | 2 |
| `14-10-ai-content-review.feature` | Varbase AI Recipe - AI Base - The AI review of a saved post | 1 |
| `14-11-ai-context-items.feature` | Varbase AI Recipe - AI Context - Starter context items for every AI agent | 2 |
| `14-12-ai-context-access.feature` | Varbase AI Recipe - AI Context - Editorial roles read the published context | 3 |
| `14-13-ai-context-accessibility.feature` | Varbase AI Recipe - AI Context - Accessible context pages | 1 |
| `14-14-ai-safety-access.feature` | Varbase AI Recipe - AI Safety - Who can change the guardrails and read the AI log | 2 |
| `14-15-ai-image-form-accessibility.feature` | Varbase AI Recipe - AI Safety and AI Image Alt - Accessible image form | 1 |
| `14-16-ai-image-alt.feature` | Varbase AI Recipe - AI Image Alt - Generate with AI on the image form | 1 |
| `14-17-ai-taxonomy-tagging.feature` | Varbase AI Recipe - AI Taxonomy Tagging - Suggest tags while writing a page | 2 |
| `14-18-ai-chatbot.feature` | Varbase AI Recipe - AI Chatbot Base - Visitors talk to the chatbot, only administrators change it | 3 |
| `14-19-ai-content-operations.feature` | Varbase AI Recipe - AI Content Operations Base - The assistant in the editor's toolbar | 3 |
| `14-20-ai-seo-bulk.feature` | Varbase AI Recipe - AI SEO - Fill meta tags in bulk | 1 |
| `14-21-ai-readable-llms-txt.feature` | Varbase AI Recipe - AI Readable Base - /llms.txt for AI tools | 2 |
| `14-22-ai-readable-markdown.feature` | Varbase AI Recipe - AI Readable Base - A Markdown version of every page | 4 |
| `14-23-ai-readable-sections.feature` | Varbase AI Recipe - AI Readable Base - SEO admins add to /llms.txt | 1 |
| `14-24-ai-readable-access.feature` | Varbase AI Recipe - AI Readable Base - Who configures /llms.txt and Markdownify | 3 |
| `14-25-ai-readable-accessibility.feature` | Varbase AI Recipe - AI Readable Base - Accessible llms.txt sections | 1 |
| `14-26-ai-figma.feature` | Varbase AI Recipe - AI Figma Base - The AI Figma stack is ready | 5 |

**Total: 50 scenarios across 27 feature files.**
