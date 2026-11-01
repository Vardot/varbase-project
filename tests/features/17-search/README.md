# 17-search — Search

Automated functional acceptance test suite (CI matrix jobs named `17-search*`).

The header search, the search results page, and the Varbase Search Base search page:
keyword search, the Content Type facet, the Date Published filter, access and accessibility.

The keyword, facet, filter and pager scenarios read the 15 nodes carrying the keyword
`Varbasesearchtest` from `tests/recipes/varbase_search_base_test_content` (9 blog posts, 6 utility
pages, 3 of them written over a year ago). The install job indexes them.

Run locally:

```bash
FEATURES="tests/features/17-search/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `17-01-header-search.feature` | Frontend Pages - Header search - Icon toggle and search box | 6 |
| `17-02-search-results.feature` | Frontend Pages - Search results - Results page and empty state | 7 |
| `17-03-search-page.feature` | Search - The search page - Keyword bar, facet and date filter | 4 |
| `17-04-search-by-keyword.feature` | Search - Searching by keyword - Results that match the keyword | 4 |
| `17-05-content-type-facet.feature` | Search - The Content Type facet - Narrow results by content type | 4 |
| `17-06-date-published-filter.feature` | Search - The Date Published filter - Leave out older content | 4 |
| `17-07-search-access.feature` | Search - Who can search - Every visitor and every role | 2 |
| `17-08-search-accessibility.feature` | Search - Accessibility - The search page in every state | 7 |

**Total: 38 scenarios across 8 feature files.**
