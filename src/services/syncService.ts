import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Service for managing synchronization across devices
export class SyncService {
  private static readonly LAST_SYNC_KEY = 'universal_s3_client_last_sync';
  private static readonly SYNC_VERSION_KEY = 'universal_s3_client_sync_version';

  /**
   * Check if data is available from iCloud sync
   */
  static async checkForSyncedData(): Promise<boolean> {
    try {
      const syncVersion = await SecureStore.getItemAsync(this.SYNC_VERSION_KEY);
      return !!syncVersion;
    } catch (error) {
      console.error('Error checking synced data:', error);
      return false;
    }
  }

  /**
   * Update sync timestamp to track when data was last synced
   */
  static async updateSyncTimestamp(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      await SecureStore.setItemAsync(this.LAST_SYNC_KEY, timestamp);
      
      // Increment sync version for conflict detection
      const currentVersion = await SecureStore.getItemAsync(this.SYNC_VERSION_KEY);
      const newVersion = currentVersion ? (parseInt(currentVersion) + 1).toString() : '1';
      await SecureStore.setItemAsync(this.SYNC_VERSION_KEY, newVersion);
    } catch (error) {
      console.error('Error updating sync timestamp:', error);
    }
  }

  /**
   * Get last sync information
   */
  static async getLastSyncInfo(): Promise<{ timestamp?: string; version?: string }> {
    try {
      const [timestamp, version] = await Promise.all([
        SecureStore.getItemAsync(this.LAST_SYNC_KEY),
        SecureStore.getItemAsync(this.SYNC_VERSION_KEY)
      ]);
      
      return { timestamp: timestamp || undefined, version: version || undefined };
    } catch (error) {
      console.error('Error getting sync info:', error);
      return {};
    }
  }

  /**
   * Show sync notification to user
   */
  static showSyncNotification(deviceCount?: number): void {
    const message = deviceCount 
      ? `Credentials synchronized across ${deviceCount} devices via iCloud Keychain`
      : 'Credentials synchronized via iCloud Keychain';
      
    Alert.alert(
      'Sync Enabled',
      `${message}\n\nYour S3 providers will be available on all your Apple devices when signed in with the same Apple ID.`,
      [{ text: 'OK' }]
    );
  }
}