import * as SecureStore from 'expo-secure-store';
import { S3Provider } from '../types';
import { Alert } from 'react-native';
import * as CryptoJS from 'crypto-js';

// Storage keys
const PROVIDERS_KEY = 'universal_s3_client_providers';
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';
const KEY_VERIFICATION = 'S3_CLIENT_VERIFICATION_STRING';

// Security constants for PBKDF2
const SALT = 'universal-s3-client-salt-2024';
const ITERATIONS = 10000;
const KEY_SIZE = 256 / 32; // 256 bits

// SecureStore options to use native security
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // Utiliser les attributs de sécurité natifs
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

/**
 * Generate a secure PBKDF2 hash for password verification
 * Uses PBKDF2 with 10,000 iterations and a fixed salt
 */
function generateSecureHash(password: string): string {
  const hash = CryptoJS.PBKDF2(password, SALT, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS
  });
  return hash.toString(CryptoJS.enc.Hex);
}

/**
 * Saves the list of providers to secure storage
 * We directly store JSON without extra encryption layer
 */
export async function saveProviders(providers: S3Provider[], password: string): Promise<void> {
  try {
    // Store the providers directly - SecureStore already provides encryption
    const providersJson = JSON.stringify(providers);
    await SecureStore.setItemAsync(PROVIDERS_KEY, providersJson, secureStoreOptions);
    
    // Save a verification object to test passwords using PBKDF2
    const verification = {
      key: KEY_VERIFICATION,
      hash: generateSecureHash(password)
    };
    
    await SecureStore.setItemAsync(
      PASSWORD_TEST_KEY, 
      JSON.stringify(verification), 
      secureStoreOptions
    );
  } catch (error) {
    console.error('Failed to save providers:', error);
    Alert.alert('Error', 'Failed to save providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save providers');
  }
}

/**
 * Retrieves the list of providers using the master password for verification only
 */
export async function getProviders(password: string): Promise<S3Provider[]> {
  try {
    // First verify the password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }
    
    // Get the providers data
    const providersJson = await SecureStore.getItemAsync(PROVIDERS_KEY, secureStoreOptions);
    
    if (!providersJson) {
      return [];
    }
    
    return JSON.parse(providersJson);
  } catch (error) {
    console.error('Failed to get providers:', error);
    Alert.alert('Error', 'Failed to retrieve providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to retrieve providers. Incorrect password or corrupted data.');
  }
}

/**
 * Checks if a password has already been configured
 */
export async function isPasswordConfigured(): Promise<boolean> {
  try {
    const testValue = await SecureStore.getItemAsync(PASSWORD_TEST_KEY, secureStoreOptions);
    return !!testValue;
  } catch (error) {
    console.error('Error checking if password is configured:', error);
    return false;
  }
}

/**
 * Verifies if the provided password matches the stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    if (!password.trim()) {
      return false; // Empty passwords are not valid
    }
    
    const testValueJson = await SecureStore.getItemAsync(PASSWORD_TEST_KEY, secureStoreOptions);
    
    if (!testValueJson) {
      // If no test value exists yet, this is first-time setup
      // Save an empty providers array and a verification string with this password
      await saveProviders([], password);
      return true;
    }
    
    // Check if the password hash matches using PBKDF2
    try {
      const verification = JSON.parse(testValueJson);
      const inputHash = generateSecureHash(password);
      return verification.key === KEY_VERIFICATION && 
             verification.hash === inputHash;
    } catch (error) {
      console.error('Password verification failed (parsing):', error);
      return false;
    }
  } catch (error) {
    console.error('Password verification failed:', error);
    Alert.alert('Error', 'Password verification failed: ' + (error instanceof Error ? error.message : String(error)));
    return false;
  }
} 