# Goal: Migrate cabinpi-react from Cloudflare Pages to Cloudflare Workers

**Status: done, including production cutover (2026-09-10).**
`wrangler.jsonc` declares `main: worker/index.ts` and an `assets` block
(`directory: ./dist`, `not_found_handling: single-page-application`,
`run_worker_first: ["/api", "/api/*"]` — both entries are required, since the
glob alone does not match the bare `/api` path and SPA fallback would
otherwise return `index.html` for it). All API handlers were consolidated
into one Hono Worker at `worker/index.ts`; `functions/` and the obsolete
Pages-only `public/_routes.json` were removed. `npm run check` passes end to
end, and `wrangler dev` was verified manually: SPA fallback (including the
bare `/api` edge case), all `/api/*` routes, D1 reads, R2 photo streaming,
and the loopback Access bypass all work locally. `README.md` and
`CLAUDE.md` were updated.

Two things a fresh clone or reviewer should know:
- `npm test` standalone now requires `dist/` to exist first (`npm run
  build`), since bundling the Worker for tests reads the configured assets
  directory. `npm run check` builds before testing, so this only bites a
  bare `npm test`.
- `wrangler dev`'s default port (8787) differs from `wrangler pages dev`'s
  (8788). `preview` had relied on that old default with no explicit
  `--port`; it now passes `--port 8788` explicitly so it keeps matching
  `dev:functions`/`dev:full`.

**Naming collision found during deployment.** The Worker was originally
still named `cabinpi-react` (carried over from the Pages project name). The
Cloudflare account already had a *separate, unrelated* Worker called
`cabinpi-react` (bound to `dash.cabinpi.com`, an old/abandoned experiment
per the account owner) and another called `cabinpi-test` (bound to
`test.cabinpi.com`). Deploying under the original name would have silently
overwritten that unrelated Worker. The Worker was renamed to
**`cabinpi-dashboard`** before deploying, to avoid any collision with
existing or future Workers on this account.

**Production cutover, performed via the Cloudflare API (account
`ea01a83a2b63ba33def43b6205344d82`):**
1. Confirmed the existing Access application "cabinpi-react - Cloudflare
   Pages" (aud `e22e46957017da28ea77fb8f6f70af8665e36d1340841c9ce925103e36c4b46c`,
   matching `wrangler.jsonc`'s `ACCESS_AUD`) already lists **both**
   `*.cabinpi-react.pages.dev` and `cabinpi.com` as destinations — Access
   enforcement is hostname-based at the edge, so no `ACCESS_AUD` change was
   needed for the domain move.
2. `wrangler deploy` published `cabinpi-dashboard` to
   `https://cabinpi-dashboard.cabinpi.workers.dev` — verified there first
   (SPA routes, bare `/api` and `/api/*` routing, fail-closed 401 without
   an Access session) before touching the live domain.
3. Removed `cabinpi.com` from the Pages project's custom domains. This
   step alone left the domain **briefly broken** — Pages stopped
   recognizing the hostname, but the old CNAME DNS record survived it and
   pointed nowhere useful (attaching a Worker Custom Domain to a hostname
   with an existing conflicting DNS record is rejected with error 100117).
4. Deleted the stale CNAME record, then attached `cabinpi.com` to
   `cabinpi-dashboard` via the Workers Custom Domains API. Verified
   immediately: `cabinpi.com` now 302-redirects to
   `fphi.cloudflareaccess.com/cdn-cgi/access/login/cabinpi.com?kid=e22e4695...`
   — the correct Access application, gating the correct Worker. Confirmed
   `dash.cabinpi.com`, `test.cabinpi.com`, and `api.cabinpi.com` were
   unaffected.
5. The Pages project (`cabinpi-react`) was **not deleted** — it still
   serves `cabinpi-react.pages.dev` and remains a rollback path (re-add
   `cabinpi.com` as a Pages custom domain, then detach the Worker domain)
   if a problem surfaces after this handoff.

**Sequencing note for anyone repeating this on another project:** removing
a domain from Pages and attaching it to a Worker is not atomic and the two
calls cannot safely be merged into one step if the target hostname has an
existing DNS record — plan for an explicit "detach → delete stale DNS
record → attach" order, in that sequence, and verify after the final step.

## Why

Pages is a legacy/deprioritized deployment model on Cloudflare. Moving to
Workers simplifies the build/deploy story to a single `wrangler.jsonc` +
`wrangler deploy` flow instead of Pages-specific tooling (`wrangler pages
dev/deploy/functions build`).

## Scope

- Replace `pages_build_output_dir` config with Workers Static Assets serving
  the Vite-built frontend, with SPA fallback for React Router routes.
- Consolidate the current file-based `functions/api/*` handlers (including the
  `functions/api/photos/[[key]].ts` catch-all) into a single Worker entry
  point using a router (e.g. Hono), with explicit route definitions replacing
  directory-based routing.
- Retarget `d1_databases` (`cabinpi_db`) and `r2_buckets` (`PHOTOS`) bindings,
  Access JWT verification middleware, and all `vars` to the Worker — behavior
  equivalent to today, not byte-for-byte routing parity.
- Update `package.json` scripts (`dev`, `dev:full`, `dev:functions`,
  `preview`, `build`, `deploy`, `check`, `db:migrate:local`) to Workers-native
  equivalents.
- Update `README.md` and `CLAUDE.md` to describe the Workers architecture and
  commands.
- Remove all leftover Pages-only config/scripts once migration is verified
  (no dead `wrangler pages` invocations or `pages_build_output_dir`).

## Non-goals / open questions

Exact request-routing structure isn't fixed — restructuring `functions/api/*`
into router-based handlers is expected and fine. No hard constraints beyond
normal CLAUDE.md conventions (local storage default, no casual prod D1
writes/live deploy during verification).

## Delivery

Single PR, full cutover — not staged behind a flag or partial rollout.

## Acceptance criteria

1. `npm run check` passes (typegen, typecheck, lint, compiled Worker tests,
   build) under the new Workers setup. ✅
2. Manually verified in local dev (`dev:full`/`preview`): SPA routing, all
   API routes, D1 reads, R2 photo streaming, and Access JWT auth all work. ✅
3. `README.md` and `CLAUDE.md` reflect the Workers architecture and updated
   commands. ✅
4. No remaining Pages-specific scripts, config, or references. ✅
5. `cabinpi.com` serves the Worker in production, gated by the pre-existing
   Access application, with `dash.cabinpi.com`/`test.cabinpi.com`/
   `api.cabinpi.com` and the Pages project itself left intact. ✅ verified
   2026-09-10.
