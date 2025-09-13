import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Card, Text, IconButton, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import * as yaml from 'js-yaml';
import { S3Provider, S3Object } from '../types';
import { getSignedObjectUrl, uploadFile } from '../services/s3Service';

interface YamlViewerProps {
  provider: S3Provider;
  bucketName: string;
  object: S3Object;
  onBack: () => void;
}

function YamlViewer({ provider, bucketName, object, onBack }: YamlViewerProps) {
  const [yamlData, setYamlData] = useState<any>(null);
  const [rawYamlText, setRawYamlText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedYamlText, setEditedYamlText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [yamlError, setYamlError] = useState<string | null>(null);

  useEffect(() => {
    loadYamlData();
  }, []);

  const loadYamlData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get signed URL for the YAML file
      const signedUrl = await getSignedObjectUrl(provider, bucketName, object.key);
      
      // Fetch the YAML content
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const yamlText = await response.text();
      setRawYamlText(yamlText);
      setEditedYamlText(yamlText);
      
      try {
        const parsedData = yaml.load(yamlText);
        setYamlData(parsedData);
      } catch (parseErr: any) {
        setYamlData(null);
        setError(`Invalid YAML format: ${parseErr.message}`);
      }
      
    } catch (err: any) {
      console.error('Error loading YAML data:', err);
      setError(err.message || 'Failed to load YAML file');
    } finally {
      setLoading(false);
    }
  };

  const validateYaml = (text: string): boolean => {
    try {
      yaml.load(text);
      setYamlError(null);
      return true;
    } catch (err: any) {
      setYamlError(`Invalid YAML: ${err.message}`);
      return false;
    }
  };

  const handleYamlTextChange = (text: string) => {
    setEditedYamlText(text);
    validateYaml(text);
  };

  const handleSave = async () => {
    if (!validateYaml(editedYamlText)) {
      Alert.alert('Invalid YAML', 'Please fix the YAML syntax errors before saving.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create a temporary file to upload
      const blob = new Blob([editedYamlText], { type: 'application/x-yaml' });
      const tempUrl = URL.createObjectURL(blob);
      
      // Upload the modified YAML
      await uploadFile(provider, bucketName, object.key, tempUrl);
      
      // Update the original data
      setRawYamlText(editedYamlText);
      const parsedData = yaml.load(editedYamlText);
      setYamlData(parsedData);
      setIsEditing(false);
      
      Alert.alert('Success', 'YAML file has been saved successfully');
      
    } catch (err: any) {
      console.error('Error saving YAML:', err);
      Alert.alert('Error', 'Failed to save YAML file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedYamlText(rawYamlText);
    setYamlError(null);
    setIsEditing(false);
  };

  const renderYamlTree = (data: any, depth: number = 0): React.ReactNode => {
    if (data === null) {
      return <Text style={[styles.yamlValue, styles.nullValue]}>null</Text>;
    }
    
    if (typeof data === 'string') {
      return <Text style={[styles.yamlValue, styles.stringValue]}>"{data}"</Text>;
    }
    
    if (typeof data === 'number') {
      return <Text style={[styles.yamlValue, styles.numberValue]}>{data}</Text>;
    }
    
    if (typeof data === 'boolean') {
      return <Text style={[styles.yamlValue, styles.booleanValue]}>{data.toString()}</Text>;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <Text style={styles.yamlValue}>[]</Text>;
      }
      
      return (
        <View style={styles.yamlContainer}>
          {data.map((item, index) => (
            <View key={index} style={[styles.yamlItem, { marginLeft: (depth + 1) * 20 }]}>
              <View style={styles.arrayItem}>
                <Text style={styles.arrayIndex}>- </Text>
                {renderYamlTree(item, depth + 1)}
              </View>
            </View>
          ))}
        </View>
      );
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return <Text style={styles.yamlValue}>{'{}'}</Text>;
      }
      
      return (
        <View style={styles.yamlContainer}>
          {keys.map((key) => (
            <View key={key} style={[styles.yamlItem, { marginLeft: depth * 20 }]}>
              <View style={styles.objectItem}>
                <Text style={styles.yamlKey}>{key}:</Text>
                <View style={styles.yamlValueContainer}>
                  {renderYamlTree(data[key], depth + 1)}
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    }
    
    return <Text style={styles.yamlValue}>{String(data)}</Text>;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>YAML Viewer</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading YAML file...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>YAML Viewer</Text>
        </View>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={loadYamlData} style={styles.retryButton}>
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
        <Text style={styles.headerTitle}>YAML Viewer - {object.name}</Text>
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
                disabled={isSaving || !!yamlError}
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

      {yamlError && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{yamlError}</Text>
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
                value={editedYamlText}
                onChangeText={handleYamlTextChange}
                style={styles.textEditor}
                placeholder="Enter YAML content..."
                error={!!yamlError}
              />
            ) : (
              <View style={styles.yamlTreeContainer}>
                {yamlData ? renderYamlTree(yamlData) : (
                  <Text style={styles.rawText}>{rawYamlText}</Text>
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
  yamlTreeContainer: {
    padding: 16,
  },
  yamlContainer: {
    marginVertical: 2,
  },
  yamlItem: {
    marginVertical: 2,
  },
  objectItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  arrayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yamlKey: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 4,
  },
  yamlValue: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  yamlValueContainer: {
    marginLeft: 16,
    flex: 1,
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
  arrayIndex: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#795548',
    marginRight: 8,
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

export default YamlViewer;