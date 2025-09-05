import { isHeicFile, isImageFile } from './fileUtils';
import { isHeicConversionSupported } from './heicConverter';

/**
 * Test utility functions for HEIC support
 */

/**
 * Tests HEIC file detection
 */
export function testHeicDetection(): void {
  console.log('=== Testing HEIC Detection ===');
  
  const testFiles = [
    'photo.heic',
    'image.HEIC',
    'picture.heif',
    'document.HEIF',
    'regular.jpg',
    'normal.png'
  ];

  testFiles.forEach(filename => {
    const isHeic = isHeicFile(filename);
    const isImage = isImageFile(filename);
    console.log(`${filename}: isHeic=${isHeic}, isImage=${isImage}`);
  });
}

/**
 * Tests HEIC conversion support
 */
export function testHeicConversionSupport(): void {
  console.log('=== Testing HEIC Conversion Support ===');
  
  const isSupported = isHeicConversionSupported();
  console.log(`HEIC conversion supported: ${isSupported}`);
  
  // Test individual APIs
  console.log(`Blob available: ${typeof Blob !== 'undefined'}`);
  console.log(`URL available: ${typeof URL !== 'undefined'}`);
  console.log(`URL.createObjectURL available: ${typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined'}`);
}

/**
 * Logs information about a file for debugging
 */
export function logFileInfo(filename: string, size?: number): void {
  console.log(`=== File Info: ${filename} ===`);
  console.log(`Is HEIC: ${isHeicFile(filename)}`);
  console.log(`Is Image: ${isImageFile(filename)}`);
  console.log(`Size: ${size ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}`);
  console.log(`Conversion supported: ${isHeicConversionSupported()}`);
}