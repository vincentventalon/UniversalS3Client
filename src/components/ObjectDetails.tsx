import React from 'react';
import { StyleSheet, View, Linking, Alert, TextInput } from 'react-native';
import { Card, Text, IconButton, Button, Portal, Modal } from 'react-native-paper';
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
      setError('Impossible de générer une URL signée');
      console.error('Error generating signed URL:', err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  async function handleDelete() {
    Alert.alert(
      'Supprimer l\'objet',
      `Supprimer définitivement « ${object.name} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive', onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteObject(provider, bucketName, object.key);
              Alert.alert('Succès', 'Objet supprimé');
              onBack();
            } catch (err) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
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
      // Copie l'objet sous le nouveau nom puis supprime l'ancien
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
      Alert.alert('Succès', 'Objet renommé');
      setIsRenameModalVisible(false);
      onBack();
    } catch (err) {
      Alert.alert('Erreur', 'Erreur lors du renommage');
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

              <View style={styles.row}>
                <Text style={styles.label}>Full Path:</Text>
                <Text style={styles.value} numberOfLines={2}>{object.fullPath}</Text>
              </View>

              <Button
                mode="contained"
                onPress={handleOpenObject}
                style={styles.openButton}
                loading={isLoadingUrl}
                disabled={isLoadingUrl}
              >
                Open in Browser
              </Button>
              {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
              <Button
                mode="outlined"
                onPress={() => setIsRenameModalVisible(true)}
                style={styles.openButton}
                disabled={isRenaming}
              >
                Renommer
              </Button>
              <Button
                mode="contained"
                onPress={handleDelete}
                style={[styles.openButton, { backgroundColor: '#FF5252' }]}
                loading={isDeleting}
                disabled={isDeleting}
              >
                Supprimer
              </Button>
              <Portal>
                <Modal visible={isRenameModalVisible} onDismiss={() => setIsRenameModalVisible(false)} contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Renommer l'objet</Text>
                  <TextInput
                    placeholder="Nouveau nom"
                    value={newName}
                    onChangeText={setNewName}
                    style={{ marginBottom: 16, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 }}
                  />
                  <Button mode="contained" onPress={handleRename} loading={isRenaming} disabled={isRenaming || !newName.trim() || newName === object.name}>
                    Renommer
                  </Button>
                  <Button mode="text" onPress={() => setIsRenameModalVisible(false)} disabled={isRenaming}>
                    Annuler
                  </Button>
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
  openButton: {
    marginTop: 16,
  },
});

export default ObjectDetails; 