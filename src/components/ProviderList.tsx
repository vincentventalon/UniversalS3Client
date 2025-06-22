import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Card, Text, IconButton, Divider, Surface, useTheme } from 'react-native-paper';
import { S3Provider } from '../types';

interface ProviderListProps {
  providers: S3Provider[];
  onSelect: (provider: S3Provider) => void;
  onDelete: (providerId: string) => void;
}

function ProviderList({ providers, onSelect, onDelete }: ProviderListProps) {
  const theme = useTheme();

  if (providers.length === 0) {
    return (
      <Surface style={styles.emptyContainer} elevation={0}>
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <IconButton
              icon="cloud-off-outline"
              size={48}
              iconColor={theme.colors.primary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No S3 buckets configured</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button below to add your first bucket
            </Text>
          </Card.Content>
        </Card>
      </Surface>
    );
  }

  const renderProviderItem = ({ item }: { item: S3Provider }) => {
    let bucketName = '';
    let host = '';
    let location = item.region || '';
    if (item.type === 'aws') {
      host = 'AWS';
      const match = item.name.match(/- ([^(]+)(?:\s|$)/);
      bucketName = match && match[1] ? match[1].trim() : item.name;
    } else if (item.type === 'hetzner') {
      host = 'Hetzner';
      const match = item.name.match(/- ([^(]+)(?:\s|$)/);
      bucketName = match && match[1] ? match[1].trim() : item.name;
    }
    return (
      <Card style={styles.providerCard} onPress={() => onSelect(item)} mode="elevated">
        <Card.Content style={styles.rowContent}>
          <Text style={styles.bucketLine} numberOfLines={1}>
            {host} — {bucketName}{location ? ` (${location})` : ''}
          </Text>
          <IconButton
            icon="delete-outline"
            size={24}
            onPress={() => onDelete(item.id)}
            style={styles.deleteButton}
          />
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={providers}
        renderItem={renderProviderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 8,
  },
  providerCard: {
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bucketLine: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    margin: -8,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: 'transparent',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    margin: 0,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
});

export default ProviderList; 