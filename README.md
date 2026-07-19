# Universal S3 Client

Product monorepo (loose, no workspaces). One repo = one product.

```
apps/
  app/        # Native macOS/iOS app (Expo / React Native) — the shipped product
  marketing/  # universals3client.com — Astro static site (ex-us3static)
```

Each app is self-contained (its own `package.json`, install & build). There is no
root package manager; `cd` into the app you want.

## apps/app — the client

Expo / React Native app published on the App Store. See `apps/app/README.md`.

```bash
cd apps/app
npm install --legacy-peer-deps
```

Release: tag `vX.Y.Z` (matching `apps/app/app.json` version) → `.github/workflows/release-ios.yml`
queues an EAS iOS build.

## apps/marketing — the website

Astro static site deployed to AWS S3 + CloudFront (`s3://universals3client.com`,
distribution `E2NABLFL93QGGP`).

```bash
cd apps/marketing
npm install
npm run dev      # local
npm run build    # -> dist/
./deploy.sh      # manual build + S3 sync + CloudFront invalidation
```

CI: pushes to `master` touching `apps/marketing/**` deploy automatically via
`.github/workflows/deploy-marketing.yml`.

### Programmatic SEO — `/gui/<provider>`

`apps/marketing/src/data/providers.ts` drives one "native macOS GUI for <provider>"
landing page per S3-compatible provider (`src/pages/gui/[slug].astro`) plus a hub at
`/gui`. Add a provider = add an entry to that file.
