# 07-content-contact — Content Contact

Automated functional acceptance test suite (one parallel CI job: `SUITE=07-content-contact`).

Run locally:

```bash
FEATURES="tests/features/07-content-contact/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `07-01-contact-us-page.feature` | Contact Us Canvas page rendering | 9 |
| `07-02-business-contact-webform.feature` | Business Contact webform interaction on /contact-us | 5 |
| `07-03-newsletter-webform.feature` | Newsletter form added to Home + Contact via Canvas, with back-end check | 3 |
