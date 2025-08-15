import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import { S3Object } from '../types';

interface ImageThumbnailProps {
  item: S3Object;
  provider: any; // Provider info for constructing image URL
  bucketName: string;
  color?: string;
  size?: number;
  fillContainer?: boolean;
}

/**
 * Component that displays an image thumbnail for image files,
 * with fallback to generic file icon on error
 */
export function ImageThumbnail({ 
  item, 
  provider, 
  bucketName, 
  color = '#2196F3', 
  size = 24, 
  fillContainer = false 
}: ImageThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  
  // If there was an error loading the image, show generic file icon
  if (imageError) {
    if (fillContainer) {
      return (
        <View style={styles.fullContainer}>
          <List.Icon icon="file" color="rgba(33, 150, 243, 0.8)" size={size * 0.6} />
        </View>
      );
    }
    return <List.Icon icon="file" color={color} />;
  }

  // Construct the image URL
  // This assumes the S3 object is publicly accessible or you have proper authentication
  const imageUrl = `${provider.endpoint}/${bucketName}/${item.key}`;

  if (fillContainer) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.fullImage}
        onError={() => setImageError(true)}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.thumbnail, { width: size, height: size }]}
        onError={() => setImageError(true)}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 12,
  },
  thumbnail: {
    borderRadius: 4,
  },
  fullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});