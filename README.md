# Universal S3 Client

A React Native mobile app to manage S3‑compatible object storage across multiple cloud providers from a single, secure interface.

## What this app is for

- Manage multiple S3 connections (AWS and 13+ S3‑compatible providers)
- Browse buckets and objects with a clean, mobile‑first UI
- Upload files from your device, copy/rename/delete objects and folders
- Generate signed URLs for secure, time‑limited sharing

## Why the app is secure

- **On‑device encryption at rest**: Credentials are stored with Expo SecureStore (iOS Keychain / Android Keystore)
- **No backend, no data exfiltration**: Your access keys never leave your device
- **Principle of least privilege**: Use IAM keys scoped to the minimal permissions required
- **Ephemeral access**: Signed URLs include expiration and are never stored permanently
- **Full reset**: Built‑in reset clears all SecureStore entries used by the app

See `PrivacyPolicy.md` for more details. There is no analytics and no master password prompt; protection relies on the device keystore.

## Supported providers

Out of the box, 14 S3‑compatible providers are supported:

- AWS S3 (33 regions)
- Hetzner Storage Box (3 locations)
- Cloudflare R2 (account ID + location hints)
- DigitalOcean Spaces (5 regions)
- Wasabi (6 regions)
- Backblaze B2 (3 regions)
- Scaleway Object Storage (3 regions)
- Vultr Object Storage (multiple regions)
- Linode Object Storage (3 regions)
- Oracle Cloud Infrastructure (11 regions, namespace)
- IBM Cloud Object Storage (cross/regional)
- Google Cloud Storage
- Azure Blob Storage
- MinIO (custom endpoints)

Note on compatibility: the app pins AWS SDK v3.188.0 for best compatibility (e.g., Hetzner requires ≤ v3.188.0 due to checksum changes in later versions).

## Key functionalities

- **Provider management**: add/edit/delete providers with provider‑specific fields (e.g., account ID, namespace, cluster ID, custom endpoint)
- **Bucket/object browser**: breadcrumb navigation, pagination, pull‑to‑refresh
- **File operations**: upload (multipart, progress), copy, rename, recursive delete
- **Selection tools**: multi‑select for batch actions
- **Signed URLs**: create time‑limited links for secure sharing
- **Resilience**: network offline detection and contextual error handling
- **Modern UI**: React Native Paper components with a clean, responsive layout

## Quick start

Prerequisites:
- Node.js 18+
- npm or yarn
- Expo CLI

Install and run:

```bash
npm install --legacy-peer-deps
npx expo start
```

Add your first provider in the app, then browse your buckets and objects.

## Build for production

Install EAS CLI if not already installed:

```bash
npm install -g eas-cli
```

Create builds:

```bash
npx eas build -p android
npx eas build -p ios
```

## Platform and versions

- React Native 0.76.9 + TypeScript
- Expo SDK 52.x
- AWS SDK v3.188.0 (client, lib‑storage, presigner)
- iOS 13+ / Android 5.0+ (API 21+)

## Important compatibility note (Hetzner)

Hetzner’s S3 implementation can fail uploads with newer AWS SDKs that enforce checksums by default. If you use AWS CLI directly with Hetzner buckets:

- Use AWS CLI v2.22.35 or below, or
- Disable payload checksums: `aws configure set default.s3.payload_signing_enabled false`

The app remains compatible by pinning to AWS SDK v3.188.0.

## Development

- Scripts: `npm run start`, `npm run android`, `npm run ios`
- Source: `src/` (components, services, config, types, utils)

## License

MIT 
