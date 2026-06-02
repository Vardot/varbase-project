# 02-user-management — User Management

Automated functional acceptance test suite (one parallel CI job: `SUITE=02-user-management`).

Run locally:

```bash
FEATURES="tests/features/02-user-management/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `02-01-user-login.feature` | User Management - Standard User Management - Login | 2 |
| `02-02-request-new-password.feature` | User Management - Standard User Management - Request new password | 2 |
| `02-03-persistent-login.feature` | User Management - User login session | 4 |
| `02-04-login-redirect.feature` | User Management - Login Redirect - Admin roles redirect to dashboard, authenticated users to profile | 6 |
| `02-05-role-assign.feature` | User Management - Standard User Management - Users with permission to assign roles may select which roles are available for assignment | 1 |
| `02-06-create-users.feature` | User Management - Standard User Management - Admins can create users and assign a role to them | 2 |
| `02-07-user-protect.feature` | User Management - User account protection | 1 |

**Total: 18 scenarios across 7 feature files.**
