import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { attemptLegacyDataRecovery, needsMigration, migrateFromLegacyStorage } from '../services/secureStorage';

export const StorageDebugComponent: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const checkStorageState = async () => {
    const info: string[] = [];
    
    try {
      // Check for legacy data
      const legacyData = await SecureStore.getItemAsync('universal_s3_client_providers');
      info.push(`Legacy data exists: ${legacyData ? 'YES' : 'NO'}`);
      if (legacyData) {
        try {
          const providers = JSON.parse(legacyData);
          info.push(`Legacy providers count: ${providers.length}`);
        } catch (e) {
          info.push('Legacy data is corrupted');
        }
      }
      
      // Check migration flag
      const migrationFlag = await SecureStore.getItemAsync('universal_s3_client_migrated');
      info.push(`Migration flag: ${migrationFlag ? 'SET' : 'NOT SET'}`);
      
      // Check new provider list
      const providerList = await SecureStore.getItemAsync('universal_s3_client_provider_list');
      info.push(`Provider list exists: ${providerList ? 'YES' : 'NO'}`);
      if (providerList) {
        const ids = JSON.parse(providerList);
        info.push(`Provider IDs: ${ids.join(', ')}`);
      }
      
      // Check if migration is needed
      const migrationNeeded = await needsMigration();
      info.push(`Migration needed: ${migrationNeeded ? 'YES' : 'NO'}`);
      
    } catch (error) {
      info.push(`Error: ${error}`);
    }
    
    setDebugInfo(info);
  };

  const forceMigration = async () => {
    try {
      const providers = await attemptLegacyDataRecovery();
      Alert.alert(
        'Recovery Complete',
        `Recovered ${providers.length} provider(s)`,
        [{ text: 'OK', onPress: checkStorageState }]
      );
    } catch (error) {
      Alert.alert('Error', `Recovery failed: ${error}`);
    }
  };

  const clearMigrationFlag = async () => {
    try {
      await SecureStore.deleteItemAsync('universal_s3_client_migrated');
      Alert.alert('Success', 'Migration flag cleared', [{ text: 'OK', onPress: checkStorageState }]);
    } catch (error) {
      Alert.alert('Error', `Failed to clear flag: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Storage Debug Info</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Check Storage State" onPress={checkStorageState} />
        <Button title="Force Migration/Recovery" onPress={forceMigration} color="#ff6b6b" />
        <Button title="Clear Migration Flag" onPress={clearMigrationFlag} color="#ffa500" />
      </View>
      
      <View style={styles.infoContainer}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.infoText}>{info}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    minHeight: 200,
  },
  infoText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginVertical: 2,
  },
});