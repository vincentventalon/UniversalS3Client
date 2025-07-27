# Universal S3 Client

## Changelog

### 1.2 (iCloud Keychain Sync)
- ✨ **NEW**: Synchronisation des credentials entre iPhone et Mac via iCloud Keychain
- 🔐 **Sécurité**: Les credentials sont automatiquement synchronisés de manière chiffrée
- 📱 **Multi-device**: Accédez à vos providers S3 sur tous vos appareils Apple
- 🔄 **Automatique**: Synchronisation transparente sans intervention utilisateur

### 1.1
- Mise à jour de la version de l'application (1.0 → 1.1)
- Mise à jour de la version du package (1.0.0 → 1.1.0 dans package.json)

A React Native application that allows you to manage S3-compatible storage buckets from different providers like AWS, Cloudflare, Hetzner, and more.

## Features

- **🔐 Secure credential storage** with password protection
- **☁️ iCloud Keychain synchronization** between iPhone and Mac
- **🌐 Support for multiple S3 providers**
- **📁 List buckets** from providers
- **🔗 View and copy bucket URLs**
- **📱 Simple, single-screen interface**

## Supported Providers

- AWS S3
- Hetzner Storage
- Soon: Any S3-compatible service

## 🔄 iCloud Keychain Synchronization

Vos credentials S3 sont automatiquement synchronisés entre tous vos appareils Apple :

### Fonctionnement
- **Chiffrement de bout en bout** : Vos données sont chiffrées avant d'être stockées
- **Synchronisation automatique** : Pas besoin d'intervention manuelle
- **Multi-device** : iPhone, iPad, Mac - tous synchronisés
- **Sécurité native** : Utilise le Keychain natif d'Apple

### Configuration requise
- iOS 13+ ou macOS 10.15+
- Connexion iCloud active
- Même Apple ID sur tous les appareils

### Indicateur de statut
L'application affiche un indicateur ☁️ pour montrer l'état de synchronisation :
- ✅ **Vert** : Synchronisé avec iCloud Keychain
- ⚪ **Gris** : Pas encore synchronisé

## Important Compatibility Notes

### Hetzner S3 Compatibility

This application uses AWS SDK version 3.188.0, which is compatible with Hetzner's S3 implementation. 

**IMPORTANT**: File/data uploads to Hetzner Buckets will fail with AWS SDK v3.200.0 or later. This is because newer AWS SDK versions adopt default integrity protections that require an additional checksum on all PUT calls, which Hetzner does not support.

If you're using AWS CLI directly with Hetzner buckets, we recommend:
- Installing AWS CLI v2.22.35 or below
- Or disabling checksums with: `aws configure set default.s3.payload_signing_enabled false`

## Security

- **AES encryption** for all provider credentials
- **iCloud Keychain** for secure cross-device synchronization
- **Master password** stored as a hash
- **Secure storage** using `expo-secure-store` with native keychain
- **Hardware-backed security** when available

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

### iOS Development Build (for iCloud Keychain testing)

Pour tester la synchronisation iCloud Keychain, vous devez créer un development build :

```bash
# Créer un development build
npx expo install expo-dev-client
eas build --profile development --platform ios
```

## Technical Implementation

### iCloud Keychain Integration

L'application utilise les fonctionnalités natives d'iOS pour la synchronisation :

- **Keychain Access Group** : `group.com.vincentventalon.universals3client.shared`
- **Encryption** : AES avec clés gérées par le Keychain
- **Sync tracking** : Horodatage et versioning pour détecter les changements

### Architecture de sécurité

```
User Data → AES Encryption → iOS Keychain → iCloud Keychain → Autres appareils
```

## License

MIT 
