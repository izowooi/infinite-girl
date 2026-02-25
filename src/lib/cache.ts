import type { Element } from '@/types/game';

interface CacheEntry {
  result: Element;
  expiresAt: number;
}

// 서버사이드 인메모리 캐시 (Cloudflare KV 도입 전 로컬 개발용)
const combinationCache = new Map<string, CacheEntry>();
const TTL_MS = 1000 * 60 * 60; // 1시간

export function getCombinationKey(elementAId: string, elementBId: string): string {
  const [a, b] = [elementAId, elementBId].sort();
  return `${a}:${b}`;
}

export function getCached(key: string): Element | null {
  const entry = combinationCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    combinationCache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCached(key: string, element: Element): void {
  combinationCache.set(key, {
    result: element,
    expiresAt: Date.now() + TTL_MS,
  });
}
