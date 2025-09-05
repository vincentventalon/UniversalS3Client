import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import { S3Object, S3Provider } from '../types';
import { getSignedObjectUrl } from '../services/s3Service';
import { isHeicFile } from '../utils/fileUtils';
import { convertHeicFromUrl, createBlobUrl, revokeBlobUrl, isHeicConversionSupported } from '../utils/heicConverter';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let currentBlobUrl: string | null = null;

    const generateImageUrl = async () => {
      try {
        setLoading(true);
        setImageError(false);
        setIsConverting(false);
        
        // Use signed URLs for all providers (AWS and S3-compatible)
        // This ensures authentication works for both public and private buckets
        const signedUrl = await getSignedObjectUrl(provider, bucketName, item.key, 3600); // 1 hour expiry
        
        if (!isMounted) return;

        // Check if this is a HEIC file and if conversion is supported
        const isHeic = isHeicFile(item.name);
        
        if (isHeic && isHeicConversionSupported()) {
          try {
            setIsConverting(true);
            console.log('Converting HEIC image:', item.name);
            
            // Convert HEIC to JPEG
            const convertedBlob = await convertHeicFromUrl(signedUrl, {
              toType: 'image/jpeg',
              quality: 0.8
            });
            
            if (!isMounted) return;
            
            // Create a blob URL for the converted image
            const blobUrl = createBlobUrl(convertedBlob as Blob);
            currentBlobUrl = blobUrl;
            setImageUrl(blobUrl);
            
            console.log('HEIC conversion successful for:', item.name);
          } catch (conversionError) {
            console.error('Error converting HEIC image:', conversionError);
            if (isMounted) {
              // Fallback to original URL (might not work in all browsers, but worth trying)
              setImageUrl(signedUrl);
            }
          } finally {
            if (isMounted) {
              setIsConverting(false);
            }
          }
        } else {
          // For non-HEIC images, use the signed URL directly
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
      // Clean up blob URL to prevent memory leaks
      if (currentBlobUrl) {
        revokeBlobUrl(currentBlobUrl);
      }
    };
  }, [provider, bucketName, item.key]);

  // Show loading state
  if (loading || isConverting) {
    const loadingIcon = isConverting ? "image-sync" : "loading";
    if (fillContainer) {
      return (
        <View style={styles.fullContainer}>
          <List.Icon icon={loadingIcon} color="rgba(33, 150, 243, 0.8)" size={size * 0.6} />
        </View>
      );
    }
    return <List.Icon icon={loadingIcon} color={color} />;
  }
  
  // If there was an error loading the image or no URL, show generic file icon
  if (imageError || !imageUrl) {
    if (fillContainer) {
      return (
        <View style={styles.fullContainer}>
          <List.Icon icon="file" color="rgba(33, 150, 243, 0.8)" size={size * 0.6} />
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