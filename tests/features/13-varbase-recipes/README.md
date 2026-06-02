# 13-varbase-recipes — Varbase Recipes

Automated functional acceptance test suite (one parallel CI job: `SUITE=13-varbase-recipes`).

Run locally:

```bash
FEATURES="tests/features/13-varbase-recipes/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `13-00-varbase-recipes.feature` | Varbase Recipes module - the recipe engine is installed | 1 |
| `13-01-varbase-admin-base.feature` | Varbase Recipe - Admin Base (Gin admin theme) | 1 |
| `13-02-varbase-users-base.feature` | Varbase Recipe - Users Base (editorial roles) | 1 |
| `13-03-varbase-content-base.feature` | Varbase Recipe - Content Base (content types + taxonomy) | 1 |
| `13-04-varbase-page-base.feature` | Varbase Recipe - Page Base (Utility page type) | 1 |
| `13-05-varbase-blog-base.feature` | Varbase Recipe - Blog Base (Blog post type) | 1 |
| `13-06-varbase-media-base.feature` | Varbase Recipe - Media Base (media types + library) | 1 |
| `13-07-varbase-editor-base.feature` | Varbase Recipe - Editor Base (CKEditor 5) | 1 |
| `13-08-varbase-security-base.feature` | Varbase Recipe - Security Base (password policy + CAPTCHA) | 1 |
| `13-09-varbase-seo-base.feature` | Varbase Recipe - SEO Base (metatag + pathauto) | 1 |
| `13-10-varbase-workflow-base.feature` | Varbase Recipe - Workflow Base (moderation + scheduler) | 1 |
| `13-11-varbase-performance-base.feature` | Varbase Recipe - Performance Base | 1 |
| `13-12-varbase-webform-base.feature` | Varbase Recipe - Webform Base (contact form) | 2 |
| `13-13-varbase-api-base.feature` | Varbase Recipe - API Base (JSON:API + OpenAPI) | 1 |
| `13-14-varbase-auth-base.feature` | Varbase Recipe - Auth Base (social authentication) | 1 |
| `13-15-varbase-i18n-base.feature` | Varbase Recipe - i18n Base (languages + translation) | 1 |
| `13-16-varbase-dev-base.feature` | Varbase Recipe - Dev Base (config sync tooling) | 1 |

**Total: 18 scenarios across 17 feature files.**
