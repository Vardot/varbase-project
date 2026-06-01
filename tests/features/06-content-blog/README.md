# 06-content-blog — Content Blog

Automated functional acceptance test suite (one parallel CI job: `SUITE=06-content-blog`).

Run locally:

```bash
FEATURES="tests/features/06-content-blog/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `06-01-blog-permissions.feature` | Content Structure - Blog post permissions | 6 |
| `06-02-blog-page.feature` | Frontend Pages - Blog Listing Page | 4 |

**Total: 10 scenarios across 2 feature files.**
