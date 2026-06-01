# 04-admin-users — Admin Users

Automated functional acceptance test suite (one parallel CI job: `SUITE=04-admin-users`).

Run locally:

```bash
FEATURES="tests/features/04-admin-users/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `04-01-allows-site-administrators-to-masquerade-by-switching-users.feature` | Support Requirements - Standard Support Navigation - Allow site super administrators to switch users and surf the site as that user | 6 |
| `04-02-admins-can-disable-users.feature` | User Management - Standard User Management - Admins can disable users | 3 |
| `04-03-navigate-through-drupal-admin-keyboard.feature` | Admin management - Standard Back-End Navigation - Navigate through the Drupal admin with the keyboard for faster access | 5 |

**Total: 14 scenarios across 3 feature files.**
