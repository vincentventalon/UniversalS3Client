# Universal S3 Client

## Changelog

### 1.1
- Mise à jour de la version de l'application (1.0 → 1.1)
- Mise à jour de la version du package (1.0.0 → 1.1.0 dans package.json)

A React Native application that allows you to manage S3-compatible storage buckets from different providers like AWS, Cloudflare, Hetzner, and more.

## Features

- Secure credential storage with password protection
- Support for multiple S3 providers
- List buckets from providers
- View and copy bucket URLs
- Simple, single-screen interface

## Supported Providers

- AWS S3
- Hetzner Storage
- Soon: Any S3-compatible service

## Important Compatibility Notes

### Hetzner S3 Compatibility

This application uses AWS SDK version 3.188.0, which is compatible with Hetzner's S3 implementation. 

**IMPORTANT**: File/data uploads to Hetzner Buckets will fail with AWS SDK v3.200.0 or later. This is because newer AWS SDK versions adopt default integrity protections that require an additional checksum on all PUT calls, which Hetzner does not support.

If you're using AWS CLI directly with Hetzner buckets, we recommend:
- Installing AWS CLI v2.22.35 or below
- Or disabling checksums with: `aws configure set default.s3.payload_signing_enabled false`

## Security

- Provider credentials are stored using Expo SecureStore (iOS Keychain/Android Keystore) and encrypted at rest
- No master password; your data never leaves your device

## Development

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Start the development server:

```bash
npx expo start
```

4. Follow the instructions to open the app in a simulator or on your physical device.

## Building for Production

To create a production build, make sure you have EAS CLI installed:

```bash
npm install -g eas-cli
```

Then run:

```bash
npx eas build -p android
npx eas build -p ios
```

## License

MIT 
