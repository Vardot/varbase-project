# 15-quality — Quality

Automated functional acceptance test suite (one parallel CI job: `SUITE=15-quality`).

Run locally:

```bash
FEATURES="tests/features/15-quality/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `15-01-editorial-accessibility-checker.feature` | Accessibility - Editorial Accessibility Checker permissions | 7 |
| `15-02-accessibility.feature` | Quality - Accessibility (a11y) | 10 |
| `15-03-performance.feature` | Quality - Performance budgets | 6 |

**Total: 23 scenarios across 3 feature files.**
