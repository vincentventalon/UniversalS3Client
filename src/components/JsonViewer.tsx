import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Card, Text, IconButton, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { S3Provider, S3Object } from '../types';
import { getSignedObjectUrl, uploadFile } from '../services/s3Service';

interface JsonViewerProps {
  provider: S3Provider;
  bucketName: string;
  object: S3Object;
  onBack: () => void;
}

function JsonViewer({ provider, bucketName, object, onBack }: JsonViewerProps) {
  const [jsonData, setJsonData] = useState<any>(null);
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJsonText, setEditedJsonText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    loadJsonData();
  }, []);

  const loadJsonData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get signed URL for the JSON file
      const signedUrl = await getSignedObjectUrl(provider, bucketName, object.key);
      
      // Fetch the JSON content
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const jsonText = await response.text();
      setRawJsonText(jsonText);
      setEditedJsonText(jsonText);
      
      try {
        const parsedData = JSON.parse(jsonText);
        setJsonData(parsedData);
      } catch (parseErr) {
        setJsonData(null);
        setError('Invalid JSON format');
      }
      
    } catch (err: any) {
      console.error('Error loading JSON data:', err);
      setError(err.message || 'Failed to load JSON file');
    } finally {
      setLoading(false);
    }
  };

  const validateJson = (text: string): boolean => {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (err: any) {
      setJsonError(`Invalid JSON: ${err.message}`);
      return false;
    }
  };

  const handleJsonTextChange = (text: string) => {
    setEditedJsonText(text);
    validateJson(text);
  };

  const handleSave = async () => {
    if (!validateJson(editedJsonText)) {
      Alert.alert('Invalid JSON', 'Please fix the JSON syntax errors before saving.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create a temporary file to upload
      const blob = new Blob([editedJsonText], { type: 'application/json' });
      const tempUrl = URL.createObjectURL(blob);
      
      // Upload the modified JSON
      await uploadFile(provider, bucketName, object.key, tempUrl);
      
      // Update the original data
      setRawJsonText(editedJsonText);
      const parsedData = JSON.parse(editedJsonText);
      setJsonData(parsedData);
      setIsEditing(false);
      
      Alert.alert('Success', 'JSON file has been saved successfully');
      
    } catch (err: any) {
      console.error('Error saving JSON:', err);
      Alert.alert('Error', 'Failed to save JSON file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedJsonText(rawJsonText);
    setJsonError(null);
    setIsEditing(false);
  };

  const renderJsonTree = (data: any, depth: number = 0): React.ReactNode => {
    if (data === null) {
      return <Text style={[styles.jsonValue, styles.nullValue]}>null</Text>;
    }
    
    if (typeof data === 'string') {
      return <Text style={[styles.jsonValue, styles.stringValue]}>"{data}"</Text>;
    }
    
    if (typeof data === 'number') {
      return <Text style={[styles.jsonValue, styles.numberValue]}>{data}</Text>;
    }
    
    if (typeof data === 'boolean') {
      return <Text style={[styles.jsonValue, styles.booleanValue]}>{data.toString()}</Text>;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <Text style={styles.jsonValue}>[]</Text>;
      }
      
      return (
        <View style={styles.jsonContainer}>
          <Text style={styles.bracket}>[</Text>
          {data.map((item, index) => (
            <View key={index} style={[styles.jsonItem, { marginLeft: (depth + 1) * 20 }]}>
              <View style={styles.arrayItem}>
                {renderJsonTree(item, depth + 1)}
                {index < data.length - 1 && <Text style={styles.comma}>,</Text>}
              </View>
            </View>
          ))}
          <Text style={[styles.bracket, { marginLeft: depth * 20 }]}>]</Text>
        </View>
      );
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return <Text style={styles.jsonValue}>{'{}'}</Text>;
      }
      
      return (
        <View style={styles.jsonContainer}>
          <Text style={styles.bracket}>{'{'}</Text>
          {keys.map((key, index) => (
            <View key={key} style={[styles.jsonItem, { marginLeft: (depth + 1) * 20 }]}>
              <View style={styles.objectItem}>
                <Text style={styles.jsonKey}>"{key}"</Text>
                <Text style={styles.colon}>: </Text>
                {renderJsonTree(data[key], depth + 1)}
                {index < keys.length - 1 && <Text style={styles.comma}>,</Text>}
              </View>
            </View>
          ))}
          <Text style={[styles.bracket, { marginLeft: depth * 20 }]}>{'}'}</Text>
        </View>
      );
    }
    
    return <Text style={styles.jsonValue}>{String(data)}</Text>;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>JSON Viewer</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading JSON file...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>JSON Viewer</Text>
        </View>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={loadJsonData} style={styles.retryButton}>
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
        <Text style={styles.headerTitle}>JSON Viewer - {object.name}</Text>
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
                disabled={isSaving || !!jsonError}
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

      {jsonError && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{jsonError}</Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.contentCard}>
        <Card.Content style={styles.contentContainer}>
          <ScrollView style={styles.scrollView}>
            {isEditing ? (
              <TextInput
                mode="outlined"
                multiline
                value={editedJsonText}
                onChangeText={handleJsonTextChange}
                style={styles.textEditor}
                placeholder="Enter JSON content..."
                error={!!jsonError}
              />
            ) : (
              <View style={styles.jsonTreeContainer}>
                {jsonData ? renderJsonTree(jsonData) : (
                  <Text style={styles.rawText}>{rawJsonText}</Text>
                )}
              </View>
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
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 16,
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
    fontSize: 12,
    minHeight: 400,
  },
  jsonTreeContainer: {
    padding: 16,
  },
  jsonContainer: {
    marginVertical: 2,
  },
  jsonItem: {
    marginVertical: 1,
  },
  objectItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  arrayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jsonKey: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  jsonValue: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  stringValue: {
    color: '#388E3C',
  },
  numberValue: {
    color: '#F57C00',
  },
  booleanValue: {
    color: '#7B1FA2',
  },
  nullValue: {
    color: '#616161',
    fontStyle: 'italic',
  },
  bracket: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#424242',
  },
  colon: {
    fontFamily: 'monospace',
    marginHorizontal: 4,
  },
  comma: {
    fontFamily: 'monospace',
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

export default JsonViewer;