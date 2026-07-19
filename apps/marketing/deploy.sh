#!/usr/bin/env bash
# Manual deploy of the marketing site to AWS S3 + CloudFront.
# Mirrors .github/workflows/deploy-marketing.yml for local/one-off deploys.
# Requires: awscli configured with credentials that can write the bucket and
# create CloudFront invalidations (us3static uses a dedicated IAM user).
set -euo pipefail

BUCKET="s3://universals3client.com"
DISTRIBUTION_ID="E2NABLFL93QGGP"

# Run from this script's directory (apps/marketing) regardless of caller CWD.
cd "$(dirname "$0")"

echo "==> Installing dependencies"
npm install

echo "==> Building static site"
npm run build

echo "==> Syncing dist/ to $BUCKET"
aws s3 sync dist/ "$BUCKET" --delete

echo "==> Invalidating CloudFront ($DISTRIBUTION_ID)"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"

echo "==> Done. https://universals3client.com"
