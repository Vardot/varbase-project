# 19-news — News

Automated functional acceptance test suite (CI matrix jobs named `19-news*`).

Scenarios for the Varbase News Base recipe on a full Varbase site: the News post
content type, authoring, the `/news` listing with its filters and pager, and who can author news.

The site comes from the testing site template (`tests/recipes/varbase_testing_site`). The listing,
filter and pager scenarios read the 15 example news posts from
`tests/recipes/varbase_news_base_test_content`. Authoring scenarios delete what they create and are
not tagged `@production`.

Run locally:

```bash
FEATURES="tests/features/19-news/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `19-01-news-content-type.feature` | News - News post content type - The fields of a news post | 1 |
| `19-02-create-news.feature` | News - Authoring - Create a news post | 1 |
| `19-03-edit-news.feature` | News - Authoring - Edit a news post | 1 |
| `19-04-news-featured-image.feature` | News - Authoring - A featured image for a news post | 1 |
| `19-05-news-listing.feature` | News - News listing - Cards, summary, filters and pager | 5 |
| `19-06-news-permissions.feature` | News - Permissions - Who can author news posts | 4 |

**Total: 13 scenarios across 6 feature files.**
