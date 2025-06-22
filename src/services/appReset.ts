import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Keys used in the application
const PROVIDERS_KEY = 'universal_s3_client_providers';
const PASSWORD_TEST_KEY = 'universal_s3_client_pwd_test';

/**
 * Clears all stored data in the application
 * This is useful when the user needs to completely reset the app
 */
export async function resetAppData(): Promise<boolean> {
  try {
    // Delete all stored keys
    await SecureStore.deleteItemAsync(PROVIDERS_KEY);
    await SecureStore.deleteItemAsync(PASSWORD_TEST_KEY);
    
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