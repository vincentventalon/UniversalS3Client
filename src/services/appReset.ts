import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Keys used in the application
const LEGACY_PROVIDERS_KEY = 'universal_s3_client_providers'; // Old key (for cleanup)
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';
const PROVIDER_LIST_KEY = 'universal_s3_client_provider_list'; // New provider list key
const PROVIDER_PREFIX = 'universal_s3_client_provider_'; // Prefix for individual providers
const MIGRATION_FLAG_KEY = 'universal_s3_client_migrated'; // Migration flag

/**
 * Get all provider-specific keys from SecureStore
 * Since SecureStore doesn't provide a way to list all keys, we use the provider list
 */
async function getAllProviderKeys(): Promise<string[]> {
  try {
    const providerListJson = await SecureStore.getItemAsync(PROVIDER_LIST_KEY);
    if (!providerListJson) {
      return [];
    }
    
    const providerIds: string[] = JSON.parse(providerListJson);
    return providerIds.map(id => `${PROVIDER_PREFIX}${id}`);
  } catch (error) {
    console.error('Error getting provider keys:', error);
    return [];
  }
}

/**
 * Clears all stored data in the application
 * This is useful when the user needs to completely reset the app
 */
export async function resetAppData(): Promise<boolean> {
  try {
    console.log('Starting app data reset...');
    
    // Delete legacy providers key (if it exists)
    try {
      await SecureStore.deleteItemAsync(LEGACY_PROVIDERS_KEY);
    } catch (error) {
      // Ignore errors if key doesn't exist
    }
    
    // Delete password test key
    try {
      await SecureStore.deleteItemAsync(PASSWORD_TEST_KEY);
    } catch (error) {
      // Ignore errors if key doesn't exist
    }
    
    // Delete migration flag
    try {
      await SecureStore.deleteItemAsync(MIGRATION_FLAG_KEY);
    } catch (error) {
      // Ignore errors if key doesn't exist
    }
    
    // Delete all individual provider keys
    const providerKeys = await getAllProviderKeys();
    console.log(`Deleting ${providerKeys.length} provider keys...`);
    
    for (const key of providerKeys) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error(`Failed to delete provider key ${key}:`, error);
        // Continue with other keys even if one fails
      }
    }
    
    // Delete provider list key
    try {
      await SecureStore.deleteItemAsync(PROVIDER_LIST_KEY);
    } catch (error) {
      // Ignore errors if key doesn't exist
    }
    
    console.log('App data has been reset successfully');
    return true;
  } catch (error) {
    console.error('Failed to reset app data:', error);
    Alert.alert(
      'Reset Failed',
      'Could not reset the application data. Please try restarting the app.'
    );
    return false;
  }
}

/**
 * Get a count of stored providers without loading their data
 * Useful for showing reset confirmation with context
 */
export async function getStoredProvidersCount(): Promise<number> {
  try {
    const providerListJson = await SecureStore.getItemAsync(PROVIDER_LIST_KEY);
    if (!providerListJson) {
      // Check for legacy data
      const legacyData = await SecureStore.getItemAsync(LEGACY_PROVIDERS_KEY);
      if (legacyData) {
        try {
          const legacyProviders = JSON.parse(legacyData);
          return Array.isArray(legacyProviders) ? legacyProviders.length : 0;
        } catch {
          return 0;
        }
      }
      return 0;
    }
    
    const providerIds: string[] = JSON.parse(providerListJson);
    return providerIds.length;
  } catch (error) {
    console.error('Error getting providers count:', error);
    return 0;
  }
}

/**
 * Prompts the user to confirm before resetting all app data
 */
export function confirmAndResetApp(onSuccess?: () => void): void {
  // Get provider count first to show in confirmation
  getStoredProvidersCount().then(count => {
    const message = count > 0 
      ? `This will delete ${count} stored S3 provider${count > 1 ? 's' : ''} and reset your password. Continue?`
      : 'This will reset your password and clear all application data. Continue?';
    
    Alert.alert(
      'Reset Application',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            const success = await resetAppData();
            if (success && onSuccess) {
              onSuccess();
            }
          }
        }
      ]
    );
  });
} 