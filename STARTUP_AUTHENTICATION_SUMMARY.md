# Storage Protection at App Startup

## Overview
The app no longer requires a startup password. Credentials are encrypted at rest using Expo SecureStore (iOS Keychain / Android Keystore) and remain on-device.

## How It Works

- On app launch, providers are loaded directly from SecureStore
- Access and secret keys are stored in SecureStore entries per provider
- No master password is required

## Security Properties

- Encryption at rest via device keystore (Keychain/Keystore)
- No remote transmission of credentials
- Reset flow clears all SecureStore keys used by the app

## Developer Notes

- `src/services/secureStorage.ts` provides CRUD operations for providers
- `App.tsx` uses these functions without any auth gating
- `src/services/appReset.ts` wipes stored entries when requested