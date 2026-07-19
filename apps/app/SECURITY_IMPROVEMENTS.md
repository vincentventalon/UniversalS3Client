# Security Improvements - Storage Protection Update

## Summary

The app uses Expo SecureStore (iOS Keychain / Android Keystore) to encrypt credentials at rest. Master password-based encryption has been removed for a simpler and still secure model leveraging device keystores.

## Changes

- Replaced master password flow with direct use of Expo SecureStore for at-rest encryption
- Removed password hashing (PBKDF2) and in-memory session caching
- Simplified `secureStorage.ts` to store providers individually as JSON
- Updated reset flow and documentation accordingly

## Rationale

- Expo SecureStore provides strong, platform-native encryption at rest
- Eliminates UX friction from master password prompts
- Reduces cryptographic surface area in the app

## Files Modified

1. `src/services/secureStorage.ts`
   - Simplified storage APIs without password logic
2. `App.tsx`
   - Removed password gate and session auth
3. `src/services/appReset.ts`
   - Updated messaging; unchanged cleanup of storage keys
4. Documentation
   - README, PrivacyPolicy, App-Store-Description updated to reflect SecureStore usage

## Notes

- Credentials remain local-only and encrypted at rest via system keystore
- No analytics or remote transmission of credentials
- Reset clears all SecureStore entries used by the app