# Universal S3 Client

A React Native application that allows you to manage S3-compatible storage buckets from different providers like AWS, Cloudflare, Hetzner, and more.

## Features

- Secure credential storage with password protection
- Support for multiple S3 providers
- List buckets from providers
- View and copy bucket URLs
- Simple, single-screen interface

## Supported Providers

- AWS S3
- Cloudflare R2
- Hetzner Storage
- Any S3-compatible service

## Important Compatibility Notes

### Hetzner S3 Compatibility

This application uses AWS SDK version 3.188.0, which is compatible with Hetzner's S3 implementation. 

**IMPORTANT**: File/data uploads to Hetzner Buckets will fail with AWS SDK v3.200.0 or later. This is because newer AWS SDK versions adopt default integrity protections that require an additional checksum on all PUT calls, which Hetzner does not support.

If you're using AWS CLI directly with Hetzner buckets, we recommend:
- Installing AWS CLI v2.22.35 or below
- Or disabling checksums with: `aws configure set default.s3.payload_signing_enabled false`

## Security

- All provider credentials are encrypted using AES
- Master password is stored as a hash
- Secure storage using `expo-secure-store`

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
npm start
```

4. Follow the instructions to open the app in a simulator or on your physical device.

## Building for Production

To create a production build:

```bash
expo build:android  # For Android
expo build:ios      # For iOS
```

## License

MIT 