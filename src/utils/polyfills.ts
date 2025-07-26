/**
 * Polyfills file for the application
 * Must be imported at startup (in App.tsx or index.ts)
 */

// Import to fix crypto.getRandomValues() errors in React Native
import 'react-native-get-random-values';

// Log to confirm that the polyfill is loaded
console.log('Crypto polyfills applied successfully'); 