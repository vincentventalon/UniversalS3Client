import heic2any from 'heic2any';

/**
 * Options for HEIC conversion
 */
export interface HeicConversionOptions {
  /** Output format (default: 'image/jpeg') */
  toType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Quality for JPEG output (0-1, default: 0.8) */
  quality?: number;
  /** Whether to return multiple images if HEIC contains multiple frames */
  multiple?: boolean;
}

/**
 * Converts a HEIC image blob to another format
 * @param heicBlob The HEIC image blob to convert
 * @param options Conversion options
 * @returns Promise that resolves to the converted image blob(s)
 */
export async function convertHeicToImage(
  heicBlob: Blob, 
  options: HeicConversionOptions = {}
): Promise<Blob | Blob[]> {
  const {
    toType = 'image/jpeg',
    quality = 0.8,
    multiple = false
  } = options;

  try {
    const result = await heic2any({
      blob: heicBlob,
      toType,
      quality,
      multiple
    });

    return result as Blob | Blob[];
  } catch (error) {
    console.error('Error converting HEIC image:', error);
    throw new Error(`Failed to convert HEIC image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a HEIC image from URL to another format
 * @param heicUrl The URL of the HEIC image to convert
 * @param options Conversion options
 * @returns Promise that resolves to the converted image blob(s)
 */
export async function convertHeicFromUrl(
  heicUrl: string, 
  options: HeicConversionOptions = {}
): Promise<Blob | Blob[]> {
  try {
    // Fetch the HEIC image
    const response = await fetch(heicUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch HEIC image: ${response.status} ${response.statusText}`);
    }

    const heicBlob = await response.blob();
    return await convertHeicToImage(heicBlob, options);
  } catch (error) {
    console.error('Error fetching and converting HEIC image:', error);
    throw new Error(`Failed to fetch and convert HEIC image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a blob URL from a converted image
 * @param blob The converted image blob
 * @returns The blob URL that can be used as image src
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revokes a blob URL to free memory
 * @param blobUrl The blob URL to revoke
 */
export function revokeBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl);
}

/**
 * Checks if HEIC conversion is supported in the current environment
 * @returns true if HEIC conversion is supported
 */
export function isHeicConversionSupported(): boolean {
  try {
    // Check if we have the necessary APIs
    return typeof Blob !== 'undefined' && 
           typeof URL !== 'undefined' && 
           typeof URL.createObjectURL !== 'undefined';
  } catch {
    return false;
  }
}