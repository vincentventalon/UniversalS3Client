import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Keys used in the application
const PROVIDERS_INDEX_KEY = 'universal_s3_client_providers_index';
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';
const OLD_PROVIDERS_KEY = 'universal_s3_client_providers'; // For cleanup of old format

/**
 * Get the list of provider IDs from the index
 */
async function getProviderIndex(): Promise<string[]> {
  try {
    const indexJson = await SecureStore.getItemAsync(PROVIDERS_INDEX_KEY);
    return indexJson ? JSON.parse(indexJson) : [];
  } catch (error) {
    console.error('Failed to get provider index:', error);
    return [];
  }
}

/**
 * Generate a unique storage key for a provider
 */
function getProviderKey(providerId: string): string {
  return `provider_${providerId}`;
}

/**
 * Clears all stored data in the application
 * This is useful when the user needs to completely reset the app
 */
export async function resetAppData(): Promise<boolean> {
  try {
    // Get all provider IDs and delete individual provider entries
    const providerIds = await getProviderIndex();
    
    for (const providerId of providerIds) {
      try {
        await SecureStore.deleteItemAsync(getProviderKey(providerId));
      } catch (error) {
        console.warn(`Failed to delete provider ${providerId}:`, error);
      }
    }
    
    // Delete the provider index
    await SecureStore.deleteItemAsync(PROVIDERS_INDEX_KEY);
    
    // Delete password test key
    await SecureStore.deleteItemAsync(PASSWORD_TEST_KEY);
    
    // Clean up old format if it exists
    try {
      await SecureStore.deleteItemAsync(OLD_PROVIDERS_KEY);
    } catch (error) {
      // Ignore errors for old key cleanup
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
 * Prompts the user to confirm before resetting all app data
 */
export function confirmAndResetApp(onSuccess?: () => void): void {
  Alert.alert(
    'Reset Application',
    'This will delete all stored S3 provider information and reset your password. Continue?',
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
} 