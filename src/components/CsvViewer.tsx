import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Dimensions } from 'react-native';
import { Card, Text, IconButton, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { S3Provider, S3Object } from '../types';
import { getSignedObjectUrl, uploadFile } from '../services/s3Service';

interface CsvViewerProps {
  provider: S3Provider;
  bucketName: string;
  object: S3Object;
  onBack: () => void;
}

interface CsvData {
  headers: string[];
  rows: string[][];
}

function CsvViewer({ provider, bucketName, object, onBack }: CsvViewerProps) {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<CsvData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCsvData();
  }, []);

  const loadCsvData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get signed URL for the CSV file
      const signedUrl = await getSignedObjectUrl(provider, bucketName, object.key);
      
      // Fetch the CSV content
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      const parsedData = parseCsv(csvText);
      setCsvData(parsedData);
      setEditedData(parsedData);
      
    } catch (err: any) {
      console.error('Error loading CSV data:', err);
      setError(err.message || 'Failed to load CSV file');
    } finally {
      setLoading(false);
    }
  };

  const parseCsv = (csvText: string): CsvData => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Parse CSV with basic comma separation (could be enhanced for quoted fields)
    const parseRow = (row: string): string[] => {
      // Simple CSV parsing - handles basic comma separation
      // For production, consider using a proper CSV parsing library
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result.map(cell => cell.replace(/^"|"$/g, '')); // Remove surrounding quotes
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(line => parseRow(line));

    return { headers, rows };
  };

  const csvToString = (data: CsvData): string => {
    const escapeCell = (cell: string): string => {
      // Escape cells that contain commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };

    const headerRow = data.headers.map(escapeCell).join(',');
    const dataRows = data.rows.map(row => row.map(escapeCell).join(',')).join('\n');
    
    return headerRow + '\n' + dataRows;
  };

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    if (!editedData) return;
    
    const newData = { ...editedData };
    if (rowIndex === -1) {
      // Editing header
      newData.headers[colIndex] = value;
    } else {
      // Editing data cell
      newData.rows[rowIndex][colIndex] = value;
    }
    
    setEditedData(newData);
  };

  const handleSave = async () => {
    if (!editedData) return;
    
    try {
      setIsSaving(true);
      
      // Convert edited data back to CSV string
      const csvString = csvToString(editedData);
      
      // Create a temporary file to upload
      const blob = new Blob([csvString], { type: 'text/csv' });
      const tempUrl = URL.createObjectURL(blob);
      
      // Upload the modified CSV
      await uploadFile(provider, bucketName, object.key, tempUrl);
      
      // Update the original data
      setCsvData(editedData);
      setIsEditing(false);
      
      Alert.alert('Success', 'CSV file has been saved successfully');
      
    } catch (err: any) {
      console.error('Error saving CSV:', err);
      Alert.alert('Error', 'Failed to save CSV file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedData(csvData);
    setIsEditing(false);
  };

  const renderTable = () => {
    const data = isEditing ? editedData : csvData;
    if (!data || data.headers.length === 0) {
      return (
        <Text style={styles.noDataText}>No data to display</Text>
      );
    }

    const screenWidth = Dimensions.get('window').width;
    const minColumnWidth = Math.max(100, (screenWidth - 40) / Math.max(data.headers.length, 1));

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header Row */}
          <View style={styles.tableRow}>
            {data.headers.map((header, colIndex) => (
              <View key={colIndex} style={[styles.tableCell, styles.headerCell, { minWidth: minColumnWidth }]}>
                {isEditing ? (
                  <TextInput
                    value={header}
                    onChangeText={(text) => handleCellEdit(-1, colIndex, text)}
                    style={styles.cellInput}
                    dense
                    multiline
                  />
                ) : (
                  <Text style={styles.headerText}>{header}</Text>
                )}
              </View>
            ))}
          </View>
          
          {/* Data Rows */}
          {data.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {row.map((cell, colIndex) => (
                <View key={colIndex} style={[styles.tableCell, styles.dataCell, { minWidth: minColumnWidth }]}>
                  {isEditing ? (
                    <TextInput
                      value={cell}
                      onChangeText={(text) => handleCellEdit(rowIndex, colIndex, text)}
                      style={styles.cellInput}
                      dense
                      multiline
                    />
                  ) : (
                    <Text style={styles.cellText}>{cell}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>CSV Viewer</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading CSV file...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text style={styles.headerTitle}>CSV Viewer</Text>
        </View>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={loadCsvData} style={styles.retryButton}>
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
        <Text style={styles.headerTitle}>CSV Viewer - {object.name}</Text>
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

      <Card style={styles.tableCard}>
        <Card.Content style={styles.tableContainer}>
          <ScrollView style={styles.tableScrollView}>
            {renderTable()}
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
  tableCard: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    padding: 0,
  },
  tableScrollView: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: '#f5f5f5',
  },
  dataCell: {
    backgroundColor: '#ffffff',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cellText: {
    fontSize: 14,
  },
  cellInput: {
    fontSize: 14,
    minHeight: 40,
    backgroundColor: 'transparent',
  },
  noDataText: {
    textAlign: 'center',
    padding: 32,
    opacity: 0.7,
  },
});

export default CsvViewer;