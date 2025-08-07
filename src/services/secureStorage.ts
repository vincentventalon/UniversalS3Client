import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { S3Provider } from '../types';

// Storage keys
const PROVIDER_LIST_KEY = 'universal_s3_client_provider_list';
const PROVIDER_PREFIX = 'universal_s3_client_provider_';

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

export async function saveProvider(provider: S3Provider): Promise<void> {
  try {
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
    return await getProviderIds();
  } catch (error) {
    console.error('Failed to get provider ID list:', error);
    return [];
  }
}