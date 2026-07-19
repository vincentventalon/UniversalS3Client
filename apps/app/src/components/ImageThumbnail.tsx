import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import { S3Object, S3Provider } from '../types';
import { getSignedObjectUrl } from '../services/s3Service';

interface ImageThumbnailProps {
  item: S3Object;
  provider: S3Provider;
  bucketName: string;
  color?: string;
  size?: number;
  fillContainer?: boolean;
}

/**
 * Component that displays an image thumbnail for image files,
 * with fallback to generic file icon on error.
 * iOS natively supports HEIC images, no conversion needed.
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const generateImageUrl = async () => {
      try {
        setLoading(true);
        setImageError(false);

        // Use signed URLs for all providers (AWS and S3-compatible)
        const signedUrl = await getSignedObjectUrl(provider, bucketName, item.key, 3600);

        if (isMounted) {
          setImageUrl(signedUrl);
        }
      } catch (error) {
        console.error('Error generating signed image URL:', error);
        if (isMounted) {
          setImageError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateImageUrl();

    return () => {
      isMounted = false;
    };
  }, [provider, bucketName, item.key]);

  // Show loading state
  if (loading) {
    if (fillContainer) {
      return (
        <View style={styles.fullContainer}>
          <List.Icon icon="loading" color="rgba(33, 150, 243, 0.8)" />
        </View>
      );
    }
    return <List.Icon icon="loading" color={color} />;
  }
  
  // If there was an error loading the image or no URL, show generic file icon
  if (imageError || !imageUrl) {
    if (fillContainer) {
      return (
        <View style={styles.fullContainer}>
          <List.Icon icon="file" color="rgba(33, 150, 243, 0.8)" />
        </View>
      );
    }
    return <List.Icon icon="file" color={color} />;
  }

  const handleImageError = () => {
    // Since we're already using signed URLs, if there's an error, 
    // it's likely the image doesn't exist or there's a real network issue
    setImageError(true);
  };

  if (fillContainer) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.fullImage}
        onError={handleImageError}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.thumbnail, { width: size, height: size }]}
        onError={handleImageError}
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