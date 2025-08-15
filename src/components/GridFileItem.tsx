import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Checkbox } from 'react-native-paper';
import { S3Object } from '../types';
import { ImageThumbnail } from './ImageThumbnail';
import { isImageFile } from '../utils/fileUtils';

interface GridFileItemProps {
  item: S3Object;
  provider: any;
  bucketName: string;
  isSelected?: boolean;
  isMultiSelect?: boolean;
  onPress?: () => void;
  onSelect?: () => void;
  size: 'small' | 'large'; // 'small' for 3x3, 'large' for 2x2
}

export function GridFileItem({ 
  item, 
  provider, 
  bucketName, 
  isSelected = false, 
  isMultiSelect = false, 
  onPress, 
  onSelect,
  size 
}: GridFileItemProps) {
  const itemSize = size === 'large' ? 120 : 80;
  const iconSize = size === 'large' ? 48 : 32;
  
  const handlePress = () => {
    if (isMultiSelect && onSelect) {
      onSelect();
    } else if (onPress) {
      onPress();
    }
  };

  const renderIcon = () => {
    if (item.isFolder) {
      return (
        <List.Icon 
          icon="folder" 
          color="#FFC107" 
          style={{ alignSelf: 'center' }}
        />
      );
    } else if (isImageFile(item.name)) {
      return (
        <ImageThumbnail 
          item={item} 
          provider={provider} 
          bucketName={bucketName}
          color="#2196F3" 
          size={iconSize} 
        />
      );
    } else {
      return (
        <List.Icon 
          icon="file" 
          color="#2196F3" 
          style={{ alignSelf: 'center' }}
        />
      );
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.gridItem, 
        { width: itemSize, height: itemSize },
        isSelected && styles.selectedItem
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {isMultiSelect && (
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onSelect}
          />
        </View>
      )}
      
      <View style={styles.iconContainer}>
        {renderIcon()}
      </View>
      
      <View style={styles.titleContainer}>
        <Text 
          style={[
            styles.title, 
            size === 'small' && styles.smallTitle
          ]} 
          numberOfLines={2}
          ellipsizeMode="middle"
        >
          {item.name}
        </Text>
      </View>
      
      {!item.isFolder && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {formatSize(item.size)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Helper function to format file size
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  gridItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  titleContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    marginTop: 4,
    minHeight: 28,
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  smallTitle: {
    fontSize: 9,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
});