# Architecture assessment — September 9, 2026

**Update 2026-09-10:** the Pages-to-Workers migration described below as
future work has been completed — see README.md and
[the migration goal](workers-migration-goal.md). This document otherwise
remains an unedited point-in-time snapshot of the Pages architecture it
reviewed.

## Verified infrastructure

The Cloudflare plugin was used for read-only account inspection:

- Pages project `cabinpi-react`, production branch `main`, with `cabinpi.com` and `cabinpi-react.pages.dev` domains.
- D1 database `cabinpi`, ID `c5b5bdc0-6237-4d78-a7b9-03509e614563`, bound as `cabinpi_db` in production and preview. Sample stored dates have the expected untagged `YYYY-MM-DDTHH:mm:ss` format.
- R2 bucket `cabin-photos`, created September 9 UTC. Its r2.dev endpoint is disabled and no custom public bucket domains are configured.
- Sample object keys include `2026/09/08/Fire_Pit-2026-09-08-19-41.jpg`, `Marks_Cabin-...jpg`, and `Parking-...jpg`. Objects carry JPEG content types; sampled custom metadata is empty.
- The inspected Pages configuration predated this change: it had no R2 binding and retained outbound `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` entries from the former ingest integration. The repository does not use those credentials.
- Access protects `cabinpi.com` and the Pages preview wildcard. The account's team domain is `fphi.cloudflareaccess.com`; the existing Pages application audience is recorded in Wrangler config. The API verifies signed user JWTs instead of trusting identity headers. The `cabinpi-api` service token and its reusable policy also protect `api.cabinpi.com` and remain active, so they are outside this removal.

No remote resources, policies, secrets, domains, records, or deployments were modified. A Wrangler attempt to download an existing image was blocked by missing CLI authentication; tests use local fixtures instead. Plugin authentication does not automatically authenticate Wrangler.

## Decisions and resulting changes

| Finding | Change |
| --- | --- |
| Photos depended on a remote Raspberry Pi API and outbound credentials | Stream directly from the private R2 binding through the authenticated same-origin API |
| Large archives require pagination; upload time differs from capture time | Walk year/month/day prefixes to find the latest photo day; return bounded cursor pages; parse capture time and camera from the verified filename convention |
| Public image caching was inappropriate for authenticated photos | Private browser caching with ETags, conditional GET, HEAD, and explicit raster content types |
| Backend handlers used `any`, stale Env declarations, and escaped the build's type checks | Generate binding types from Wrangler; type-check handlers and server code separately; share middleware and API models |
| The Pages app owned a redundant sensor write path | Remove it; the source script writes to D1 directly and owns write validation, batching, and inverter handling |
| Sensor columns were duplicated across read handlers | Derive SELECT and daily aggregation columns from one numeric field registry and retain the existing date index |
| The app trusted identity headers | Validate JWT signature, audience, issuer, and expiry; derive displayed identity from claims |
| Request responses could race when changing date/range | Cancel obsolete requests and pending photo pages; schedule dashboard polling sequentially |
| Zero sensor readings disappeared; SQL nulls could crash cards | Preserve zeros with nullish handling and explicitly model nullable readings |
| Calendar selections could shift outside Pacific time; Analysis labels were overwritten by object spreading | Share date-string helpers, preserve Pacific calendar boundaries, and format labels without browser timezone reinterpretation |
| Charts were in the initial application bundle; multiple chart lifecycles existed | Lazy-load feature routes and share a modular ECharts component with resize/disposal cleanup |
| Analysis selections were not actually shareable despite old documentation | Persist field selections, axis assignments, and table visibility in URL parameters |
| Template dependencies and stale development code remained | Remove the chart wrapper, unused date library/types, proxy credential template, and duplicated date logic; simplify the development launcher |

## Cloudflare alignment

Cloudflare recommends Workers for **new projects** and supports R2/D1 bindings in existing Pages Functions. Retaining this existing Pages project gives the R2 refactor a direct deployment path without changing its domain or Access application. Its SPA/static assets plus small, read-only API handlers remain appropriate for the workload. No ORM, queue, or separate service is required for these request/response operations.

- [Pages guidance](https://developers.cloudflare.com/pages/)
- [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

The implementation uses bindings rather than Cloudflare REST calls at runtime, streams image bodies, validates external inputs, and emits structured server errors without returning internal exception details. It requires no Node-specific runtime APIs, so `nodejs_compat` is unnecessary. The old Workers-only observability block was removed from the Pages config; structured logs can be inspected with Pages Functions logging.

A future move to Workers static assets can adopt the Cloudflare Vite plugin and a single local development server. That should be a coordinated deployment change: create the Worker bindings, verify Access audiences, attach the existing domain, and retain a rollback route to Pages. The repository is not claiming that migration has happened. [Migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)

## Dependencies and validation

React, React Router, ECharts, Wrangler, ESLint, and compatible tooling were updated; Mantine 8 and Vite 7 remain on their latest compatible maintenance releases. TypeScript moved to 5.9. Major framework migrations were not necessary for the requested behavior. ECharts is now consumed directly through its modular API. Day.js, a Mantine Dates peer, is explicit.

Wrangler currently brings Miniflare 5 prerelease tooling. The test dependency is pinned to the version used by Wrangler and uses its provided v4-option conversion helper. A scoped override selects patched `sharp` 0.35.4+ because the runtime's pinned 0.35.2 had an advisory. Remove the override after upstream adopts the patched version. The updated dependency tree passed `npm audit` with zero reported vulnerabilities during this review.

Regression tests cover date boundaries, R2 listing pagination/latest discovery, object access and cache validation, direct D1 reads, zero readings, daily MAX semantics, JWT verification, compiled Pages routing/method enforcement, and gallery pagination/modal/navigation/error handling. The in-app browser could not start because its tool environment was missing sandbox metadata; visual browser QA and production OAuth verification remain unperformed. React DOM tests and real local HTTP/runtime checks were completed instead.

## Deployment considerations and remaining limitations

1. Deploy the reviewed repository to apply `PHOTOS`, Access settings, and the updated compatibility date. No database migration or photo movement is required. Verify actual images, D1 reads, and chart history after deployment.
2. Retire the obsolete outbound credential environment entries after deployment. They are account settings outside this repository and were not changed during the review. Keep the `cabinpi-api` service token and reusable policy: Cloudflare inspection confirms they also protect `api.cabinpi.com` and the token is active.
3. Production and preview currently share D1/R2. Use separate preview bindings before connecting a preview to a writer. Local development and tests use isolated local resources by default.
4. Photos currently serve originals, since R2 itself does not resize images. Lazy loading and private browser caching reduce repeat transfers. Upload-time thumbnails or Cloudflare Images are future options if gallery bandwidth warrants them.
5. R2 lists lexicographically, so capture-time sorting applies to loaded pages. Daily aggregation is explicitly a per-field maximum. Queries report truncation instead of silently suggesting the returned readings cover the whole range.
6. The existing naive Pacific timestamp format cannot disambiguate the repeated hour at DST fall-back. Fixing that requires a producer/storage migration. This refactor preserves the existing data contract.
7. The modular ECharts chunk is about 584 kB before compression and 198 kB gzipped. It is loaded only on chart/analysis routes; Vite still reports its standard 500 kB chunk advisory.
