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
  showTitle?: boolean;
}

export function GridFileItem({ 
  item, 
  provider, 
  bucketName, 
  isSelected = false, 
  isMultiSelect = false, 
  onPress, 
  onSelect,
  size,
  showTitle = true
}: GridFileItemProps) {
  const itemSize = size === 'large' ? 120 : 80;
  const iconSize = size === 'large' ? 64 : 48;
  
  const handlePress = () => {
    if (isMultiSelect && onSelect) {
      onSelect();
    } else if (onPress) {
      onPress();
    }
  };

  const renderBackgroundContent = () => {
    if (item.isFolder) {
      return (
        <View style={styles.backgroundIconContainer}>
          <List.Icon 
            icon="folder" 
            color="rgba(255, 193, 7, 0.8)" 
            size={iconSize}
          />
        </View>
      );
    } else if (isImageFile(item.name)) {
      return (
        <ImageThumbnail 
          item={item} 
          provider={provider} 
          bucketName={bucketName}
          size={itemSize}
          fillContainer={true}
        />
      );
    } else {
      return (
        <View style={styles.backgroundIconContainer}>
          <List.Icon 
            icon="file" 
            color="rgba(33, 150, 243, 0.8)" 
            size={iconSize}
          />
        </View>
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
      {/* Background content (image/icon) fills entire container */}
      <View style={styles.backgroundContainer}>
        {renderBackgroundContent()}
      </View>

      {/* Overlay content */}
      {isMultiSelect && (
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onSelect}
          />
        </View>
      )}
      
      {showTitle && (
        <View style={styles.overlayContainer}>
          <View style={styles.textOverlay}>
            <Text 
              style={[
                styles.overlayTitle, 
                size === 'small' && styles.smallOverlayTitle
              ]} 
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {item.name}
            </Text>
            
            {!item.isFolder && (
              <Text style={styles.overlaySubtitle} numberOfLines={1}>
                {formatSize(item.size)}
              </Text>
            )}
          </View>
        </View>
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
    margin: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden', // Ensures content doesn't overflow rounded corners
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  textOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  overlayTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  smallOverlayTitle: {
    fontSize: 9,
  },
  overlaySubtitle: {
    fontSize: 9,
    color: '#e0e0e0',
    marginTop: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});