import * as SecureStore from 'expo-secure-store';
import { S3Provider } from '../types';
import { Alert } from 'react-native';
import CryptoJS from 'crypto-js';

// Storage keys
const PROVIDERS_KEY = 'universal_s3_client_providers';
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';
const KEY_VERIFICATION = 'S3_CLIENT_VERIFICATION_STRING';

// PBKDF2 configuration for strong password hashing
const PBKDF2_ITERATIONS = 100000; // 100k iterations (recommended minimum)
const SALT_LENGTH = 32; // 32 bytes salt
const HASH_LENGTH = 64; // 64 bytes hash

// SecureStore options to use native security
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // Utiliser les attributs de sécurité natifs
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

/**
 * Generate a random salt for PBKDF2
 */
function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

/**
 * Generate a strong PBKDF2 hash for password verification
 * This replaces the weak simple hash with cryptographically secure PBKDF2
 */
function generateSecureHash(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: HASH_LENGTH / 4, // keySize is in 32-bit words
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  }).toString();
}

/**
 * Legacy simple hash function for backward compatibility
 * This should only be used for migration purposes
 */
function generateLegacyHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Migrates from legacy weak hash to secure PBKDF2 hash
 */
async function migrateToSecureHash(password: string): Promise<void> {
  const salt = generateSalt();
  const hash = generateSecureHash(password, salt);
  const verification = {
    key: KEY_VERIFICATION,
    hash: hash,
    salt: salt
  };
  
  await SecureStore.setItemAsync(
    PASSWORD_TEST_KEY, 
    JSON.stringify(verification), 
    secureStoreOptions
  );
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
    
    // Save a verification object to test passwords
    const salt = generateSalt();
    const hash = generateSecureHash(password, salt);
    const verification = {
      key: KEY_VERIFICATION,
      hash: hash,
      salt: salt
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
    
    // Check if the password hash matches
    try {
      const verification = JSON.parse(testValueJson);
      
      // Check if this is an old format (no salt) - legacy weak hash
      if (!verification.salt) {
        const legacyHash = generateLegacyHash(password);
        const isLegacyValid = verification.key === KEY_VERIFICATION && 
                              verification.hash === legacyHash;
        
        if (isLegacyValid) {
          // Migrate to secure hash
          console.log('Migrating from legacy weak hash to secure PBKDF2...');
          await migrateToSecureHash(password);
          return true;
        }
        return false;
      }
      
      // New format with secure hash
      const salt = verification.salt;
      const hash = generateSecureHash(password, salt);
      return verification.key === KEY_VERIFICATION && 
             verification.hash === hash;
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