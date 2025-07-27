import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Icon } from 'react-native-paper';
import { SyncService } from '../services/syncService';

interface SyncStatusProps {
  showDetails?: boolean;
}

export default function SyncStatus({ showDetails = false }: SyncStatusProps) {
  const [syncInfo, setSyncInfo] = useState<{ timestamp?: string; version?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    try {
      const info = await SyncService.getLastSyncInfo();
      setSyncInfo(info);
    } catch (error) {
      console.error('Error loading sync info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSyncTime = (timestamp?: string): string => {
    if (!timestamp) return 'Never synced';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return null;
  }

  const isSynced = !!syncInfo.timestamp;

  if (!showDetails && !isSynced) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Icon
            source={isSynced ? "cloud-check" : "cloud-off-outline"}
            size={20}
            color={isSynced ? "#4CAF50" : "#757575"}
          />
          <Text style={[styles.title, { color: isSynced ? "#4CAF50" : "#757575" }]}>
            iCloud Keychain Sync
          </Text>
        </View>
        
        {showDetails && (
          <View style={styles.details}>
            <Text style={styles.status}>
              Status: {isSynced ? "Synchronized" : "Not synchronized"}
            </Text>
            <Text style={styles.lastSync}>
              Last sync: {formatSyncTime(syncInfo.timestamp)}
            </Text>
            {isSynced && (
              <Text style={styles.description}>
                Your S3 credentials are synced across all your Apple devices
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    marginTop: 8,
    gap: 4,
  },
  status: {
    fontSize: 12,
    color: '#666',
  },
  lastSync: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
});