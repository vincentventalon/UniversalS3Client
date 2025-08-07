// Importer le polyfill pour crypto.getRandomValues() en premier
import './src/utils/polyfills';

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, Text, Portal, Modal, FAB, Appbar, TextInput, Button } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProviderForm from './src/components/ProviderForm';
import ProviderList from './src/components/ProviderList';
import ProviderDetails from './src/components/ProviderDetails';
import Settings from './src/components/Settings';

import { S3Provider, S3ProviderType } from './src/types';

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { listBucketObjects, extractBucketName } from './src/services/s3Service';
import { generateId } from './src/utils/idGenerator';
import { generateEndpoint, getProviderConfig } from './src/config/providers';
import { 
  getProviders as getProvidersFromStorage, 
  saveProviders as saveProvidersToStorage, 
  migrateFromOldStorage, 
  isPasswordConfigured 
} from './src/services/secureStorage';

// Simple password prompt component
interface PasswordPromptProps {
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

function PasswordPrompt({ onSubmit, onCancel }: PasswordPromptProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <View>
      <Text style={styles.modalTitle}>Enter Password</Text>
      <Text style={{ marginBottom: 16, textAlign: 'center' }}>
        Please enter your password to access stored providers
      </Text>
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoFocus
        style={{ marginBottom: 16 }}
        onSubmitEditing={handleSubmit}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button mode="outlined" onPress={handleCancel} style={{ flex: 1, marginRight: 8 }}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={{ flex: 1, marginLeft: 8 }}>
          Submit
        </Button>
      </View>
    </View>
  );
}

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
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [appPassword, setAppPassword] = useState<string | null>(null);
  const [isPasswordPromptVisible, setIsPasswordPromptVisible] = useState(false);
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Form state
  const [type, setType] = useState<S3ProviderType>('aws');
  const [bucketName, setBucketName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [accountId, setAccountId] = useState('');
  const [namespace, setNamespace] = useState('');
  const [clusterId, setClusterId] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');

  // Initial app setup - load providers immediately
  useEffect(() => {
    loadProviders();
  }, []);

  // Load providers when password becomes available
  useEffect(() => {
    if (appPassword && isPasswordMode) {
      loadProviders();
    }
  }, [appPassword]);

  // Network state monitoring
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
      
      // Check if password is configured
      const passwordConfigured = await isPasswordConfigured();
      
      if (!passwordConfigured) {
        // No password configured yet, start with empty providers list
        setProviders([]);
        setIsPasswordMode(false);
        return;
      }
      
      // Password is configured, but we don't have it yet
      setIsPasswordMode(true);
      
      // Try to migrate from old storage format if needed
      if (appPassword) {
        try {
          const migrated = await migrateFromOldStorage(appPassword);
          if (migrated) {
            console.log('Successfully migrated providers from old storage format');
          }
        } catch (error) {
          console.warn('Migration failed, but continuing with new format:', error);
        }
        
        // Load providers using new storage system
        const loadedProviders = await getProvidersFromStorage(appPassword);
        setProviders(loadedProviders);
      } else {
        // Need password to load providers
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
      if (!appPassword) {
        throw new Error('Password required to save providers');
      }
      await saveProvidersToStorage(updatedProviders, appPassword);
    } catch (error) {
      console.error('Failed to save providers:', error);
      throw new Error('Failed to save providers');
    }
  }

  function promptForPassword(action?: () => Promise<void>) {
    setPendingAction(action || null);
    setIsPasswordPromptVisible(true);
  }

  async function handlePasswordSubmit(password: string) {
    try {
      setAppPassword(password);
      setIsPasswordPromptVisible(false);
      
      if (pendingAction) {
        await pendingAction();
        setPendingAction(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid password or failed to perform action');
    }
  }

  function handlePasswordCancel() {
    setIsPasswordPromptVisible(false);
    setPendingAction(null);
  }

  async function handleAddBucket() {
    if (!appPassword && isPasswordMode) {
      promptForPassword(() => handleAddBucket());
      return;
    }

    setAddBucketError(null);
    try {
      setLoading(true);
      
      const config = getProviderConfig(type);
      const endpoint = generateEndpoint(type, region, accountId, namespace, clusterId, customEndpoint);
      const providerName = `${config.name} - ${bucketName}`;
      
      const newProvider: S3Provider = {
        id: generateId(),
        name: providerName,
        type,
        endpoint,
        accessKey: accessKey.trim(),
        secretKey: secretKey.trim(),
        region: region.trim() || undefined,
        accountId: accountId.trim() || undefined,
        namespace: namespace.trim() || undefined,
        // locationHint field removed - not used in current implementation
        clusterId: clusterId.trim() || undefined,
        customEndpoint: customEndpoint.trim() || undefined,
      };
      
      // Test connection to the bucket
      const bucketNameExtracted = extractBucketName(newProvider);
      await listBucketObjects(newProvider, bucketNameExtracted, '', '/');
      
      // If no error, add the provider
      const updatedProviders = [...providers, newProvider];
      await saveProviders(updatedProviders);
      setProviders(updatedProviders);
      setIsFormVisible(false);
      
      // Reset form fields
      resetFormFields();
      
      Alert.alert('Success', 'S3 provider added successfully');
    } catch (error: any) {
      let message = 'Failed to connect to the bucket.';
      if (error && error.message) {
        if (error.message.includes('AccessDenied')) {
          message = '403 – Incorrect credentials or access denied.';
        } else {
          message = error.message;
        }
      }
      setAddBucketError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetFormFields() {
    setBucketName('');
    setType('aws');
    setRegion('us-east-1');
    setAccessKey('');
    setSecretKey('');
    setAccountId('');
    setNamespace('');
    setClusterId('');
    setCustomEndpoint('');
  }

  async function handleDeleteProvider(providerId: string) {
    if (!appPassword && isPasswordMode) {
      promptForPassword(() => handleDeleteProvider(providerId));
      return;
    }

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

    if (isSettingsVisible) {
      return (
        <View style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
          <Settings
            onBack={() => setIsSettingsVisible(false)}
            appVersion="1.1.1"
          />
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
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Universal S3 Client</Text>
          <Appbar.Action 
            icon="cog" 
            onPress={() => setIsSettingsVisible(true)}
            style={styles.settingsIcon}
            accessibilityLabel="Settings"
          />
        </View>
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
              accountId={accountId}
              setAccountId={setAccountId}
              namespace={namespace}
              setNamespace={setNamespace}

              clusterId={clusterId}
              setClusterId={setClusterId}
              customEndpoint={customEndpoint}
              setCustomEndpoint={setCustomEndpoint}
              onSubmit={handleAddBucket}
            />
          </Modal>
        </Portal>

        {/* Password Prompt Modal */}
        <Portal>
          <Modal 
            visible={isPasswordPromptVisible} 
            onDismiss={handlePasswordCancel}
            contentContainerStyle={styles.modalContainer}
          >
            <PasswordPrompt
              onSubmit={handlePasswordSubmit}
              onCancel={handlePasswordCancel}
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
    <SafeAreaProvider>
      <PaperProvider>
        {isSettingsVisible ? (
          <View style={styles.fullScreen}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
            {renderContent()}
          </View>
        ) : (
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            {isOffline && (
              <View style={{ backgroundColor: '#ff5252', padding: 8 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Network error: you are offline</Text>
              </View>
            )}
            {renderContent()}
          </SafeAreaView>
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  settingsIcon: {
    position: 'absolute',
    right: 0,
    top: -8,
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

