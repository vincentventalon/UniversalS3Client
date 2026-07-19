---
name: deploy-marketing
description: Deploy the Astro marketing site (apps/marketing) to AWS S3 + CloudFront. Builds the static site, syncs to the bucket, and invalidates the CDN. User-triggered only.
disable-model-invocation: true
---

Deploy `apps/marketing` to production (universals3client.com). Steps:

1. Pre-flight: confirm `aws sts get-caller-identity` succeeds — the deploy needs credentials that can write `s3://universals3client.com` and create CloudFront invalidations (a dedicated IAM user). If it fails, stop and tell the user to configure `awscli`.
2. Run the deploy script, which builds and ships in one shot:
   ```
   cd apps/marketing && ./deploy.sh
   ```
   It runs `npm install`, `npm run build`, `aws s3 sync dist/ s3://universals3client.com --delete`, then invalidates CloudFront distribution `E2NABLFL93QGGP` (`/*`).
3. Report the live URL (https://universals3client.com) and note the CloudFront invalidation may take a few minutes to propagate.

Note: pushing to `master` with changes under `apps/marketing/**` already auto-deploys via `.github/workflows/deploy-marketing.yml`. Use this skill for local/one-off deploys or when CI isn't an option. Before deploying, it's worth running `npm run check` to catch lint/type errors.
