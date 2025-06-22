// Importer le polyfill pour crypto.getRandomValues() en premier
import './src/utils/polyfills';

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, Text, Portal, Modal, FAB } from 'react-native-paper';
import ProviderForm from './src/components/ProviderForm';
import ProviderList from './src/components/ProviderList';
import ProviderDetails from './src/components/ProviderDetails';
import { S3Provider } from './src/types';
import * as SecureStore from 'expo-secure-store';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { listBucketObjects, extractBucketName } from './src/services/s3Service';
import { generateId } from './src/utils/idGenerator';

// Storage key for providers
const PROVIDERS_KEY = 'universal_s3_client_providers';

export default function App() {
  const [providers, setProviders] = useState<S3Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<S3Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [addBucketError, setAddBucketError] = useState<string | null>(null);
  // Champs du formulaire d'ajout de bucket (contrôlé)
  const [bucketName, setBucketName] = useState('');
  const [type, setType] = useState<'aws' | 'hetzner'>('aws');
  const [region, setRegion] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [hetznerLocation, setHetznerLocation] = useState('fsn1');

  // Initial app setup - load providers immediately
  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  async function loadProviders() {
    try {
      setLoading(true);
      setInitializing(true);
      
      // Get providers from storage without password
      const providersJson = await SecureStore.getItemAsync(PROVIDERS_KEY);
      
      if (providersJson) {
        const loadedProviders = JSON.parse(providersJson);
        setProviders(loadedProviders);
      } else {
        // No providers found, set empty array
        setProviders([]);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      Alert.alert(
        'Error', 
        'Failed to load providers. The app will start with an empty list.'
      );
      setProviders([]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }

  async function saveProviders(updatedProviders: S3Provider[]) {
    try {
      const providersJson = JSON.stringify(updatedProviders);
      await SecureStore.setItemAsync(PROVIDERS_KEY, providersJson);
    } catch (error) {
      console.error('Failed to save providers:', error);
      throw new Error('Failed to save providers');
    }
  }

  async function handleAddBucket() {
    setAddBucketError(null);
    try {
      setLoading(true);
      const endpoint = type === 'aws'
        ? `https://s3.${region || 'us-east-1'}.amazonaws.com`
        : `https://${hetznerLocation}.your-objectstorage.com`;
      const providerName = type === 'aws'
        ? `AWS S3 - ${bucketName}`
        : `Hetzner - ${bucketName} (${hetznerLocation})`;
      const newProvider: S3Provider = {
        id: generateId(),
        name: providerName,
        type,
        endpoint,
        accessKey: accessKey.trim(),
        secretKey: secretKey.trim(),
        region: type === 'aws' ? (region.trim() || 'us-east-1') : hetznerLocation,
      };
      // Vérification de la connexion au bucket
      const bucketNameExtracted = extractBucketName(newProvider);
      await listBucketObjects(newProvider, bucketNameExtracted, '', '/');
      // Si pas d'erreur, on ajoute le provider
      const updatedProviders = [...providers, newProvider];
      await saveProviders(updatedProviders);
      setProviders(updatedProviders);
      setIsFormVisible(false);
      // Reset les champs du formulaire
      setBucketName('');
      setType('aws');
      setRegion('');
      setAccessKey('');
      setSecretKey('');
      setHetznerLocation('fsn1');
      Alert.alert('Success', 'S3 provider added successfully');
    } catch (error: any) {
      let message = 'Failed to connect to the bucket.';
      if (error && error.message) {
        if (error.message.includes('AccessDenied')) {
          message = '403 – Mot de passe incorrect ou accès refusé.';
        } else {
          message = error.message;
        }
      }
      setAddBucketError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProvider(providerId: string) {
    try {      
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this S3 connection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                const updatedProviders = providers.filter(
                  provider => provider.id !== providerId
                );
                
                await saveProviders(updatedProviders);
                setProviders(updatedProviders);
                
                if (selectedProvider && selectedProvider.id === providerId) {
                  setSelectedProvider(null);
                }
              } catch (error) {
                console.error('Failed to delete S3 connection:', error);
                Alert.alert('Error', 'Failed to delete S3 connection. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to delete S3 connection:', error);
      Alert.alert('Error', 'Failed to prepare deletion. Please try again.');
    }
  }

  // Render the application content
  const renderContent = () => {
    if (initializing) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.header}>Universal S3 Client</Text>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (selectedProvider) {
      return (
        <ProviderDetails
          provider={selectedProvider}
          onBack={() => setSelectedProvider(null)}
        />
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.header}>Universal S3 Client</Text>
        <ProviderList
          providers={providers}
          onSelect={setSelectedProvider}
          onDelete={handleDeleteProvider}
        />
        <Portal>
          <Modal
            visible={isFormVisible}
            onDismiss={() => setIsFormVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Add New S3 Bucket</Text>
            {addBucketError && (
              <Text style={{ color: 'red', marginBottom: 8, textAlign: 'center' }}>{addBucketError}</Text>
            )}
            <ProviderForm
              bucketName={bucketName}
              setBucketName={setBucketName}
              type={type}
              setType={setType}
              region={region}
              setRegion={setRegion}
              accessKey={accessKey}
              setAccessKey={setAccessKey}
              secretKey={secretKey}
              setSecretKey={setSecretKey}
              hetznerLocation={hetznerLocation}
              setHetznerLocation={setHetznerLocation}
              onSubmit={handleAddBucket}
            />
          </Modal>
        </Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => { setIsFormVisible(true); setAddBucketError(null); }}
          label="Add Bucket"
        />
      </View>
    );
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        {isOffline && (
          <View style={{ backgroundColor: '#ff5252', padding: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Network error : vous êtes hors ligne</Text>
          </View>
        )}
        {renderContent()}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

