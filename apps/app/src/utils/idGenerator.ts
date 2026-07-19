/**
 * Simple ID generator that doesn't rely on crypto.getRandomValues()
 * This is a simple replacement for UUID when it's not available
 */
export function generateId(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const timestamp = new Date().getTime().toString(36);
  
  let result = timestamp;
  
  // Add random characters to reach desired length
  while (result.length < length) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  
  return result;
} 