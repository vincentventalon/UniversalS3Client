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
}

/**
 * Component that displays an image thumbnail for image files,
 * with fallback to generic file icon on error
 */
export function ImageThumbnail({ item, provider, bucketName, color = '#2196F3', size = 24 }: ImageThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  
  // If there was an error loading the image, show generic file icon
  if (imageError) {
    return <List.Icon icon="file" color={color} />;
  }

  // Construct the image URL
  // This assumes the S3 object is publicly accessible or you have proper authentication
  const imageUrl = `${provider.endpoint}/${bucketName}/${item.key}`;

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
});