# 14-quality — Quality

Automated functional acceptance test suite (one parallel CI job: `SUITE=14-quality`).

Run locally:

```bash
FEATURES="tests/features/14-quality/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `14-01-editorial-accessibility-checker.feature` | Accessibility - Editorial Accessibility Checker permissions | 7 |
| `14-02-accessibility.feature` | Quality - Accessibility (a11y) | 4 |
| `14-03-performance.feature` | Quality - Performance budgets | 3 |

**Total: 14 scenarios across 3 feature files.**
