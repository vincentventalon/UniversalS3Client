/**
 * Image file extensions that should display as thumbnails
 */
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif', '.ico', '.heic', '.heif'
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
 * Text file extensions that can be edited
 */
const TEXT_EXTENSIONS = [
  '.txt', '.md', '.log', '.csv', '.tsv', '.xml', '.html', '.css', '.js', '.ts', 
  '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.php', '.rb', '.go', 
  '.rs', '.swift', '.kt', '.scala', '.sh', '.bat', '.ps1', '.yaml', '.yml', 
  '.toml', '.ini', '.conf', '.config', '.env', '.gitignore', '.dockerignore',
  '.dockerfile', '.makefile', '.readme', '.license', '.changelog'
];

/**
 * Checks if a file is a text file that can be edited
 * @param filename The name of the file
 * @returns true if the file is a text file, false otherwise
 */
export function isTextFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return TEXT_EXTENSIONS.includes(extension);
}

/**
 * Checks if a file is a JSON file
 * @param filename The name of the file
 * @returns true if the file is a JSON file, false otherwise
 */
export function isJsonFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return extension === '.json';
}

/**
 * Checks if a file is editable (text or JSON)
 * @param filename The name of the file
 * @returns true if the file is editable, false otherwise
 */
export function isEditableFile(filename: string): boolean {
  return isTextFile(filename) || isJsonFile(filename);
}