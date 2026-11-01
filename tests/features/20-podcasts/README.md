# 20-podcasts — Podcasts

Automated functional acceptance test suite (CI matrix jobs named `20-podcasts*`).

Scenarios for the Varbase Podcasts Base recipe on a full Varbase site: the Podcast and
Podcast episode content types, authoring with local audio, the editorial workflow, the listings,
show pages, where to listen, permissions, unpublished episodes, SEO and accessibility.

The site comes from the testing site template (`tests/recipes/varbase_testing_site`). The example
podcasts, episodes, audio and the `/podcasts` and `/podcast-episodes` Canvas pages come from
`tests/recipes/varbase_podcasts_base_test_content`; the recipe ships its listings as blocks only.
Audio fixtures are in `tests/assets`. Authoring scenarios clean up after themselves and are not
tagged `@production`.

Run locally:

```bash
FEATURES="tests/features/20-podcasts/**/*.feature" ddev yarn test:chromium
```

## Features

| Feature file | Description | Scenarios |
| --- | --- | --- |
| `20-01-podcast-content-type.feature` | Podcasts Base - Podcast and Podcast episode content types | 4 |
| `20-02-create-podcast-episode.feature` | Podcasts Base - Authoring a podcast episode | 1 |
| `20-03-edit-podcast-episode.feature` | Podcasts Base - Editing a podcast episode | 1 |
| `20-04-episode-with-local-audio-media.feature` | Podcasts Base - An episode with a local audio media item | 2 |
| `20-05-episode-with-remote-audio-media.feature` | Podcasts Base - Remote audio on an episode | 2 |
| `20-06-episode-without-audio.feature` | Podcasts Base - An episode with no audio at all | 2 |
| `20-07-editorial-workflow.feature` | Podcasts Base - Publishing an episode through the editorial workflow | 1 |
| `20-08-editing-and-removing-audio.feature` | Podcasts Base - Removing an episode's audio | 1 |
| `20-09-podcasts-listing.feature` | Podcasts Base - Podcasts listing | 3 |
| `20-10-podcasts-filter.feature` | Podcasts Base - Podcasts listing filters | 3 |
| `20-11-podcasts-pager.feature` | Podcasts Base - Podcasts listing pager | 1 |
| `20-12-anonymous-listener.feature` | Podcasts Base - An anonymous listener finds and plays an episode | 1 |
| `20-13-podcast-shows.feature` | Podcasts Base - Podcast shows and their episodes | 5 |
| `20-14-podcast-permissions.feature` | Podcasts Base - Podcast and Podcast episode permissions | 3 |
| `20-15-unpublished-episode-visibility.feature` | Podcasts Base - Unpublished episodes stay private | 1 |
| `20-16-episode-seo.feature` | Podcasts Base - Search engine basics on an episode | 2 |
| `20-17-podcasts-accessibility.feature` | Podcasts Base - Accessibility of the podcasts, a show and an episode | 4 |

**Total: 37 scenarios across 17 feature files.**
