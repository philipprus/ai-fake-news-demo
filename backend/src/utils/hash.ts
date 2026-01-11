import { createHash } from 'crypto';

/**
 * Generate a stable hash from a URL to use as article ID
 */
export function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').substring(0, 16);
}
