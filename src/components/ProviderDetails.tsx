import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { 
  Card, 
  Text, 
  IconButton, 
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
import { listBucketObjects, getObjectUrl, createEmptyObject, uploadFile, deleteObject, deleteFolder, copyFolder, renameFolder, copyFile, renameFile, copyFileCrossBucket, copyFolderCrossBucket, moveFileCrossBucket, moveFolderCrossBucket } from '../services/s3Service';
import { useClipboard } from '../context/ClipboardContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ObjectDetails from './ObjectDetails';
import ProviderForm from './ProviderForm';
import { ImageThumbnail } from './ImageThumbnail';
import { isImageFile } from '../utils/fileUtils';
import { GridView } from './GridView';

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
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  
  // États pour la vue (liste ou grille)
  const [viewMode, setViewMode] = useState<'list' | 'grid2' | 'grid3'>('list');
  const [showTitlesInGrid, setShowTitlesInGrid] = useState(true);
  
  // Use global clipboard context for cross-bucket functionality
  const { clipboardData, setClipboardData, clearClipboard, hasClipboardData } = useClipboard();
  
  // États pour la copie et le renommage
  const [copiedItem, setCopiedItem] = useState<S3Object | null>(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [itemToRename, setItemToRename] = useState<S3Object | null>(null);
  const [newItemNameForRename, setNewItemNameForRename] = useState('');

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
    // Créer un tableau des segments du chemin
    const pathSegments = currentPath ? currentPath.split('/').filter(segment => segment !== '') : [];
    
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
        
        {pathSegments.map((segment, index) => {
          // Calculer le chemin jusqu'à ce segment
          const pathToSegment = pathSegments.slice(0, index + 1).join('/') + '/';
          
          return (
            <React.Fragment key={index}>
              <Text style={styles.breadcrumbSeparator}>/</Text>
              <TouchableOpacity 
                onPress={() => {
                  // Naviguer vers ce segment du chemin
                  const newPathHistory = [];
                  let tempPath = '';
                  
                  // Reconstruire l'historique jusqu'à ce segment
                  for (let i = 0; i < index; i++) {
                    newPathHistory.push(tempPath);
                    tempPath = tempPath ? `${tempPath}${pathSegments[i]}/` : `${pathSegments[i]}/`;
                  }
                  
                  setPathHistory(newPathHistory);
                  setCurrentPath(pathToSegment);
                }}
                style={styles.breadcrumbItem}
              >
                <Text style={[
                  styles.breadcrumbText,
                  index === pathSegments.length - 1 && styles.breadcrumbCurrent
                ]}>
                  {segment}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  function handleItemPress(item: S3Object) {
    if (isMultiSelect) {
      handleItemSelect(item);
    } else {
      item.isFolder ? navigateToFolder(item) : setSelectedObject(item);
    }
  }

  function handleItemSelect(item: S3Object) {
    setSelectedKeys(keys => {
      const newKeys = keys.includes(item.key)
        ? keys.filter(k => k !== item.key)
        : [...keys, item.key];
      console.log(`Item selection toggled for ${item.key}. New selected keys:`, newKeys);
      return newKeys;
    });
  }

  async function copyCurrentPath() {
    try {
      // Format the path - remove trailing slash and handle root directory
      const cleanPath = currentPath.replace(/\/$/, '');
      const fullPath = cleanPath 
        ? `s3://${bucketName}/${cleanPath}/`
        : `s3://${bucketName}/`;
      
      await Clipboard.setStringAsync(fullPath);
      Alert.alert(
        'Path Copied', 
        `Current folder path copied to clipboard:\n${fullPath}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to copy path:', error);
      Alert.alert('Error', 'Failed to copy path to clipboard');
    }
  }

  function renderItem({ item }: { item: S3Object }) {
    // Check if this item is currently cut (in clipboard for move operation)
    const isItemCut = clipboardData?.operation === 'cut' && 
                      clipboardData?.item.key === item.key &&
                      clipboardData?.sourceProvider.id === provider.id &&
                      clipboardData?.sourceBucket === bucketName;
    
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
              onPress={() => handleItemSelect(item)}
            />
          ) : (
            // Show image thumbnail for image files, otherwise show generic icon
            item.isFolder ? (
              <List.Icon {...props} icon="folder" color="#FFC107" />
            ) : isImageFile(item.name) ? (
              <ImageThumbnail 
                item={item} 
                provider={provider} 
                bucketName={bucketName}
                color="#2196F3" 
                size={24} 
              />
            ) : (
              <List.Icon {...props} icon="file" color="#2196F3" />
            )
          )
        )}
        right={props => (
          !isMultiSelect && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                {...props}
                icon="pencil"
                iconColor="#2196F3"
                size={16}
                onPress={() => openRenameModal(item)}
                style={{ marginHorizontal: 0 }}
              />
              <IconButton
                {...props}
                icon="content-copy"
                iconColor="#FF9800"
                size={16}
                onPress={() => handleCopyItem(item)}
                style={{ marginHorizontal: 0 }}
              />
              <IconButton
                {...props}
                icon="content-cut"
                iconColor="#9C27B0"
                size={16}
                onPress={() => handleCutItem(item)}
                style={{ marginHorizontal: 0 }}
              />
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
            </View>
          )
        )}
        onPress={() => handleItemPress(item)}
        style={[styles.listItem, isItemCut && styles.cutItem]}
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

  // Fonctions pour la copie et le renommage d'éléments (dossiers et fichiers)
  function handleCopyItem(item: S3Object) {
    // Set both local and global clipboard for cross-bucket functionality
    setCopiedItem(item);
    setClipboardData({
      item,
      sourceProvider: provider,
      sourceBucket: bucketName,
      operation: 'copy'
    });
    
    const itemType = item.isFolder ? 'dossier' : 'fichier';
    Alert.alert(
      `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} copié`, 
      `Le ${itemType} "${item.name}" a été copié et peut être collé dans n'importe quel bucket.`
    );
  }

  function handleCutItem(item: S3Object) {
    // Clear local clipboard and set global clipboard for cut operation
    setCopiedItem(null);
    setClipboardData({
      item,
      sourceProvider: provider,
      sourceBucket: bucketName,
      operation: 'cut'
    });
    
    const itemType = item.isFolder ? 'dossier' : 'fichier';
    Alert.alert(
      `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} coupé`, 
      `Le ${itemType} "${item.name}" a été coupé et peut être déplacé vers n'importe quel bucket.`
    );
  }

  async function handlePasteItem() {
    // Priority: global clipboard data over local copied item
    const itemToPaste = clipboardData?.item || copiedItem;
    if (!itemToPaste) return;

    const itemType = itemToPaste.isFolder ? 'dossier' : 'fichier';
    const newItemName = `${itemToPaste.name}_copy`;
    
    let targetKey: string;
    if (itemToPaste.isFolder) {
      targetKey = currentPath ? `${currentPath}${newItemName}/` : `${newItemName}/`;
    } else {
      // For files, preserve the extension
      const lastDotIndex = itemToPaste.name.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        const nameWithoutExt = itemToPaste.name.substring(0, lastDotIndex);
        const extension = itemToPaste.name.substring(lastDotIndex);
        const newFileName = `${nameWithoutExt}_copy${extension}`;
        targetKey = currentPath ? `${currentPath}${newFileName}` : newFileName;
      } else {
        targetKey = currentPath ? `${currentPath}${newItemName}` : newItemName;
      }
    }

    try {
      setLoading(true);
      
      // Check if it's a cross-bucket operation
      if (clipboardData && 
          (clipboardData.sourceProvider.id !== provider.id || 
           clipboardData.sourceBucket !== bucketName)) {
        
        // Cross-bucket operation
        const sourceProvider = clipboardData.sourceProvider;
        const sourceBucket = clipboardData.sourceBucket;
        
        if (itemToPaste.isFolder) {
          if (clipboardData.operation === 'copy') {
            await copyFolderCrossBucket(
              sourceProvider,
              sourceBucket,
              itemToPaste.key,
              provider,
              bucketName,
              targetKey
            );
          } else {
            await moveFolderCrossBucket(
              sourceProvider,
              sourceBucket,
              itemToPaste.key,
              provider,
              bucketName,
              targetKey
            );
          }
        } else {
          if (clipboardData.operation === 'copy') {
            await copyFileCrossBucket(
              sourceProvider,
              sourceBucket,
              itemToPaste.key,
              provider,
              bucketName,
              targetKey
            );
          } else {
            await moveFileCrossBucket(
              sourceProvider,
              sourceBucket,
              itemToPaste.key,
              provider,
              bucketName,
              targetKey
            );
          }
        }
        
        // Clear global clipboard after cross-bucket operation
        clearClipboard();
        
        const operation = clipboardData.operation === 'copy' ? 'copié' : 'déplacé';
        const sourceInfo = `depuis ${sourceProvider.name}`;
        Alert.alert('Succès', `Le ${itemType} "${itemToPaste.name}" a été ${operation} ${sourceInfo} avec succès.`);
        
      } else {
        // Local operation (same bucket) - use existing logic
        if (itemToPaste.isFolder) {
          await copyFolder(provider, bucketName, itemToPaste.key, targetKey);
        } else {
          await copyFile(provider, bucketName, itemToPaste.key, targetKey);
        }
        
        Alert.alert('Succès', `Le ${itemType} "${itemToPaste.name}" a été collé avec succès.`);
        setCopiedItem(null);
      }
      
      // Rafraîchir la liste des objets
      await loadBucketObjects();
      
    } catch (error) {
      console.error(`Failed to paste ${itemType}:`, error);
      Alert.alert('Erreur', `Impossible de coller le ${itemType}. Veuillez réessayer.`);
    } finally {
      setLoading(false);
    }
  }

  function openRenameModal(item: S3Object) {
    setItemToRename(item);
    setNewItemNameForRename(item.name);
    setIsRenameModalVisible(true);
  }

  async function handleRenameItem() {
    if (!itemToRename || !newItemNameForRename.trim()) {
      const itemType = itemToRename?.isFolder ? 'dossier' : 'fichier';
      Alert.alert('Erreur', `Veuillez entrer un nom de ${itemType} valide`);
      return;
    }

    if (newItemNameForRename === itemToRename.name) {
      setIsRenameModalVisible(false);
      return;
    }

    try {
      setLoading(true);
      
      const oldKey = itemToRename.key;
      let newKey: string;
      const itemType = itemToRename.isFolder ? 'dossier' : 'fichier';
      
      if (itemToRename.isFolder) {
        newKey = currentPath 
          ? `${currentPath}${newItemNameForRename}/`
          : `${newItemNameForRename}/`;
        await renameFolder(provider, bucketName, oldKey, newKey);
      } else {
        newKey = currentPath 
          ? `${currentPath}${newItemNameForRename}`
          : newItemNameForRename;
        await renameFile(provider, bucketName, oldKey, newKey);
      }
      
      // Rafraîchir la liste des objets
      await loadBucketObjects();
      
      Alert.alert('Succès', `Le ${itemType} a été renommé en "${newItemNameForRename}".`);
      setIsRenameModalVisible(false);
      setItemToRename(null);
      setNewItemNameForRename('');
    } catch (error) {
      const itemType = itemToRename?.isFolder ? 'dossier' : 'fichier';
      console.error(`Failed to rename ${itemType}:`, error);
      Alert.alert('Erreur', `Impossible de renommer le ${itemType}. Veuillez réessayer.`);
    } finally {
      setLoading(false);
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
    const actions = [
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
    ];

    // Add paste option if an item has been copied (local or cross-bucket)
    const itemToPaste = clipboardData?.item || copiedItem;
    if (itemToPaste) {
      const itemType = itemToPaste.isFolder ? 'folder' : 'file';
      const isCrossBucket = clipboardData && 
        (clipboardData.sourceProvider.id !== provider.id || 
         clipboardData.sourceBucket !== bucketName);
      
      const operation = clipboardData?.operation === 'cut' ? 'Move' : 'Paste';
      const sourceInfo = isCrossBucket ? ` from ${clipboardData!.sourceProvider.name}` : '';
      
      actions.unshift({
        icon: clipboardData?.operation === 'cut' ? 'content-cut' : 'content-paste',
        label: `${operation} "${itemToPaste.name}" (${itemType})${sourceInfo}`,
        onPress: handlePasteItem,
      });
    }

    return (
      <Portal>
        <FAB.Group
          open={isMenuVisible}
          visible
          icon={isMenuVisible ? 'close' : 'plus'}
          actions={actions}
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

  function renderRenameModal() {
    const itemType = itemToRename?.isFolder ? 'Folder' : 'File';
    return (
      <Portal>
        <Modal
          visible={isRenameModalVisible}
          onDismiss={() => {
            setIsRenameModalVisible(false);
            setItemToRename(null);
            setNewItemNameForRename('');
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text style={styles.modalTitle}>Rename {itemType}</Text>
              <TextInput
                mode="outlined"
                label="New Name"
                value={newItemNameForRename}
                onChangeText={setNewItemNameForRename}
                style={styles.input}
                placeholder="Enter the new name"
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsRenameModalVisible(false);
                    setItemToRename(null);
                    setNewItemNameForRename('');
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleRenameItem}
                  style={styles.modalButton}
                >
                  Rename
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



  async function handleDeleteSelected() {
    if (selectedKeys.length === 0) return;
    Alert.alert(
      'Confirm Deletion',
      `Delete ${selectedKeys.length} selected object(s)? This action is irreversible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            let deletedCount = 0;
            let failedCount = 0;
            
            try {
              console.log(`Starting deletion of ${selectedKeys.length} selected items:`, selectedKeys);
              
              for (const key of selectedKeys) {
                try {
                  // Find the object in our current objects list to determine if it's a folder
                  const objectToDelete = objects.find(obj => obj.key === key);
                  console.log(`Deleting object ${key}, isFolder: ${objectToDelete?.isFolder}`);
                  
                  if (objectToDelete?.isFolder) {
                    await deleteFolder(provider, bucketName, key);
                    console.log(`Successfully deleted folder: ${key}`);
                  } else {
                    await deleteObject(provider, bucketName, key);
                    console.log(`Successfully deleted file: ${key}`);
                  }
                  deletedCount++;
                } catch (error) {
                  console.error(`Error deleting object ${key}:`, error);
                  failedCount++;
                }
              }
              
              // Always clear selection and reload, even if some deletions failed
              setSelectedKeys([]);
              setIsMultiSelect(false);
              await loadBucketObjects();
              
              if (failedCount === 0) {
                Alert.alert('Success', `${deletedCount} object(s) deleted`);
              } else if (deletedCount > 0) {
                Alert.alert(
                  'Partially Successful', 
                  `${deletedCount} object(s) deleted, ${failedCount} failed`
                );
              } else {
                Alert.alert('Error', 'No objects could be deleted');
              }
            } catch (error) {
              console.error('Error during batch deletion:', error);
              // Still clear selection and reload on general error
              setSelectedKeys([]);
              setIsMultiSelect(false);
              await loadBucketObjects();
              Alert.alert('Error', 'Error during multiple deletion');
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
        <Text style={styles.headerTitle}>{bucketName}</Text>
        <IconButton
          icon="home"
          size={22}
          onPress={onBack}
          style={styles.homeButton}
        />
        <Button
          mode={isMultiSelect ? 'contained' : 'outlined'}
          onPress={() => {
            console.log(`Multi-select toggled. Was: ${isMultiSelect}, now will be: ${!isMultiSelect}`);
            setIsMultiSelect(v => !v);
            setSelectedKeys([]);
            console.log('Selected keys cleared');
          }}
          style={{ marginLeft: 8 }}
        >
          {isMultiSelect ? 'Cancel Selection' : 'Multiple Selection'}
        </Button>
        {isMultiSelect && (
          <Button
            mode="contained"
            onPress={() => {
              console.log(`Delete button pressed with ${selectedKeys.length} selected items:`, selectedKeys);
              handleDeleteSelected();
            }}
            disabled={selectedKeys.length === 0}
            style={{ marginLeft: 8, backgroundColor: '#FF5252' }}
          >
            Delete Selection ({selectedKeys.length})
          </Button>
        )}
      </View>
      
      <View style={styles.bucketContentHeader}>
        <View style={styles.headerRightActions}>
          {/* Copy current path button */}
          <IconButton
            icon="content-copy"
            size={20}
            onPress={copyCurrentPath}
            style={styles.copyPathButton}
          />
          
          {/* View mode toggle buttons */}
          <IconButton
            icon="view-list"
            size={20}
            selected={viewMode === 'list'}
            onPress={() => setViewMode('list')}
            style={[styles.viewToggleButton, viewMode === 'list' && styles.selectedViewButton]}
          />
          <IconButton
            icon="view-grid"
            size={20}
            selected={viewMode === 'grid2'}
            onPress={() => setViewMode('grid2')}
            style={[styles.viewToggleButton, viewMode === 'grid2' && styles.selectedViewButton]}
          />
          <IconButton
            icon="apps"
            size={20}
            selected={viewMode === 'grid3'}
            onPress={() => setViewMode('grid3')}
            style={[styles.viewToggleButton, viewMode === 'grid3' && styles.selectedViewButton]}
          />
          
          {/* Title visibility toggle for grid view */}
          {(viewMode === 'grid2' || viewMode === 'grid3') && (
            <IconButton
              icon={showTitlesInGrid ? "eye" : "eye-off"}
              size={20}
              onPress={() => setShowTitlesInGrid(!showTitlesInGrid)}
              style={styles.titleToggleButton}
            />
          )}
          
          {currentPath && (
            <IconButton 
              icon="arrow-up" 
              size={24} 
              onPress={navigateBack}
              style={styles.upButton}
            />
          )}
        </View>
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
        viewMode === 'list' ? (
          <FlatList
            data={objects}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <GridView
            data={objects}
            provider={provider}
            bucketName={bucketName}
            selectedKeys={selectedKeys}
            isMultiSelect={isMultiSelect}
            viewMode={viewMode}
            showTitles={showTitlesInGrid}
            refreshing={refreshing}
            onItemPress={handleItemPress}
            onItemSelect={handleItemSelect}
            onRefresh={handleRefresh}
          />
        )
      )}
      
      {renderCreateFolderModal()}
      {renderRenameModal()}
      {renderUploadProgress()}
      {renderActionButton()}
      {renderDeleteConfirmationModal()}

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
  bucketContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggleButton: {
    margin: 0,
    marginHorizontal: 2,
  },
  selectedViewButton: {
    backgroundColor: '#E3F2FD',
  },
  copyPathButton: {
    margin: 0,
    marginRight: 8,
  },
  titleToggleButton: {
    margin: 0,
    marginHorizontal: 4,
  },
});

export default ProviderDetails; 