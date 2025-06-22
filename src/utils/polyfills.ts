/**
 * Fichier de polyfills pour l'application
 * Doit être importé au démarrage (dans App.tsx ou index.ts)
 */

// Import pour corriger les erreurs crypto.getRandomValues() dans React Native
import 'react-native-get-random-values';

// Log pour confirmer que le polyfill est chargé
console.log('Crypto polyfills applied successfully'); 