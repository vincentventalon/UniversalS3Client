#!/usr/bin/env bash
# Manual deploy of the marketing site to Cloudflare Workers (static assets).
# Mirrors .github/workflows/deploy-marketing.yml for local/one-off deploys.
# Requires: CLOUDFLARE_API_TOKEN in the environment (token with Workers Scripts
# edit + the universals3client.com zone), or a prior `wrangler login`.
set -euo pipefail

# Run from this script's directory (apps/marketing) regardless of caller CWD.
cd "$(dirname "$0")"

echo "==> Installing dependencies"
npm install

echo "==> Building static site"
npm run build

echo "==> Deploying to Cloudflare Workers"
npx wrangler deploy --config wrangler-static.toml

echo "==> Done. https://universals3client.com"
