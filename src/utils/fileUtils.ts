/**
 * Image file extensions that should display as thumbnails
 */
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif', '.ico', '.heic', '.heif'
];

/**
 * CSV file extensions
 */
const CSV_EXTENSIONS = [
  '.csv'
];

/**
 * JSON file extensions
 */
const JSON_EXTENSIONS = [
  '.json'
];

/**
 * YAML file extensions
 */
const YAML_EXTENSIONS = [
  '.yaml', '.yml'
];

/**
 * Text file extensions that can be viewed as plain text
 */
const TEXT_EXTENSIONS = [
  '.txt', '.md', '.log', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', 
  '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.php', '.rb', '.go', '.rs', 
  '.sh', '.bat', '.yml', '.yaml', '.ini', '.conf', '.cfg'
];

/**
 * Checks if a file is an image based on its file extension
 * @param filename The name of the file
 * @returns true if the file is an image, false otherwise
 */
export function isImageFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return IMAGE_EXTENSIONS.includes(extension);
}

/**
 * Gets the file extension from a filename (including the dot)
 * @param filename The name of the file
 * @returns The file extension in lowercase (e.g., '.jpg', '.png')
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Checks if a file is a HEIC/HEIF image based on its file extension
 * @param filename The name of the file
 * @returns true if the file is a HEIC/HEIF image, false otherwise
 */
export function isHeicFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return extension === '.heic' || extension === '.heif';
}

/**
 * Checks if a file is a CSV file based on its file extension
 * @param filename The name of the file
 * @returns true if the file is a CSV file, false otherwise
 */
export function isCsvFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return CSV_EXTENSIONS.includes(extension);
}

/**
 * Checks if a file is a JSON file based on its file extension
 * @param filename The name of the file
 * @returns true if the file is a JSON file, false otherwise
 */
export function isJsonFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return JSON_EXTENSIONS.includes(extension);
}

/**
 * Checks if a file is a YAML file based on its file extension
 * @param filename The name of the file
 * @returns true if the file is a YAML file, false otherwise
 */
export function isYamlFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return YAML_EXTENSIONS.includes(extension);
}

/**
 * Checks if a file is a text file based on its file extension
 * @param filename The name of the file
 * @returns true if the file is a text file, false otherwise
 */
export function isTextFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return TEXT_EXTENSIONS.includes(extension);
}

/**
 * Gets the file type for display purposes
 * @param filename The name of the file
 * @returns A string representing the file type
 */
export function getFileType(filename: string): string {
  if (isImageFile(filename)) return 'image';
  if (isCsvFile(filename)) return 'csv';
  if (isJsonFile(filename)) return 'json';
  if (isYamlFile(filename)) return 'yaml';
  if (isTextFile(filename)) return 'text';
  return 'file';
}