import { CacheEntry } from '../types';

/**
 * Service to handle caching of API responses.
 * Simulates the "Web Service" caching requirement by persisting data
 * to localStorage with Time-To-Live (TTL) enforcement.
 */

const CACHE_PREFIX = 'skyscout_cache_';
const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 minutes

export const getCachedData = <T>(key: string): T | null => {
  try {
    const fullKey = `${CACHE_PREFIX}${key.toLowerCase()}`;
    const itemStr = localStorage.getItem(fullKey);

    if (!itemStr) return null;

    const item: CacheEntry<T> = JSON.parse(itemStr);
    const now = Date.now();

    if (now > item.expiry) {
      localStorage.removeItem(fullKey);
      return null;
    }

    return item.data;
  } catch (error) {
    console.error("Cache retrieval error:", error);
    return null;
  }
};

export const setCachedData = <T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void => {
  try {
    const fullKey = `${CACHE_PREFIX}${key.toLowerCase()}`;
    const now = Date.now();
    const item: CacheEntry<T> = {
      data,
      timestamp: now,
      expiry: now + ttlMs,
    };
    localStorage.setItem(fullKey, JSON.stringify(item));
  } catch (error) {
    console.error("Cache storage error:", error);
  }
};

export const clearCache = (): void => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};
