# CabinPi

React SPA for cabin sensors, historical charts, analysis, and camera photos. Deployed on Cloudflare Pages at `cabinpi.com`, with Pages Functions using D1 and a private R2 bucket directly.

## Development

Use Node.js 22.14 or newer and the committed lockfile.

```sh
npm ci
npm run db:migrate:local
npm run dev:full
```

Open `http://127.0.0.1:5173`. Vite provides hot reload and proxies `/api` to the Pages Functions server on port 8788. `dev.ps1` launches the same workflow on Windows. `npm run preview` builds and serves the frontend and Functions together.

D1 and R2 use **local storage by default**. Local data is separate from production. No outbound cabinpix credentials or local secrets are required. Old `.env` credentials are unused; the type-generation script ignores them. API authentication is bypassed only on loopback hostnames for local development. Keep local servers bound to loopback.

An empty local database reports “No measurements found.” To seed a local reading, write it to local D1 directly:

```sh
npx wrangler d1 execute cabinpi --local --command "INSERT INTO measurements (date, watts, dispavgVbatt, inverterOn) VALUES ('2026-09-09T12:00:00', 0, 13.2, 0)"
```

To seed a local gallery fixture:

```sh
npx wrangler r2 object put cabin-photos/2026/09/09/Test_Camera-2026-09-09-12-00.png --local --file public/web-app-manifest-512x512.png --content-type image/png
```

## Validation

```sh
npm run check
npm audit
```

`check` regenerates Cloudflare types, checks frontend and backend TypeScript, lints, compiles Pages Functions, runs regression tests, and builds the SPA. Tests use isolated Miniflare D1/R2 instances and React Testing Library. They do not access production resources. The compiled routing tests catch Pages catch-all precedence problems.

## Architecture

- `functions/api/`: thin Pages handlers, shared authentication/method/error middleware, and JSON 404 fallback.
- `server/`: R2 photo operations, D1 queries, and Access JWT verification.
- `shared/sensors.ts`: numeric sensor field registry and nullable sensor type; SELECTs and daily MAXs derive from this registry.
- `shared/dates.ts`: Pacific wall-clock validation and formatting.
- `src/hooks/useApi.ts`: cancellable requests and sequential polling.
- `src/pages/`: dashboard, charts, analysis, and gallery; charts and gallery are loaded on demand.
- `src/components/EChart.tsx`: shared modular ECharts integration with resize and disposal handling.
- `migrations/`: D1 schema history.

Calendar selections represent Pacific dates regardless of the viewer's timezone. Stored sensor timestamps and photo capture timestamps are `YYYY-MM-DDTHH:mm:ss` without an offset. Do not reinterpret these as UTC. The direct D1 writer owns validation, duplicate handling, and the inverter output rule. The database cannot distinguish the repeated hour at the fall DST transition; changing that requires a coordinated writer/schema migration.

## API

All deployed API requests require a valid Cloudflare Access JWT for a user, verified against `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` from `wrangler.jsonc`. User display information comes from verified claims.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/user` | Current verified user; local development has no user profile |
| `GET /api/sensors/latest` | Most recent D1 measurement |
| `GET /api/sensors?start=&stop=&limit=` | Readings in descending date order; default limit 1,000, maximum 10,000; `truncated` indicates more data |
| `GET /api/sensors/daily?start=&stop=&limit=` | Maximum per field per Pacific calendar day; same limit/truncation contract |
| `GET /api/photos?date=&cursor=` | Up to 100 photos per R2 page, with opaque next `cursor`; omitted date selects latest day containing supported photos |
| `GET /api/photos/YYYY/MM/DD/filename.jpg` | Stream original image with private browser caching, ETag, conditional GET, and HEAD |

Read endpoints also accept HEAD. Query bounds must be ordered `YYYY-MM-DDTHH:mm:ss` Pacific timestamps. Null numeric readings remain null; zero remains a real reading.

Photos use the verified bucket layout:

```text
YYYY/MM/DD/Camera_Name-YYYY-MM-DD-HH-mm[-ss].jpg
```

JPEG, PNG, WebP, and AVIF files with matching folder/capture dates are accepted. Other objects remain inaccessible through the photo API. Capture time comes from the filename, not the upload date. Latest-date discovery walks date prefixes rather than listing the full archive. Pagination follows R2 key order; the UI sorts the loaded photos by capture time. The date returned by the first page must be sent with subsequent cursors.

R2 stores originals. The obsolete cabinpix `?size=` resizing path is removed. Images load lazily; full-size images are reused in the modal. If bandwidth becomes an issue, generate thumbnails during upload or add a Cloudflare Images binding as a separate enhancement.

## Deployment

```sh
npm run check
npm run deploy
```

Deployment requires Wrangler authentication. The Cloudflare plugin connection and Wrangler CLI credentials are separate. `wrangler.jsonc` supplies the D1 binding, new `PHOTOS` binding to `cabin-photos`, compatibility date, and non-secret Access settings. No production schema migration is required by this refactor.

After deployment, verify Access login, the latest and dated galleries, a full image, and historical charts. Retire the old outbound `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` Pages environment entries. The existing `cabinpi-api` service token also protects `api.cabinpi.com`; do not revoke it or its reusable Access policy as part of this change.

Preview deployments currently share the production D1 database and R2 bucket, matching the existing account configuration. Use separate bindings before connecting a preview to a writer. A Pages-to-Workers migration and its domain/Access cutover are described in [the architecture assessment](docs/architecture-assessment.md).
