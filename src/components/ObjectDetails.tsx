import React from 'react';
import { StyleSheet, View, Linking, Alert } from 'react-native';
import { Card, Text, IconButton, Button, Portal, Modal, TextInput } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { S3Provider, S3Object } from '../types';
import { getObjectUrl, getSignedObjectUrl, deleteObject } from '../services/s3Service';

interface ObjectDetailsProps {
  provider: S3Provider;
  bucketName: string;
  object: S3Object;
  onBack: () => void;
}

function ObjectDetails({ provider, bucketName, object, onBack }: ObjectDetailsProps) {
  const [isLoadingUrl, setIsLoadingUrl] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = React.useState(false);
  const [newName, setNewName] = React.useState(object.name);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const handleCopyPath = async () => {
    try {
      await Clipboard.setStringAsync(object.fullPath || object.key);
      Alert.alert('Copied', 'Full path copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Could not copy to clipboard');
    }
  };

  const handleShareLink = async () => {
    try {
      setIsLoadingUrl(true);
      const signedUrl = await getSignedObjectUrl(provider, bucketName, object.key);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(signedUrl, {
          mimeType: 'text/plain',
          dialogTitle: `Share ${object.name}`,
          UTI: 'public.url'
        });
      } else {
        // Fallback to copying URL if sharing is not available
        await Clipboard.setStringAsync(signedUrl);
        Alert.alert('URL Copied', 'Share URL copied to clipboard');
      }
    } catch (err: any) {
      setError('Could not generate share URL');
      console.error('Error generating share URL:', err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleOpenObject = async () => {
    setIsLoadingUrl(true);
    setError(null);
    try {
      const signedUrl = await getSignedObjectUrl(provider, bucketName, object.key);
      Linking.openURL(signedUrl).catch(err => {
        setError('Could not open the URL');
        console.error('Error opening URL:', err);
      });
    } catch (err: any) {
      setError('Could not generate signed URL');
      console.error('Error generating signed URL:', err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  async function handleDelete() {
    Alert.alert(
      'Delete Object',
      `Permanently delete "${object.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteObject(provider, bucketName, object.key);
              Alert.alert('Success', 'Object deleted successfully');
              onBack();
            } catch (err) {
              Alert.alert('Error', 'Error deleting object');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  }

  async function handleRename() {
    if (!newName.trim() || newName === object.name) {
      setIsRenameModalVisible(false);
      return;
    }
    setIsRenaming(true);
    try {
      // Copy the object under the new name then delete the old one
      const client = new (require('@aws-sdk/client-s3').S3Client)({
        region: provider.region || 'us-east-1',
        endpoint: provider.endpoint,
        credentials: {
          accessKeyId: provider.accessKey,
          secretAccessKey: provider.secretKey
        },
        forcePathStyle: provider.type === 'hetzner',
      });
      const CopyObjectCommand = require('@aws-sdk/client-s3').CopyObjectCommand;
      await client.send(new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `/${bucketName}/${object.key}`,
        Key: object.key.replace(/[^/]+$/, newName),
      }));
      await deleteObject(provider, bucketName, object.key);
      Alert.alert('Success', 'Object renamed successfully');
      setIsRenameModalVisible(false);
      onBack();
    } catch (err) {
      Alert.alert('Error', 'Error renaming object');
    } finally {
      setIsRenaming(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={onBack}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Object Details</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{object.name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{object.isFolder ? 'Folder' : 'File'}</Text>
          </View>

          {!object.isFolder && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Size:</Text>
                <Text style={styles.value}>{formatSize(object.size)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Last Modified:</Text>
                <Text style={styles.value}>{formatDate(object.lastModified)}</Text>
              </View>
            </>
          )}

          <View style={styles.pathContainer}>
            <View style={styles.pathHeader}>
              <Text style={styles.label}>Full Path:</Text>
              <IconButton 
                icon="content-copy" 
                size={20} 
                onPress={handleCopyPath}
                style={styles.copyButton}
              />
            </View>
            <Text style={styles.pathValue} selectable numberOfLines={0}>
              {object.fullPath || object.key}
            </Text>
          </View>

          {!object.isFolder && (
            <>
              <View style={styles.actionButtonsContainer}>
                <Button
                  mode="contained"
                  onPress={handleOpenObject}
                  style={[styles.actionButton, styles.primaryButton]}
                  loading={isLoadingUrl}
                  disabled={isLoadingUrl}
                  icon="open-in-new"
                  contentStyle={styles.buttonContent}
                >
                  Open Link
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleShareLink}
                  style={[styles.actionButton, styles.secondaryButton]}
                  loading={isLoadingUrl}
                  disabled={isLoadingUrl}
                  icon="share"
                  contentStyle={styles.buttonContent}
                >
                  Share Link
                </Button>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}
              
              <View style={styles.managementButtonsContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setIsRenameModalVisible(true)}
                  style={[styles.actionButton, styles.managementButton]}
                  disabled={isRenaming}
                  icon="pencil"
                  contentStyle={styles.buttonContent}
                >
                  Rename
                </Button>
                
                <Button
                  mode="contained"
                  onPress={handleDelete}
                  style={[styles.actionButton, styles.deleteButton]}
                  loading={isDeleting}
                  disabled={isDeleting}
                  icon="delete"
                  contentStyle={styles.buttonContent}
                >
                  Delete
                </Button>
              </View>

              <Portal>
                <Modal 
                  visible={isRenameModalVisible} 
                  onDismiss={() => setIsRenameModalVisible(false)} 
                  contentContainerStyle={styles.modalContainer}
                >
                  <Text style={styles.modalTitle}>Rename Object</Text>
                  <TextInput
                    mode="outlined"
                    label="New name"
                    value={newName}
                    onChangeText={setNewName}
                    style={styles.modalInput}
                  />
                  <View style={styles.modalButtonsContainer}>
                    <Button 
                      mode="contained" 
                      onPress={handleRename} 
                      loading={isRenaming} 
                      disabled={isRenaming || !newName.trim() || newName === object.name}
                      style={[styles.modalButton, styles.primaryButton]}
                    >
                      Rename
                    </Button>
                    <Button 
                      mode="text" 
                      onPress={() => setIsRenameModalVisible(false)} 
                      disabled={isRenaming}
                      style={styles.modalButton}
                    >
                      Cancel
                    </Button>
                  </View>
                </Modal>
              </Portal>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  backButton: {
    margin: 0,
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontWeight: '500',
    width: 120,
  },
  value: {
    flex: 1,
  },
  pathContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pathValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  copyButton: {
    margin: 0,
    padding: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  managementButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  managementButton: {
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default ObjectDetails; 