import { Bucket, S3Provider, S3Object } from '../types';
import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Nous n'avons plus besoin du polyfill manuel, car nous utilisons 
// react-native-get-random-values qui est importé dans src/utils/polyfills.ts

/**
 * Create a simple ID generator
 */
function generateSimpleId(): string {
  return `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Create an S3 client compatible with all S3-compatible providers
 */
function createS3Client(provider: S3Provider): S3Client {
  // Path-style is needed for most S3-compatible providers except AWS
  const usePathStyle = provider.type !== 'aws';
  
  return new S3Client({
    region: provider.region || 'us-east-1',
    endpoint: provider.endpoint,
    credentials: {
      accessKeyId: provider.accessKey,
      secretAccessKey: provider.secretKey
    },
    forcePathStyle: usePathStyle,
    // Options optimized for stability
    signingEscapePath: true,
    retryMode: 'standard',
    maxAttempts: 3
  });
}

/**
 * Liste les buckets du fournisseur S3
 */
export async function listBuckets(provider: S3Provider): Promise<Bucket[]> {
  try {
    // Pour un usage réel, lister les buckets via SDK
    const client = createS3Client(provider);
    const command = new ListBucketsCommand({});
    
    const response = await client.send(command);
    
    if (!response.Buckets || response.Buckets.length === 0) {
      // Si aucun bucket trouvé, renvoyer le bucket par défaut
      const defaultBucket = extractBucketName(provider);
      return [{
        name: defaultBucket,
        creationDate: new Date(),
        region: provider.region || 'us-east-1',
        url: generateBucketUrl(provider, defaultBucket)
      }];
    }
    
    return response.Buckets.map(bucket => ({
      name: bucket.Name || 'unknown',
      creationDate: bucket.CreationDate,
      region: provider.region || 'us-east-1',
      url: generateBucketUrl(provider, bucket.Name || 'unknown')
    }));
  } catch (error) {
    console.error('Error listing buckets:', error);
    
    // En cas d'erreur, renvoyer un bucket par défaut
    const defaultBucket = extractBucketName(provider);
    return [{
      name: defaultBucket,
      creationDate: new Date(),
      region: provider.region || 'us-east-1',
      url: generateBucketUrl(provider, defaultBucket)
    }];
  }
}

/**
 * Liste les objets dans un bucket
 */
export async function listBucketObjects(
  provider: S3Provider,
  bucketName: string,
  prefix: string = '',
  delimiter: string = '/'
): Promise<S3Object[]> {
  try {
    console.log(`Listing objects for bucket: ${bucketName}, prefix: "${prefix}"`);
    
    const client = createS3Client(provider);
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: delimiter
    });
    
    const response = await client.send(command);
    const objects: S3Object[] = [];
    
    // Traiter les dossiers (CommonPrefixes)
    if (response.CommonPrefixes) {
      for (const commonPrefix of response.CommonPrefixes) {
        if (commonPrefix.Prefix) {
          const folderPath = commonPrefix.Prefix;
          const folderName = folderPath.replace(prefix, '').replace(/\/$/, '');
          
          if (folderName) {
            objects.push({
              key: folderPath,
              name: folderName,
              lastModified: null,
              size: 0,
              isFolder: true,
              fullPath: folderPath
            });
          }
        }
      }
    }
    
    // Traiter les fichiers (Contents)
    if (response.Contents) {
      for (const content of response.Contents) {
        if (content.Key && content.Key !== prefix) {
          const fileName = content.Key.replace(prefix, '');
          
          // Ignorer les fichiers vides ou qui font partie des dossiers déjà traités
          if (!fileName || objects.some(o => o.isFolder && content.Key?.startsWith(o.key))) {
            continue;
          }
          
          // Si le nom se termine par '/', c'est un dossier
          if (fileName.endsWith('/')) {
            const folderName = fileName.slice(0, -1);
            objects.push({
              key: content.Key,
              name: folderName,
              lastModified: content.LastModified || null,
              size: 0,
              isFolder: true,
              fullPath: content.Key
            });
          } else {
            objects.push({
              key: content.Key,
              name: fileName,
              lastModified: content.LastModified || null,
              size: content.Size || 0,
              isFolder: false,
              fullPath: content.Key
            });
          }
        }
      }
    }
    
    console.log(`Found ${objects.length} objects in bucket ${bucketName}`);
    return objects;
  } catch (error) {
    console.error('Error listing bucket objects:', error);
    throw error;
  }
}

/**
 * Extract bucket name from provider name
 */
export function extractBucketName(provider: S3Provider): string {
  try {
    // Extract bucket name from the provider name format: "Provider Name - BucketName"
    const nameMatch = provider.name.match(/- ([^(]+)(?:\s|$)/);
    if (nameMatch && nameMatch[1]) {
      const bucketName = nameMatch[1].trim();
      // Convert to lowercase for providers that require it
      if (['hetzner', 'digitalocean', 'vultr'].indexOf(provider.type) !== -1) {
        return bucketName.toLowerCase();
      }
      return bucketName;
    }
    
    // Fallback: use first part of provider name
    const fallbackName = provider.name.split(' ')[0].toLowerCase();
    return fallbackName || 'bucket';
  } catch (e) {
    console.error('Error extracting bucket name:', e);
    return 'bucket';
  }
}

/**
 * Get URL for downloading or viewing an object
 */
export function getObjectUrl(provider: S3Provider, bucketName: string, key: string): string {
  // Most S3-compatible providers use path-style URLs
  return `${provider.endpoint}/${bucketName}/${key}`;
}

/**
 * Generate bucket URL
 */
function generateBucketUrl(provider: S3Provider, bucketName: string): string {
  // All providers use path-style URLs for buckets
  return `${provider.endpoint}/${bucketName}`;
}

/**
 * Create an empty object in the bucket (used for creating folders)
 */
export async function createEmptyObject(provider: S3Provider, bucketName: string, key: string): Promise<void> {
  try {
    const client = createS3Client(provider);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: '',
    });
    
    await client.send(command);
  } catch (error) {
    console.error('Error creating empty object:', error);
    throw error;
  }
}

/**
 * Upload a file to S3 with progress tracking
 */
export async function uploadFile(
  provider: S3Provider,
  bucketName: string,
  key: string,
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const client = createS3Client(provider);
    
    // For React Native, we need to handle the file URI differently
    const response = await fetch(fileUri);
    const blobData = await response.blob();
    
    // Convert blob to buffer for S3 upload
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve: (value: ArrayBuffer) => void, reject: (reason?: any) => void) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result instanceof ArrayBuffer) {
          resolve(fileReader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(blobData);
    });

    // Convert ArrayBuffer to Uint8Array for AWS SDK
    const uint8Array = new Uint8Array(arrayBuffer);

    // Use multipart upload for better handling of large files
    const upload = new Upload({
      client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: uint8Array,
        ContentType: blobData.type || 'application/octet-stream',
      },
      queueSize: 4, // number of concurrent uploads
      partSize: 5 * 1024 * 1024, // 5MB part size
    });

    // Handle progress
    if (onProgress) {
      upload.on('httpUploadProgress', (progress: any) => {
        const percentage = Math.round((progress.loaded || 0) / (progress.total || 1) * 100);
        onProgress(percentage);
      });
    }

    await upload.done();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete an object from S3
 */
export async function deleteObject(provider: S3Provider, bucketName: string, key: string): Promise<void> {
  try {
    const client = createS3Client(provider);
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await client.send(command);
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
}

/**
 * Delete a folder and all its contents recursively
 */
export async function deleteFolder(provider: S3Provider, bucketName: string, folderKey: string): Promise<void> {
  try {
    // Ensure the folder key ends with a forward slash
    const normalizedFolderKey = folderKey.endsWith('/') ? folderKey : `${folderKey}/`;
    
    // List all objects in the folder recursively
    const objects = await listAllObjectsRecursively(provider, bucketName, normalizedFolderKey);
    
    console.log(`Found ${objects.length} objects to delete recursively`);
    
    // Delete all objects including nested folders
    for (const object of objects) {
      await deleteObject(provider, bucketName, object.key);
    }
    
    // Finally delete the folder itself
    await deleteObject(provider, bucketName, normalizedFolderKey);
    
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}

/**
 * Lister tous les objets dans un dossier de façon récursive (sans délimiteur)
 */
async function listAllObjectsRecursively(
  provider: S3Provider,
  bucketName: string,
  prefix: string = ''
): Promise<S3Object[]> {
  try {
    const client = createS3Client(provider);
    const objects: S3Object[] = [];
    let continuationToken: string | undefined;
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        // Pas de délimiteur pour avoir tous les objets récursivement
        ContinuationToken: continuationToken
      });
      
      const response = await client.send(command);
      
      if (response.Contents) {
        for (const content of response.Contents) {
          if (content.Key && content.Key !== prefix) {
            const key = content.Key;
            const name = key.split('/').pop() || key;
            
            // Si le nom se termine par '/', c'est un dossier
            if (key.endsWith('/')) {
              objects.push({
                key: key,
                name: name.slice(0, -1),
                lastModified: content.LastModified || null,
                size: 0,
                isFolder: true,
                fullPath: key
              });
            } else {
              objects.push({
                key: key,
                name: name,
                lastModified: content.LastModified || null,
                size: content.Size || 0,
                isFolder: false,
                fullPath: key
              });
            }
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return objects;
  } catch (error) {
    console.error('Error listing objects recursively:', error);
    throw error;
  }
}

/**
 * Copier un dossier et tout son contenu de façon récursive
 */
export async function copyFolder(
  provider: S3Provider,
  bucketName: string,
  sourceFolderKey: string,
  targetFolderKey: string
): Promise<void> {
  try {
    const client = createS3Client(provider);
    
    // Ensure the folder keys end with a forward slash
    const normalizedSourceKey = sourceFolderKey.endsWith('/') ? sourceFolderKey : `${sourceFolderKey}/`;
    const normalizedTargetKey = targetFolderKey.endsWith('/') ? targetFolderKey : `${targetFolderKey}/`;
    
    // List all objects in the source folder recursively
    const objects = await listAllObjectsRecursively(provider, bucketName, normalizedSourceKey);
    
    console.log(`Found ${objects.length} objects to copy recursively`);
    
    // Copy all objects including nested folders
    for (const object of objects) {
      // Calculate the relative path within the source folder
      const relativePath = object.key.substring(normalizedSourceKey.length);
      const targetKey = normalizedTargetKey + relativePath;
      
      if (object.isFolder) {
        // For folders, create an empty object to mark the folder
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: targetKey,
          Body: '',
        });
        await client.send(putCommand);
      } else {
        // Copy the file using S3 copy operation
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${object.key}`,
          Key: targetKey,
        });
        
        await client.send(copyCommand);
      }
    }
    
    // Create the target folder marker if it doesn't exist
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: normalizedTargetKey,
      Body: '',
    });
    
    await client.send(putCommand);
    
  } catch (error) {
    console.error('Error copying folder:', error);
    throw error;
  }
}

/**
 * Renommer un dossier et tout son contenu de façon récursive
 */
export async function renameFolder(
  provider: S3Provider,
  bucketName: string,
  oldFolderKey: string,
  newFolderKey: string
): Promise<void> {
  try {
    // First copy the folder to the new location
    await copyFolder(provider, bucketName, oldFolderKey, newFolderKey);
    
    // Then delete the original folder
    await deleteFolder(provider, bucketName, oldFolderKey);
    
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
}

/**
 * Générer une URL signée pour un objet (AWS ou Hetzner)
 */
export async function getSignedObjectUrl(
  provider: S3Provider,
  bucketName: string,
  key: string,
  expireSeconds: number = 300
): Promise<string> {
  const client = createS3Client(provider);
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expireSeconds });
} 