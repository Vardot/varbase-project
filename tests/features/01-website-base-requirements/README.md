# 01-website-base-requirements — Website Base Requirements

Automated functional acceptance test suite (one parallel CI job: `SUITE=01-website-base-requirements`).

Run locally:

```bash
FEATURES="tests/features/01-website-base-requirements/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `01-01-varbase-welcome-tour.feature` | The admin dashboard should be displayed after login | 1 |
| `01-02-user-registration-only-admins-login.feature` | Website Base Requirements - User Registration - Only admins login | 3 |
| `01-03-user-roles.feature` | Website Base Requirements - User Roles - Simple Roles | 1 |
| `01-04-input-formats.feature` | Content Editing - Rich Text Editor - Input formats | 2 |
| `01-05-website-languages.feature` | Website Base Requirements - Website Languages - Internationalization | 3 |

**Total: 10 scenarios across 5 feature files.**
