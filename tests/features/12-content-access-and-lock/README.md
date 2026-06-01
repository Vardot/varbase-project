# 12-content-access-and-lock — Content Access And Lock

Automated functional acceptance test suite (one parallel CI job: `SUITE=12-content-access-and-lock`).

Run locally:

```bash
FEATURES="tests/features/12-content-access-and-lock/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `12-01-access-unpublished.feature` | Content Management - Access Unpublished | 11 |
| `12-02-content-lock.feature` | Content Management - Content Lock | 8 |

**Total: 19 scenarios across 2 feature files.**
