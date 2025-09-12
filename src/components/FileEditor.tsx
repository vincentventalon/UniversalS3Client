import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Dimensions } from 'react-native';
import { Text, IconButton, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { S3Provider, S3Object } from '../types';
import { downloadFileAsText, uploadTextAsFile } from '../services/s3Service';
import { isJsonFile } from '../utils/fileUtils';

interface FileEditorProps {
  provider: S3Provider;
  bucketName: string;
  object: S3Object;
  onBack: () => void;
  onSaved?: () => void;
}

function FileEditor({ provider, bucketName, object, onBack, onSaved }: FileEditorProps) {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const isJson = isJsonFile(object.name);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    loadFileContent();
  }, []);

  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const loadFileContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fileContent = await downloadFileAsText(provider, bucketName, object.key);
      
      // Format JSON content for better readability
      let displayContent = fileContent;
      if (isJson) {
        try {
          const parsed = JSON.parse(fileContent);
          displayContent = JSON.stringify(parsed, null, 2);
        } catch (jsonError) {
          // If JSON is invalid, show as-is
          console.warn('Invalid JSON content, displaying as raw text:', jsonError);
        }
      }
      
      setContent(displayContent);
      setOriginalContent(displayContent);
    } catch (err: any) {
      setError(err.message || 'Failed to load file content');
      console.error('Error loading file content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      let contentToSave = content;
      let contentType = 'text/plain';

      // Validate and format JSON if it's a JSON file
      if (isJson) {
        try {
          const parsed = JSON.parse(content);
          contentToSave = JSON.stringify(parsed, null, 2);
          contentType = 'application/json';
        } catch (jsonError) {
          Alert.alert('Invalid JSON', 'Please fix the JSON syntax errors before saving.');
          return;
        }
      }

      await uploadTextAsFile(provider, bucketName, object.key, contentToSave, contentType);
      
      setOriginalContent(contentToSave);
      setContent(contentToSave);
      setHasChanges(false);
      
      Alert.alert('Success', 'File saved successfully');
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save file');
      Alert.alert('Error', 'Failed to save file: ' + (err.message || 'Unknown error'));
      console.error('Error saving file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: onBack }
        ]
      );
    } else {
      onBack();
    }
  };

  const formatJson = () => {
    if (!isJson) return;
    
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
    } catch (err) {
      Alert.alert('Invalid JSON', 'Cannot format invalid JSON. Please fix syntax errors first.');
    }
  };

  const minifyJson = () => {
    if (!isJson) return;
    
    try {
      const parsed = JSON.parse(content);
      const minified = JSON.stringify(parsed);
      setContent(minified);
    } catch (err) {
      Alert.alert('Invalid JSON', 'Cannot minify invalid JSON. Please fix syntax errors first.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={onBack}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading file content...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={handleBack}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isJson ? 'JSON Editor' : 'Text Editor'}
        </Text>
        <View style={styles.headerActions}>
          {isJson && (
            <>
              <IconButton 
                icon="code-braces" 
                size={20} 
                onPress={formatJson}
                style={styles.actionButton}
                disabled={isSaving}
              />
              <IconButton 
                icon="minus-box" 
                size={20} 
                onPress={minifyJson}
                style={styles.actionButton}
                disabled={isSaving}
              />
            </>
          )}
        </View>
      </View>

      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{object.name}</Text>
        <Text style={styles.fileSize}>Size: {Math.round(content.length / 1024 * 100) / 100} KB</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView style={styles.editorContainer} showsVerticalScrollIndicator={true}>
        <TextInput
          mode="outlined"
          multiline
          value={content}
          onChangeText={setContent}
          style={[styles.editor, { minHeight: screenHeight * 0.5 }]}
          contentStyle={styles.editorContent}
          placeholder={isJson ? 'Enter JSON content...' : 'Enter text content...'}
          editable={!isSaving}
          scrollEnabled={false} // Let ScrollView handle scrolling
        />
      </ScrollView>

      <View style={styles.actionButtonsContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={[styles.actionButton, styles.cancelButton]}
          disabled={isSaving}
          icon="close"
        >
          {hasChanges ? 'Cancel' : 'Close'}
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSave}
          style={[styles.actionButton, styles.saveButton]}
          loading={isSaving}
          disabled={isSaving || !hasChanges}
          icon="content-save"
        >
          Save
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  backButton: {
    margin: 0,
  },
  actionButton: {
    margin: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#FF5252',
    margin: 16,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  editor: {
    backgroundColor: 'white',
    fontSize: 14,
  },
  editorContent: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
});

export default FileEditor;