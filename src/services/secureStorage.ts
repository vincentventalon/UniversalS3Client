import * as SecureStore from 'expo-secure-store';
import { S3Provider } from '../types';
import { Alert } from 'react-native';

// Storage keys
const PROVIDERS_INDEX_KEY = 'universal_s3_client_providers_index';
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';
const KEY_VERIFICATION = 'S3_CLIENT_VERIFICATION_STRING';

// SecureStore options to use native security
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // Utiliser les attributs de sécurité natifs
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

/**
 * Generate a simple hash for verification
 * Using a simple method to avoid crypto dependencies
 */
function generateSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Generate a unique storage key for a provider
 */
function getProviderKey(providerId: string): string {
  return `provider_${providerId}`;
}

/**
 * Get the list of provider IDs from the index
 */
async function getProviderIndex(): Promise<string[]> {
  try {
    const indexJson = await SecureStore.getItemAsync(PROVIDERS_INDEX_KEY, secureStoreOptions);
    return indexJson ? JSON.parse(indexJson) : [];
  } catch (error) {
    console.error('Failed to get provider index:', error);
    return [];
  }
}

/**
 * Update the provider index with a new list of provider IDs
 */
async function updateProviderIndex(providerIds: string[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(PROVIDERS_INDEX_KEY, JSON.stringify(providerIds), secureStoreOptions);
  } catch (error) {
    console.error('Failed to update provider index:', error);
    throw error;
  }
}

/**
 * Saves the list of providers to secure storage using individual entries
 */
export async function saveProviders(providers: S3Provider[], password: string): Promise<void> {
  try {
    // First save the password verification
    const verification = {
      key: KEY_VERIFICATION,
      hash: generateSimpleHash(password)
    };
    
    await SecureStore.setItemAsync(
      PASSWORD_TEST_KEY, 
      JSON.stringify(verification), 
      secureStoreOptions
    );

    // Get current provider index to clean up removed providers
    const currentProviderIds = await getProviderIndex();
    const newProviderIds = providers.map(p => p.id);

    // Remove providers that are no longer in the list
    const removedProviderIds = currentProviderIds.filter(id => !newProviderIds.includes(id));
    for (const providerId of removedProviderIds) {
      try {
        await SecureStore.deleteItemAsync(getProviderKey(providerId));
      } catch (error) {
        console.warn(`Failed to delete provider ${providerId}:`, error);
      }
    }

    // Save each provider individually
    for (const provider of providers) {
      const providerKey = getProviderKey(provider.id);
      const providerJson = JSON.stringify(provider);
      await SecureStore.setItemAsync(providerKey, providerJson, secureStoreOptions);
    }

    // Update the provider index
    await updateProviderIndex(newProviderIds);

  } catch (error) {
    console.error('Failed to save providers:', error);
    Alert.alert('Error', 'Failed to save providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save providers');
  }
}

/**
 * Saves a single provider to secure storage
 */
export async function saveProvider(provider: S3Provider, password: string): Promise<void> {
  try {
    // Verify password first
    const isValid = await verifyPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Save the individual provider
    const providerKey = getProviderKey(provider.id);
    const providerJson = JSON.stringify(provider);
    await SecureStore.setItemAsync(providerKey, providerJson, secureStoreOptions);

    // Update the provider index
    const currentProviderIds = await getProviderIndex();
    if (!currentProviderIds.includes(provider.id)) {
      currentProviderIds.push(provider.id);
      await updateProviderIndex(currentProviderIds);
    }

  } catch (error) {
    console.error('Failed to save provider:', error);
    Alert.alert('Error', 'Failed to save provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save provider');
  }
}

/**
 * Deletes a single provider from secure storage
 */
export async function deleteProvider(providerId: string, password: string): Promise<void> {
  try {
    // Verify password first
    const isValid = await verifyPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Delete the provider
    await SecureStore.deleteItemAsync(getProviderKey(providerId));

    // Update the provider index
    const currentProviderIds = await getProviderIndex();
    const updatedProviderIds = currentProviderIds.filter(id => id !== providerId);
    await updateProviderIndex(updatedProviderIds);

  } catch (error) {
    console.error('Failed to delete provider:', error);
    Alert.alert('Error', 'Failed to delete provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to delete provider');
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
    
    // Get the provider index
    const providerIds = await getProviderIndex();
    
    if (providerIds.length === 0) {
      return [];
    }

    // Load each provider individually
    const providers: S3Provider[] = [];
    for (const providerId of providerIds) {
      try {
        const providerKey = getProviderKey(providerId);
        const providerJson = await SecureStore.getItemAsync(providerKey, secureStoreOptions);
        
        if (providerJson) {
          const provider = JSON.parse(providerJson);
          providers.push(provider);
        } else {
          console.warn(`Provider ${providerId} not found in storage, removing from index`);
          // Provider was deleted outside of our control, remove from index
          const currentIndex = await getProviderIndex();
          const updatedIndex = currentIndex.filter(id => id !== providerId);
          await updateProviderIndex(updatedIndex);
        }
      } catch (error) {
        console.error(`Failed to load provider ${providerId}:`, error);
        // Continue loading other providers
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
 * Migrates from old storage format (single JSON array) to new format (individual entries)
 */
export async function migrateFromOldStorage(password: string): Promise<boolean> {
  try {
    // Check if old storage exists
    const oldProvidersKey = 'universal_s3_client_providers'; // The old key
    const oldProvidersJson = await SecureStore.getItemAsync(oldProvidersKey, secureStoreOptions);
    
    if (!oldProvidersJson) {
      return false; // No old data to migrate
    }

    console.log('Migrating from old storage format...');
    
    // Parse old data
    const oldProviders: S3Provider[] = JSON.parse(oldProvidersJson);
    
    // Save using new format
    await saveProviders(oldProviders, password);
    
    // Delete old storage
    await SecureStore.deleteItemAsync(oldProvidersKey);
    
    console.log('Successfully migrated', oldProviders.length, 'providers to new storage format');
    return true;
    
  } catch (error) {
    console.error('Failed to migrate from old storage:', error);
    return false;
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
      return verification.key === KEY_VERIFICATION && 
             verification.hash === generateSimpleHash(password);
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