import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { S3Provider } from '../types';

// Storage keys
const PROVIDER_LIST_KEY = 'universal_s3_client_provider_list';
const PROVIDER_PREFIX = 'universal_s3_client_provider_';
const LEGACY_PROVIDERS_KEY = 'universal_s3_client_providers'; // Old key for migration
const MIGRATION_FLAG_KEY = 'universal_s3_client_migrated'; // Flag to track migration status

// SecureStore options
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

function getProviderKey(providerId: string): string {
  return `${PROVIDER_PREFIX}${providerId}`;
}

async function getProviderIds(): Promise<string[]> {
  try {
    const providerListJson = await SecureStore.getItemAsync(PROVIDER_LIST_KEY, secureStoreOptions);
    if (!providerListJson) return [];
    return JSON.parse(providerListJson);
  } catch (error) {
    console.error('Error getting provider IDs:', error);
    return [];
  }
}

async function updateProviderIds(providerIds: string[]): Promise<void> {
  await SecureStore.setItemAsync(PROVIDER_LIST_KEY, JSON.stringify(providerIds), secureStoreOptions);
}

/**
 * Check if migration from old storage format is needed
 */
async function needsMigration(): Promise<boolean> {
  try {
    const legacyData = await SecureStore.getItemAsync(LEGACY_PROVIDERS_KEY, secureStoreOptions);
    
    // If we have legacy data, we need migration regardless of the flag
    if (legacyData) {
      console.log('Legacy data detected, migration needed');
      return true;
    }
    
    // If no legacy data but migration flag is set, check if we actually have migrated data
    const migrationFlag = await SecureStore.getItemAsync(MIGRATION_FLAG_KEY, secureStoreOptions);
    if (migrationFlag) {
      // Verify that we actually have provider data in the new format
      const providerList = await SecureStore.getItemAsync(PROVIDER_LIST_KEY, secureStoreOptions);
      if (!providerList) {
        console.log('Migration flag set but no provider list found, clearing flag');
        // Clear the incorrect migration flag
        await SecureStore.deleteItemAsync(MIGRATION_FLAG_KEY);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Migrate providers from old format (single JSON) to new format (individual storage)
 */
async function migrateFromLegacyStorage(): Promise<void> {
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

    // Store each provider individually
    const providerIds: string[] = [];
    for (const provider of legacyProviders) {
      await SecureStore.setItemAsync(getProviderKey(provider.id), JSON.stringify(provider), secureStoreOptions);
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

export async function saveProvider(provider: S3Provider): Promise<void> {
  try {
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage();
    }

    await SecureStore.setItemAsync(getProviderKey(provider.id), JSON.stringify(provider), secureStoreOptions);

    const providerIds = await getProviderIds();
    if (!providerIds.includes(provider.id)) {
      providerIds.push(provider.id);
      await updateProviderIds(providerIds);
    }
  } catch (error) {
    console.error('Failed to save provider:', error);
    Alert.alert('Error', 'Failed to save provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save provider');
  }
}

export async function getProvider(providerId: string): Promise<S3Provider | null> {
  try {
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage();
    }

    const data = await SecureStore.getItemAsync(getProviderKey(providerId), secureStoreOptions);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get provider:', error);
    Alert.alert('Error', 'Failed to retrieve provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to retrieve provider');
  }
}

export async function deleteProvider(providerId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(getProviderKey(providerId));

    const providerIds = await getProviderIds();
    const updatedIds = providerIds.filter(id => id !== providerId);
    await updateProviderIds(updatedIds);
  } catch (error) {
    console.error('Failed to delete provider:', error);
    Alert.alert('Error', 'Failed to delete provider: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to delete provider');
  }
}

export async function saveProviders(providers: S3Provider[]): Promise<void> {
  try {
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage();
    }

    const existingIds = await getProviderIds();
    for (const id of existingIds) {
      await SecureStore.deleteItemAsync(getProviderKey(id));
    }

    const providerIds: string[] = [];
    for (const provider of providers) {
      await SecureStore.setItemAsync(getProviderKey(provider.id), JSON.stringify(provider), secureStoreOptions);
      providerIds.push(provider.id);
    }

    await updateProviderIds(providerIds);
  } catch (error) {
    console.error('Failed to save providers:', error);
    Alert.alert('Error', 'Failed to save providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to save providers');
  }
}

export async function getProviders(): Promise<S3Provider[]> {
  try {
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage();
    }

    const providerIds = await getProviderIds();
    const providers: S3Provider[] = [];
    for (const providerId of providerIds) {
      try {
        const data = await SecureStore.getItemAsync(getProviderKey(providerId), secureStoreOptions);
        if (data) {
          providers.push(JSON.parse(data));
        }
      } catch (error) {
        console.error(`Failed to load provider ${providerId}:`, error);
      }
    }
    return providers;
  } catch (error) {
    console.error('Failed to get providers:', error);
    Alert.alert('Error', 'Failed to retrieve providers: ' + (error instanceof Error ? error.message : String(error)));
    throw new Error('Failed to retrieve providers.');
  }
}

export async function getProviderIdList(): Promise<string[]> {
  try {
    // Perform migration if needed
    if (await needsMigration()) {
      await migrateFromLegacyStorage();
    }

    return await getProviderIds();
  } catch (error) {
    console.error('Failed to get provider ID list:', error);
    return [];
  }
}

/**
 * Force recovery of legacy data regardless of migration status
 * This is useful for users who may have been caught between migrations
 */
export async function attemptLegacyDataRecovery(): Promise<S3Provider[]> {
  try {
    console.log('Attempting legacy data recovery...');
    
    // First, try to get legacy data
    const legacyProvidersJson = await SecureStore.getItemAsync(LEGACY_PROVIDERS_KEY, secureStoreOptions);
    if (legacyProvidersJson) {
      try {
        const legacyProviders: S3Provider[] = JSON.parse(legacyProvidersJson);
        console.log(`Found ${legacyProviders.length} providers in legacy storage`);
        
        // Perform migration
        await migrateFromLegacyStorage();
        
        return legacyProviders;
      } catch (error) {
        console.error('Failed to parse legacy data:', error);
      }
    }
    
    // If no legacy data, check if we have data in new format
    const providers = await getProviders();
    if (providers.length > 0) {
      console.log(`Found ${providers.length} providers in new storage format`);
      return providers;
    }
    
    console.log('No provider data found in either format');
    return [];
  } catch (error) {
    console.error('Legacy data recovery failed:', error);
    return [];
  }
}

// Export the function for debugging purposes
export { needsMigration, migrateFromLegacyStorage };