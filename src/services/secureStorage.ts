import * as SecureStore from 'expo-secure-store';
import { S3Provider } from '../types';
import { Alert } from 'react-native';
import CryptoJS from 'crypto-js';

// Storage keys
const LEGACY_PROVIDERS_KEY = 'universal_s3_client_providers'; // Old key for migration
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';
const PROVIDER_LIST_KEY = 'universal_s3_client_provider_list'; // List of provider IDs
const PROVIDER_PREFIX = 'universal_s3_client_provider_'; // Prefix for individual providers
const MIGRATION_FLAG_KEY = 'universal_s3_client_migrated'; // Flag to track migration status
const KEY_VERIFICATION = 'S3_CLIENT_VERIFICATION_STRING';

// PBKDF2 configuration for strong password hashing
const PBKDF2_ITERATIONS = 100000; // 100k iterations (recommended minimum)
const SALT_LENGTH = 32; // 32 bytes salt
const HASH_LENGTH = 64; // 64 bytes hash

// Session management - cache master password in memory
let cachedMasterPassword: string | null = null;
let isSessionAuthenticated: boolean = false;

// SecureStore options to use native security
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // Use native security attributes
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

/**
 * Generate a unique storage key for a specific provider
 */
function getProviderKey(providerId: string): string {
  return `${PROVIDER_PREFIX}${providerId}`;
}

/**
 * Encrypt provider data with the user's password for additional security
 */
function encryptProviderData(providerData: string, password: string): string {
  return CryptoJS.AES.encrypt(providerData, password).toString();
}

/**
 * Decrypt provider data with the user's password
 */
function decryptProviderData(encryptedData: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Set the session authentication state and cache the master password
 * Session persists until app termination (no manual logout)
 */
export function setSessionAuthentication(password: string): void {
  cachedMasterPassword = password;
  isSessionAuthenticated = true;
}

/**
 * Check if user is currently authenticated in this session
 */
export function isSessionAuthenticatedNow(): boolean {
  return isSessionAuthenticated && cachedMasterPassword !== null;
}

/**
 * Get the cached master password (only if authenticated)
 */
function getCachedPassword(): string {
  if (!isSessionAuthenticated || !cachedMasterPassword) {
    throw new Error('Not authenticated - please login first');
  }
  return cachedMasterPassword;
}

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
 * Check if migration from old storage format is needed
 */
async function needsMigration(): Promise<boolean> {
  try {
    const migrationFlag = await SecureStore.getItemAsync(MIGRATION_FLAG_KEY, secureStoreOptions);
    const legacyData = await SecureStore.getItemAsync(LEGACY_PROVIDERS_KEY, secureStoreOptions);
    
    // Need migration if we have legacy data but no migration flag
    return !migrationFlag && !!legacyData;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Migrate providers from old format (single JSON) to new format (individual storage)
 */
async function migrateFromLegacyStorage(password: string): Promise<void> {
  try {
    console.log('Starting migration from legacy storage format...');
    
    // Get legacy data
    const legacyProvidersJson = await SecureStore.getItemAsync(LEGACY_PROVIDERS_KEY, secureStoreOptions);
    if (!legacyProvidersJson) {
      console.log('No legacy data found, marking migration as complete');
      await SecureStore.setItemAsync(MIGRATION_FLAG_KEY, 'true', secureStoreOptions);
      return;
    }

    // Parse legacy providers
    const legacyProviders: S3Provider[] = JSON.parse(legacyProvidersJson);
    console.log(`Migrating ${legacyProviders.length} providers from legacy format`);

    // Store each provider individually with encryption
    const providerIds: string[] = [];
    for (const provider of legacyProviders) {
      const encryptedData = encryptProviderData(JSON.stringify(provider), password);
      await SecureStore.setItemAsync(getProviderKey(provider.id), encryptedData, secureStoreOptions);
      providerIds.push(provider.id);
    }

    // Store the list of provider IDs
    await SecureStore.setItemAsync(PROVIDER_LIST_KEY, JSON.stringify(providerIds), secureStoreOptions);

    // Clean up legacy data
    await SecureStore.deleteItemAsync(LEGACY_PROVIDERS_KEY);

    // Mark migration as complete
    await SecureStore.setItemAsync(MIGRATION_FLAG_KEY, 'true', secureStoreOptions);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the list of provider IDs
 */
async function getProviderIds(): Promise<string[]> {
  try {
    const providerListJson = await SecureStore.getItemAsync(PROVIDER_LIST_KEY, secureStoreOptions);
    if (!providerListJson) {
      return [];
    }
    return JSON.parse(providerListJson);
  } catch (error) {
    console.error('Error getting provider IDs:', error);
    return [];
  }
}

/**
 * Update the list of provider IDs
 */
async function updateProviderIds(providerIds: string[]): Promise<void> {
  await SecureStore.setItemAsync(PROVIDER_LIST_KEY, JSON.stringify(providerIds), secureStoreOptions);
}

/**
 * Save a single provider to secure storage
 */
export async function saveProvider(provider: S3Provider): Promise<void> {
  try {
    const password = getCachedPassword();
    
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage(password);
    }

    // Encrypt and store the provider
    const encryptedData = encryptProviderData(JSON.stringify(provider), password);
    await SecureStore.setItemAsync(getProviderKey(provider.id), encryptedData, secureStoreOptions);

    // Update provider list
    const providerIds = await getProviderIds();
    if (!providerIds.includes(provider.id)) {
      providerIds.push(provider.id);
      await updateProviderIds(providerIds);
    }

    // Ensure password verification is set up
    const existingTest = await SecureStore.getItemAsync(PASSWORD_TEST_KEY, secureStoreOptions);
    if (!existingTest) {
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
  } catch (error) {
    console.error('Failed to save provider:', error);
    Alert.alert('Error', 'Failed to save provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save provider');
  }
}

/**
 * Get a single provider by ID
 */
export async function getProvider(providerId: string): Promise<S3Provider | null> {
  try {
    if (!isSessionAuthenticatedNow()) {
      throw new Error('Not authenticated - please login first');
    }

    const password = getCachedPassword();
    
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage(password);
    }

    const encryptedData = await SecureStore.getItemAsync(getProviderKey(providerId), secureStoreOptions);
    if (!encryptedData) {
      return null;
    }

    const decryptedData = decryptProviderData(encryptedData, password);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Failed to get provider:', error);
    Alert.alert('Error', 'Failed to retrieve provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to retrieve provider');
  }
}

/**
 * Delete a single provider
 */
export async function deleteProvider(providerId: string): Promise<void> {
  try {
    if (!isSessionAuthenticatedNow()) {
      throw new Error('Not authenticated - please login first');
    }

    // Delete the provider data
    await SecureStore.deleteItemAsync(getProviderKey(providerId));

    // Update provider list
    const providerIds = await getProviderIds();
    const updatedIds = providerIds.filter(id => id !== providerId);
    await updateProviderIds(updatedIds);
  } catch (error) {
    console.error('Failed to delete provider:', error);
    Alert.alert('Error', 'Failed to delete provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to delete provider');
  }
}

/**
 * Saves the list of providers to secure storage using session authentication
 * This method is kept for backward compatibility but now stores providers individually
 */
export async function saveProviders(providers: S3Provider[]): Promise<void> {
  try {
    const password = getCachedPassword();
    
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage(password);
    }

    // Clear existing providers
    const existingIds = await getProviderIds();
    for (const id of existingIds) {
      await SecureStore.deleteItemAsync(getProviderKey(id));
    }

    // Store each provider individually
    const providerIds: string[] = [];
    for (const provider of providers) {
      const encryptedData = encryptProviderData(JSON.stringify(provider), password);
      await SecureStore.setItemAsync(getProviderKey(provider.id), encryptedData, secureStoreOptions);
      providerIds.push(provider.id);
    }

    // Update provider list
    await updateProviderIds(providerIds);

    // Ensure password verification is set up
    const existingTest = await SecureStore.getItemAsync(PASSWORD_TEST_KEY, secureStoreOptions);
    if (!existingTest) {
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
  } catch (error) {
    console.error('Failed to save providers:', error);
    Alert.alert('Error', 'Failed to save providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save providers');
  }
}

/**
 * Saves the list of providers to secure storage with explicit password (for initial setup)
 * This is used during the authentication process when setting up the password verification
 */
export async function saveProvidersWithPassword(providers: S3Provider[], password: string): Promise<void> {
  try {
    // Perform migration if needed
    const legacyData = await SecureStore.getItemAsync(LEGACY_PROVIDERS_KEY, secureStoreOptions);
    if (legacyData) {
      await migrateFromLegacyStorage(password);
    }

    // Clear existing providers
    const existingIds = await getProviderIds();
    for (const id of existingIds) {
      await SecureStore.deleteItemAsync(getProviderKey(id));
    }

    // Store each provider individually
    const providerIds: string[] = [];
    for (const provider of providers) {
      const encryptedData = encryptProviderData(JSON.stringify(provider), password);
      await SecureStore.setItemAsync(getProviderKey(provider.id), encryptedData, secureStoreOptions);
      providerIds.push(provider.id);
    }

    // Update provider list
    await updateProviderIds(providerIds);

    // Save password verification
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
 * Retrieves the list of providers using session authentication
 */
export async function getProviders(): Promise<S3Provider[]> {
  try {
    // Ensure user is authenticated
    if (!isSessionAuthenticatedNow()) {
      throw new Error('Not authenticated - please login first');
    }

    const password = getCachedPassword();
    
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage(password);
    }

    // Get all provider IDs
    const providerIds = await getProviderIds();
    
    // Load each provider individually
    const providers: S3Provider[] = [];
    for (const providerId of providerIds) {
      try {
        const encryptedData = await SecureStore.getItemAsync(getProviderKey(providerId), secureStoreOptions);
        if (encryptedData) {
          const decryptedData = decryptProviderData(encryptedData, password);
          const provider = JSON.parse(decryptedData);
          providers.push(provider);
        }
      } catch (error) {
        console.error(`Failed to load provider ${providerId}:`, error);
        // Continue loading other providers even if one fails
      }
    }

    return providers;
  } catch (error) {
    console.error('Failed to get providers:', error);
    Alert.alert('Error', 'Failed to retrieve providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to retrieve providers. Please re-authenticate.');
  }
}

/**
 * Retrieves the list of providers using explicit password verification (for authentication)
 */
export async function getProvidersWithPassword(password: string): Promise<S3Provider[]> {
  try {
    // First verify the password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage(password);
    }

    // Get all provider IDs
    const providerIds = await getProviderIds();
    
    // Load each provider individually
    const providers: S3Provider[] = [];
    for (const providerId of providerIds) {
      try {
        const encryptedData = await SecureStore.getItemAsync(getProviderKey(providerId), secureStoreOptions);
        if (encryptedData) {
          const decryptedData = decryptProviderData(encryptedData, password);
          const provider = JSON.parse(decryptedData);
          providers.push(provider);
        }
      } catch (error) {
        console.error(`Failed to load provider ${providerId}:`, error);
        // Continue loading other providers even if one fails
      }
    }

    return providers;
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
      await saveProvidersWithPassword([], password);
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

/**
 * Get all provider IDs without loading the full provider data
 * Useful for listing providers without decryption overhead
 */
export async function getProviderIdList(): Promise<string[]> {
  try {
    if (!isSessionAuthenticatedNow()) {
      throw new Error('Not authenticated - please login first');
    }

    const password = getCachedPassword();
    
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage(password);
    }

    return await getProviderIds();
  } catch (error) {
    console.error('Failed to get provider ID list:', error);
    return [];
  }
} 