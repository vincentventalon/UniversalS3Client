# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Universal S3 Client — a loose monorepo (no workspaces). Each app is self-contained: `cd` into it and run its own `npm install`.

- `apps/app/` — Expo / React Native iOS client shipped on the App Store (**real users — don't break it**). Bundle ID `com.vincentventalon.universals3client`.
- `apps/marketing/` — Astro static marketing site at universals3client.com (ex-`us3static`).
- `packages/`, `macos/` — empty placeholders, not populated.

## apps/app (Expo)

- Install with `npm install --legacy-peer-deps` — plain `npm install` fails on peer conflicts.
- Dev: `npm start` / `npm run ios`. For anything not covered by tests, verify by booting `npm start` as a smoke test.
- Test: `npm test` (jest-expo). Tests live in `src/**/__tests__`; unit-test pure logic (e.g. `utils/`) — component tests need native-module mocks.
- Lint/format: `npm run lint` (`expo lint`, flat config), `npm run format` (Prettier). The shipped source has pre-existing lint warnings — don't mass-fix them in unrelated changes.
- CI (`.github/workflows/lint.yml`) runs lint + tests for the app and `npm run check` for marketing on every push/PR.
- **AWS SDK v3 is pinned to 3.188.0 for Hetzner compatibility** (newer versions enforce payload checksums that break Hetzner uploads). Do not upgrade `@aws-sdk/*` without testing against Hetzner.
- Versioning is CalVer `YY.M.MICRO` in `app.json` (`expo.version`). A release tag `vX.Y.Z` **must** match `expo.version` or CI fails — use `/release-ios`.
- TypeScript is `strict`. Styling is Emotion (CSS-in-JS) + react-native-paper. Secrets go through `expo-secure-store` (Keychain).

## apps/marketing (Astro)

- Dev: `npm run dev` (port 3000). Build: `npm run build` → `dist/`.
- Lint/format before committing: `npm run check` (astro + eslint + prettier); `npm run fix` auto-fixes. Prettier: single quotes, semicolons, 2-space, 120-col.
- **Programmatic SEO**: each entry in `src/data/providers.ts` generates one `/gui/<provider>` landing page. Add a provider = edit that one file.
- Deploy is to Cloudflare Workers static assets (`wrangler-static.toml`, served from `dist/`): manual via `./deploy.sh` (or `npm run deploy`), or auto on push to master touching `apps/marketing/**` (`.github/workflows/deploy-marketing.yml`, needs the `CLOUDFLARE_API_TOKEN` repo secret). The zone `universals3client.com` must live on Cloudflare for the routes to bind.

## Conventions

- Commit messages use conventional prefixes seen in the log: `feat:` `fix:` `ci:` `refactor:`.
- The parent portfolio CLAUDE.md (`~/Code/cockpit/CLAUDE.md`) holds cross-project context only; product-specific detail lives here.
