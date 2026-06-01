# 11-content-workflow — Content Workflow

Automated functional acceptance test suite (one parallel CI job: `SUITE=11-content-workflow`).

Run locally:

```bash
FEATURES="tests/features/11-content-workflow/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `11-01-content-workflows.feature` | Content Management - Content Workflows | 4 |
| `11-02-content-scheduling.feature` | Content Management - Content Planning and Scheduling | 3 |
| `11-03-cloning-content-and-entities.feature` | Content Management - Cloning content and entities | 3 |
| `11-04-trash-management.feature` | Content Management - Trash management | 6 |

**Total: 16 scenarios across 4 feature files.**
