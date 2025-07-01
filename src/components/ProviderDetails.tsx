import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { 
  Card, 
  Text, 
  IconButton, 
  Divider, 
  ActivityIndicator, 
  Button,
  List,
  Portal,
  Modal,
  FAB,
  TextInput,
  Menu,
  ProgressBar,
  Checkbox
} from 'react-native-paper';
import { S3Provider, S3Object } from '../types';
import { listBucketObjects, getObjectUrl, createEmptyObject, uploadFile, deleteObject, deleteFolder } from '../services/s3Service';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ObjectDetails from './ObjectDetails';
import ProviderForm from './ProviderForm';

interface ProviderDetailsProps {
  provider: S3Provider;
  onBack: () => void;
}

function ProviderDetails({ provider, onBack }: ProviderDetailsProps) {
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [itemToDelete, setItemToDelete] = useState<S3Object | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editProvider, setEditProvider] = useState<S3Provider | null>(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Extract bucket name from provider
  const bucketName = extractBucketName(provider);

  useEffect(() => {
    loadBucketObjects();
  }, [provider, currentPath]);

  function extractBucketName(provider: S3Provider): string {
    try {
      // Standard extraction from provider name format
      const nameMatch = provider.name.match(/- ([^(]+)(?:\s|$)/);
      if (nameMatch && nameMatch[1]) {
        // For Hetzner, we need to use lowercase bucket names
        if (provider.type === 'hetzner') {
          return nameMatch[1].trim().toLowerCase();
        }
        return nameMatch[1].trim();
      }
      
      // If we're using Hetzner, try to parse the endpoint
      if (provider.type === 'hetzner') {
        return `mybucket-${Date.now().toString(36)}`.toLowerCase();
      }
      
      // Fallback for AWS
      return 'default-bucket';
    } catch (e) {
      console.error('Error extracting bucket name:', e);
      return 'default-bucket';
    }
  }

  async function loadBucketObjects() {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading objects for bucket: ${bucketName} with prefix: ${currentPath}`);
      
      try {
        const bucketContents = await listBucketObjects(
          provider,
          bucketName,
          currentPath
        );
        
        setObjects(bucketContents);
      } catch (loadError) {
        console.error('Error loading bucket contents:', loadError);
        // Provide a more descriptive error message
        if (loadError instanceof Error) {
          if (loadError.message.includes('AccessDenied') || loadError.message.includes('403')) {
            setError('403 – Mot de passe incorrect');
          } else if (loadError.message.includes('NoSuchBucket')) {
            setError(`Bucket "${bucketName}" does not exist. Please check the bucket name.`);
          } else if (loadError.message.toLowerCase().includes('network') || loadError.message.toLowerCase().includes('offline')) {
            setError('Network error : vous êtes hors ligne');
          } else {
            setError(loadError.message);
          }
        } else {
          setError('Network error : vous êtes hors ligne');
        }
      }
    } catch (err) {
      console.error('Failed to load bucket objects:', err);
      setError(typeof err === 'string' ? err : (err instanceof Error ? err.message : 'Failed to load bucket objects. Please check your provider configuration.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadBucketObjects();
  }

  function getProviderTypeDisplay() {
    return provider.type === 'aws' ? 'AWS S3' : 'Hetzner Storage';
  }

  function navigateToFolder(folderObject: S3Object) {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(folderObject.key);
  }

  function navigateBack() {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setCurrentPath(previousPath);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderPathBreadcrumb() {
    return (
      <View style={styles.breadcrumb}>
        <TouchableOpacity 
          onPress={() => {
            setPathHistory([]);
            setCurrentPath('');
          }}
          style={styles.breadcrumbItem}
        >
          <Text style={styles.breadcrumbText}>Root</Text>
        </TouchableOpacity>
        
        {currentPath && (
          <>
            <Text style={styles.breadcrumbSeparator}>/</Text>
            <Text style={styles.breadcrumbCurrent} numberOfLines={1} ellipsizeMode="middle">
              {currentPath}
            </Text>
          </>
        )}
      </View>
    );
  }

  function renderItem({ item }: { item: S3Object }) {
    return (
      <List.Item
        title={item.name}
        description={
          item.isFolder 
            ? 'Folder' 
            : `${formatSize(item.size)} • ${formatDate(item.lastModified)}`
        }
        left={props => (
          isMultiSelect ? (
            <Checkbox
              status={selectedKeys.includes(item.key) ? 'checked' : 'unchecked'}
              onPress={() => {
                setSelectedKeys(keys =>
                  keys.includes(item.key)
                    ? keys.filter(k => k !== item.key)
                    : [...keys, item.key]
                );
              }}
            />
          ) : (
            <List.Icon {...props} icon={item.isFolder ? 'folder' : 'file'} color={item.isFolder ? '#FFC107' : '#2196F3'} />
          )
        )}
        right={props => (
          !isMultiSelect && (
            <IconButton
              {...props}
              icon="delete"
              iconColor="#FF5252"
              size={20}
              onPress={() => {
                setItemToDelete(item);
                setIsDeleteModalVisible(true);
              }}
            />
          )
        )}
        onPress={() => {
          if (isMultiSelect) {
            setSelectedKeys(keys =>
              keys.includes(item.key)
                ? keys.filter(k => k !== item.key)
                : [...keys, item.key]
            );
          } else {
            item.isFolder ? navigateToFolder(item) : setSelectedObject(item);
          }
        }}
        style={styles.listItem}
      />
    );
  }

  function openBucketInBrowser() {
    const url = provider.type === 'hetzner'
      ? `https://${bucketName}.${provider.region}.your-objectstorage.com/`
      : `https://${bucketName}.s3.${provider.region || 'us-east-1'}.amazonaws.com/`;
      
    Alert.alert(
      'Open Bucket',
      `Opening bucket URL: ${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => Linking.openURL(url).catch(err => {
            console.error('Error opening URL:', err);
            Alert.alert('Error', 'Could not open the URL');
          })
        },
      ]
    );
  }

  // Render the error card with access debugging info
  function renderErrorCard() {
    let displayError = error;
    if (error) {
      if (error.toLowerCase().includes('network')) {
        displayError = 'Network error : vous êtes hors ligne';
      } else if (error.includes('403')) {
        displayError = '403 – Mot de passe incorrect';
      }
    }
    return (
      <Card style={styles.errorCard}>
        <Card.Content style={styles.errorContent}>
          <Text style={styles.errorText}>{displayError}</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Information:</Text>
            <Text>Provider Type: {provider.type}</Text>
            <Text>Bucket Name: {bucketName}</Text>
            <Text>Endpoint: {provider.endpoint}</Text>
            <Text>Region: {provider.region}</Text>
            {currentPath ? <Text>Current Path: {currentPath}</Text> : null}
          </View>
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              onPress={loadBucketObjects} 
              style={styles.retryButton}
            >
              Retry
            </Button>
            <Button
              mode="outlined"
              onPress={openBucketInBrowser}
              style={styles.browseButton}
            >
              Open in Browser
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      // Just update the UI to show the new virtual folder
      const folderKey = currentPath ? `${currentPath}${newFolderName}/` : `${newFolderName}/`;
      
      // Add the virtual folder to the current objects list
      setObjects(prevObjects => [
        ...prevObjects,
        {
          key: folderKey,
          name: newFolderName,
          lastModified: new Date(),
          size: 0,
          isFolder: true,
          fullPath: folderKey
        }
      ]);

      setIsCreateFolderModalOpen(false);
      setNewFolderName('');
      
    } catch (error) {
      console.error('Failed to create folder:', error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    }
  }

  async function handleFileUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        return;
      }

      await uploadSelectedFile(result.assets[0]);
    } catch (err) {
      console.error('File selection error:', err);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  }

  async function handlePhotoUpload() {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      await uploadSelectedFile({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || `photo-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        size: 0, // Size will be determined when reading the file
      });
    } catch (err) {
      console.error('Photo selection error:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  }

  async function uploadSelectedFile(file: DocumentPicker.DocumentPickerAsset) {
    if (!file || !bucketName) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Construct the full path by combining current path and file name
      const fullPath = currentPath ? `${currentPath}${file.name}` : file.name;

      await uploadFile(
        provider,
        bucketName,
        fullPath,
        file.uri,
        (progress) => setUploadProgress(progress)
      );

      // Refresh the file list after successful upload
      await loadBucketObjects();
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert('Success', 'File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert('Error', 'Failed to upload file');
    }
  }

  function renderActionButton() {
    return (
      <Portal>
        <FAB.Group
          open={isMenuVisible}
          visible
          icon={isMenuVisible ? 'close' : 'plus'}
          actions={[
            {
              icon: 'folder-plus',
              label: 'Create Folder',
              onPress: () => setIsCreateFolderModalOpen(true),
            },
            {
              icon: 'file-upload',
              label: 'Upload File',
              onPress: handleFileUpload,
            },
            {
              icon: 'image',
              label: 'Upload Photo',
              onPress: handlePhotoUpload,
            },
          ]}
          onStateChange={({ open }) => setIsMenuVisible(open)}
          onPress={() => {
            if (isMenuVisible) {
              setIsMenuVisible(false);
            }
          }}
        />
      </Portal>
    );
  }

  function renderCreateFolderModal() {
    return (
      <Portal>
        <Modal
          visible={isCreateFolderModalOpen}
          onDismiss={() => {
            setIsCreateFolderModalOpen(false);
            setNewFolderName('');
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text style={styles.modalTitle}>Create New Folder</Text>
              <TextInput
                mode="outlined"
                label="Folder name"
                value={newFolderName}
                onChangeText={setNewFolderName}
                style={styles.input}
                placeholder="enter folder name"
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsCreateFolderModalOpen(false);
                    setNewFolderName('');
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateFolder}
                  style={styles.modalButton}
                >
                  Create
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  }

  function renderUploadProgress() {
    if (!isUploading) return null;

    return (
      <Portal>
        <Modal
          visible={true}
          dismissable={false}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text style={styles.modalTitle}>Uploading File...</Text>
              <ProgressBar progress={uploadProgress / 100} color="#2196F3" style={styles.progressBar} />
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  }

  async function handleDelete() {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      if (itemToDelete.isFolder) {
        await deleteFolder(provider, bucketName, itemToDelete.key);
      } else {
        await deleteObject(provider, bucketName, itemToDelete.key);
      }
      await loadBucketObjects(); // Refresh the list
      setIsDeleteModalVisible(false);
      setItemToDelete(null);
      Alert.alert('Success', `${itemToDelete.isFolder ? 'Folder' : 'File'} deleted successfully`);
    } catch (error) {
      console.error('Error deleting object:', error);
      Alert.alert('Error', `Failed to delete ${itemToDelete.isFolder ? 'folder' : 'file'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  function renderDeleteConfirmationModal() {
    if (!itemToDelete) return null;

    return (
      <Portal>
        <Modal
          visible={isDeleteModalVisible}
          onDismiss={() => {
            setIsDeleteModalVisible(false);
            setItemToDelete(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text style={styles.modalTitle}>Confirm Delete</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete {itemToDelete.isFolder ? 'folder' : 'file'}:{' '}
                <Text style={styles.highlightText}>{itemToDelete.name}</Text>?
                {itemToDelete.isFolder && (
                  '\nWarning: This will delete all contents inside the folder.'
                )}
              </Text>
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsDeleteModalVisible(false);
                    setItemToDelete(null);
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleDelete}
                  style={[styles.modalButton, styles.deleteButton]}
                  textColor="white"
                >
                  Delete
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  }

  function handleEditProvider() {
    setIsEditModalVisible(false);
    setEditProvider(null);
    // TODO: Sauvegarder la modification dans la liste globale (remonter via callback ou context)
    Alert.alert('Succès', 'Bucket mis à jour.');
  }

  async function handleDeleteSelected() {
    if (selectedKeys.length === 0) return;
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer ${selectedKeys.length} objet(s) sélectionné(s) ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              for (const key of selectedKeys) {
                await deleteObject(provider, bucketName, key);
              }
              setSelectedKeys([]);
              setIsMultiSelect(false);
              await loadBucketObjects();
              Alert.alert('Succès', 'Objets supprimés');
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  if (selectedObject) {
    return (
      <ObjectDetails
        provider={provider}
        bucketName={bucketName}
        object={selectedObject}
        onBack={() => setSelectedObject(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={pathHistory.length > 0 ? navigateBack : undefined}
          disabled={pathHistory.length === 0}
          style={styles.backButton} 
        />
        <Text style={styles.headerTitle}>{provider.name}</Text>
        <IconButton
          icon="home"
          size={22}
          onPress={onBack}
          style={styles.homeButton}
        />
        <Button
          mode={isMultiSelect ? 'contained' : 'outlined'}
          onPress={() => {
            setIsMultiSelect(v => !v);
            setSelectedKeys([]);
          }}
          style={{ marginLeft: 8 }}
        >
          {isMultiSelect ? 'Annuler sélection' : 'Sélection multiple'}
        </Button>
        {isMultiSelect && (
          <Button
            mode="contained"
            onPress={handleDeleteSelected}
            disabled={selectedKeys.length === 0}
            style={{ marginLeft: 8, backgroundColor: '#FF5252' }}
          >
            Supprimer la sélection
          </Button>
        )}
      </View>
      
      <Card style={styles.providerInfoCard}>
        <Card.Content>
          <Text style={styles.providerType}>
            {getProviderTypeDisplay()}
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bucket:</Text>
            <Text style={styles.infoValue}>{bucketName}</Text>
          </View>

          {provider.type === 'aws' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Region:</Text>
              <Text style={styles.infoValue}>{provider.region}</Text>
            </View>
          )}

          {provider.type === 'hetzner' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{provider.region}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Endpoint:</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
              {provider.endpoint}
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.bucketContentHeader}>
        <Text style={styles.sectionTitle}>Bucket Contents</Text>
        
        {currentPath && (
          <IconButton 
            icon="arrow-up" 
            size={24} 
            onPress={navigateBack}
            style={styles.upButton}
          />
        )}
      </View>
      
      {renderPathBreadcrumb()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading bucket contents...</Text>
        </View>
      ) : error ? (
        renderErrorCard()
      ) : objects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text style={styles.emptyText}>This folder is empty</Text>
            {currentPath ? (
              <Text style={styles.emptySubtext}>
                Upload files to this folder or navigate to a different folder
              </Text>
            ) : (
              <Text style={styles.emptySubtext}>
                Your bucket appears to be empty. Upload files to see them here.
              </Text>
            )}
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={objects}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      
      {renderCreateFolderModal()}
      {renderUploadProgress()}
      {renderActionButton()}
      {renderDeleteConfirmationModal()}
      <Portal>
        <Modal
          visible={isEditModalVisible}
          onDismiss={() => setIsEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Modifier le bucket</Text>
          {editProvider && (
            <ProviderForm
              bucketName={extractBucketName(editProvider)}
              setBucketName={() => {}}
              type={editProvider.type}
              setType={() => {}}
              region={editProvider.region || ''}
              setRegion={() => {}}
              accessKey={editProvider.accessKey}
              setAccessKey={() => {}}
              secretKey={editProvider.secretKey}
              setSecretKey={() => {}}
              hetznerLocation={editProvider.region || 'fsn1'}
              setHetznerLocation={() => {}}
              onSubmit={handleEditProvider}
            />
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  providerInfoCard: {
    marginBottom: 16,
  },
  providerType: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  infoLabel: {
    fontWeight: '500',
    marginRight: 4,
    width: 80,
  },
  infoValue: {
    flex: 1,
  },
  bucketContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  upButton: {
    margin: 0,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    padding: 4,
  },
  breadcrumbText: {
    color: '#2196F3',
  },
  breadcrumbSeparator: {
    marginHorizontal: 4,
    opacity: 0.5,
  },
  breadcrumbCurrent: {
    fontWeight: '500',
    flex: 1,
  },
  list: {
    paddingBottom: 16,
  },
  listItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
  errorCard: {
    marginTop: 16,
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    flex: 1,
    marginRight: 8,
  },
  emptyCard: {
    marginTop: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  browseButton: {
    flex: 1,
    marginLeft: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  progressBar: {
    marginVertical: 16,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
  },
  modalText: {
    marginBottom: 20,
    lineHeight: 20,
  },
  highlightText: {
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  homeButton: {
    marginLeft: 8,
  },
});

export default ProviderDetails; 