# 18-events — Events

Automated functional acceptance test suite (CI matrix jobs named `18-events*`).

Scenarios for the Varbase Events Base recipe on a full Varbase site: the Event
content type, authoring, the `/events` listing with its filters and pager, related events and who
can author events.

The site comes from the testing site template (`tests/recipes/varbase_testing_site`), which
installs Events during the site install. The listing, filter, pager and related events scenarios
read the 15 example events from `tests/recipes/varbase_events_base_test_content`. Authoring
scenarios delete what they create and are not tagged `@production`.

Run locally:

```bash
FEATURES="tests/features/18-events/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `18-01-event-content-type.feature` | Events - Event content type - The fields of an event | 1 |
| `18-02-create-event.feature` | Events - Authoring - Create an event | 1 |
| `18-03-edit-event.feature` | Events - Authoring - Edit an event | 1 |
| `18-04-event-featured-image.feature` | Events - Authoring - A featured image for an event | 1 |
| `18-05-events-listing.feature` | Events - Events listing - Cards, summary, filters and pager | 5 |
| `18-06-related-events.feature` | Events - Related events - Other events on an event page | 1 |
| `18-07-event-permissions.feature` | Events - Permissions - Who can author events | 4 |

**Total: 14 scenarios across 7 feature files.**
