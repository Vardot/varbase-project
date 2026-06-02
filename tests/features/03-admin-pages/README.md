# 03-admin-pages — Admin Pages

Automated functional acceptance test suite (one parallel CI job: `SUITE=03-admin-pages`).

Run locally:

```bash
FEATURES="tests/features/03-admin-pages/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `03-01-admin-pages.feature` | Pre-check important administrator and development pages | 9 |
| `03-02-media-usage.feature` | File & Media Management - Assets Management - Image media and their usage list page for site admins | 2 |
| `03-03-json-api.feature` | Check JSON API admin interface and services and Varbase API settings | 6 |
| `03-04-audit-trail.feature` | User Management - Admin audit trails access | 0 |
| `03-05-media-bulk-upload.feature` | Admin management - Media bulk upload permissions | 0 |

**Total: 17 scenarios across 5 feature files.**
