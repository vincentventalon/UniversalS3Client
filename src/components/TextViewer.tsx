import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Card, Text, IconButton, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { S3Provider, S3Object } from '../types';
import { getSignedObjectUrl, uploadFile } from '../services/s3Service';

interface TextViewerProps {
  provider: S3Provider;
  bucketName: string;
  object: S3Object;
  onBack: () => void;
}

function TextViewer({ provider, bucketName, object, onBack }: TextViewerProps) {
  const [textContent, setTextContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTextData();
  }, []);

  const loadTextData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get signed URL for the text file
      const signedUrl = await getSignedObjectUrl(provider, bucketName, object.key);
      
      // Fetch the text content
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      setTextContent(content);
      setEditedContent(content);
      
    } catch (err: any) {
      console.error('Error loading text data:', err);
      setError(err.message || 'Failed to load text file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Create a temporary file to upload
      const blob = new Blob([editedContent], { type: 'text/plain' });
      const tempUrl = URL.createObjectURL(blob);
      
      // Upload the modified text
      await uploadFile(provider, bucketName, object.key, tempUrl);
      
      // Update the original data
      setTextContent(editedContent);
      setIsEditing(false);
      
      Alert.alert('Success', 'Text file has been saved successfully');
      
    } catch (err: any) {
      console.error('Error saving text:', err);
      Alert.alert('Error', 'Failed to save text file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(textContent);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>Text Viewer</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading text file...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>Text Viewer</Text>
        </View>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={loadTextData} style={styles.retryButton}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={onBack} />
        <Text style={styles.headerTitle}>Text Viewer - {object.name}</Text>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <Button
                mode="outlined"
                onPress={handleCancelEdit}
                style={styles.actionButton}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.actionButton, styles.saveButton]}
                loading={isSaving}
                disabled={isSaving}
              >
                Save
              </Button>
            </>
          ) : (
            <IconButton
              icon={isEditing ? "lock-open" : "lock"}
              size={24}
              onPress={() => setIsEditing(!isEditing)}
              style={styles.lockButton}
            />
          )}
        </View>
      </View>

      <Card style={styles.contentCard}>
        <Card.Content style={styles.contentContainer}>
          <ScrollView style={styles.scrollView}>
            {isEditing ? (
              <TextInput
                mode="outlined"
                multiline
                value={editedContent}
                onChangeText={setEditedContent}
                style={styles.textEditor}
                placeholder="Enter text content..."
              />
            ) : (
              <Text style={styles.textContent} selectable>
                {textContent}
              </Text>
            )}
          </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockButton: {
    margin: 0,
  },
  actionButton: {
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorCard: {
    marginTop: 16,
  },
  errorText: {
    color: '#FF5252',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
  },
  contentCard: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  textEditor: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
    minHeight: 400,
  },
  textContent: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
  },
});

export default TextViewer;