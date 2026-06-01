# 10-content-permissions — Content Permissions

Automated functional acceptance test suite (one parallel CI job: `SUITE=10-content-permissions`).

Run locally:

```bash
FEATURES="tests/features/10-content-permissions/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `10-01-entityqueue-permissions.feature` | Content Management - Entityqueue permissions | 4 |
| `10-02-media-library-permissions.feature` | Content Management - Media Library permissions | 5 |
| `10-03-easy-linking-internal-content.feature` | Content Management - Easy Linking internal content with Linkit | 3 |

**Total: 12 scenarios across 3 feature files.**
