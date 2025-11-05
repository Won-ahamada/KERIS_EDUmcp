/**
 * Cache System for MCP Server
 *
 * LRU 캐시를 사용한 메모리 기반 캐싱 시스템
 */

import { LRUCache } from 'lru-cache';
import { ErrorCode, MCPError } from './errors.js';

/**
 * 캐시 인터페이스
 */
export interface Cache<K extends string = string, V extends {} = any> {
  /**
   * 캐시에서 값 가져오기
   */
  get(key: K): Promise<V | undefined>;

  /**
   * 캐시에 값 저장
   */
  set(key: K, value: V, ttl?: number): Promise<void>;

  /**
   * 캐시에서 값 삭제
   */
  delete(key: K): Promise<boolean>;

  /**
   * 캐시 전체 삭제
   */
  clear(): Promise<void>;

  /**
   * 캐시에 키가 존재하는지 확인
   */
  has(key: K): Promise<boolean>;

  /**
   * 캐시 크기 반환
   */
  size(): Promise<number>;

  /**
   * 캐시 통계 정보 반환
   */
  stats(): Promise<CacheStats>;
}

/**
 * 캐시 통계 정보
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * 캐시 옵션
 */
export interface CacheOptions {
  /**
   * 최대 캐시 항목 수 (기본값: 500)
   */
  max?: number;

  /**
   * 기본 TTL (밀리초, 기본값: 1시간)
   */
  ttl?: number;

  /**
   * 크기 계산 함수
   */
  sizeCalculation?: (value: unknown) => number;

  /**
   * 값 삭제 시 콜백
   */
  dispose?: (value: unknown, key: string) => void;
}

/**
 * 메모리 기반 LRU 캐시 구현
 */
export class MemoryCache<K extends string = string, V extends {} = any> implements Cache<K, V> {
  private cache: LRUCache<K, V>;
  private hits: number = 0;
  private misses: number = 0;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.max || 500;

    this.cache = new LRUCache<K, V>({
      max: this.maxSize,
      ttl: options.ttl || 3600000, // 1시간 기본값
      sizeCalculation: options.sizeCalculation as any,
      dispose: (value, key) => {
        if (options.dispose) {
          options.dispose(value, String(key));
        }
      },
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  /**
   * 캐시에서 값 가져오기
   */
  async get(key: K): Promise<V | undefined> {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.hits++;
      console.log(`✅ Cache hit: ${String(key)}`);
    } else {
      this.misses++;
      console.log(`❌ Cache miss: ${String(key)}`);
    }

    return value;
  }

  /**
   * 캐시에 값 저장
   */
  async set(key: K, value: V, ttl?: number): Promise<void> {
    try {
      this.cache.set(key, value, {
        ttl: ttl ? ttl * 1000 : undefined,
      });
      console.log(`💾 Cached: ${String(key)}`);
    } catch (error) {
      throw new MCPError(
        ErrorCode.CACHE_WRITE_FAILED,
        `Failed to cache value for key: ${String(key)}`,
        {
          context: { key: String(key) },
          cause: error instanceof Error ? error : undefined,
        }
      );
    }
  }

  /**
   * 캐시에서 값 삭제
   */
  async delete(key: K): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️  Deleted from cache: ${String(key)}`);
    }
    return deleted;
  }

  /**
   * 캐시 전체 삭제
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('🧹 Cache cleared');
  }

  /**
   * 캐시에 키가 존재하는지 확인
   */
  async has(key: K): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * 캐시 크기 반환
   */
  async size(): Promise<number> {
    return this.cache.size;
  }

  /**
   * 캐시 통계 정보 반환
   */
  async stats(): Promise<CacheStats> {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 10000) / 100, // 백분율로 변환
    };
  }

  /**
   * 특정 패턴의 키 삭제
   */
  async deletePattern(pattern: RegExp): Promise<number> {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(String(key))) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    console.log(`🗑️  Deleted ${deletedCount} cache entries matching pattern: ${pattern}`);
    return deletedCount;
  }

  /**
   * 만료된 항목 제거
   */
  async purgeStale(): Promise<void> {
    this.cache.purgeStale();
    console.log('🧹 Purged stale cache entries');
  }

  /**
   * 캐시 덤프 (디버깅용)
   */
  async dump(): Promise<Array<[K, V]>> {
    return Array.from(this.cache.entries());
  }
}

/**
 * 캐시 키 생성 헬퍼
 */
export class CacheKeyBuilder {
  /**
   * API 요청 캐시 키 생성
   */
  static forApiRequest(
    providerId: string,
    endpointId: string,
    params: Record<string, unknown>
  ): string {
    const sortedParams = this.sortObject(params);
    const paramHash = JSON.stringify(sortedParams);
    return `api:${providerId}:${endpointId}:${paramHash}`;
  }

  /**
   * TOON 파일 캐시 키 생성
   */
  static forToonFile(filePath: string): string {
    return `toon:${filePath}`;
  }

  /**
   * Provider 스펙 캐시 키 생성
   */
  static forProviderSpec(providerId: string): string {
    return `spec:${providerId}`;
  }

  /**
   * 객체의 키를 정렬 (일관된 해시 생성을 위해)
   */
  private static sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      const value = obj[key];
      sorted[key] = typeof value === 'object' && value !== null
        ? this.sortObject(value as Record<string, unknown>)
        : value;
    }

    return sorted;
  }
}

/**
 * 캐시 데코레이터 (함수 결과 캐싱)
 */
export function cacheable<T extends (...args: unknown[]) => Promise<unknown>>(
  cache: Cache,
  keyBuilder: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyBuilder(...args);

      // 캐시 조회
      const cached = await cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // 원본 함수 실행
      const result = await originalMethod.apply(this, args);

      // 결과 캐싱
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * 캐시 팩토리
 */
export class CacheFactory {
  private static instances = new Map<string, Cache>();

  /**
   * 싱글톤 캐시 인스턴스 반환
   */
  static getInstance(name: string = 'default', options?: CacheOptions): Cache {
    if (!this.instances.has(name)) {
      this.instances.set(name, new MemoryCache(options));
    }
    return this.instances.get(name)!;
  }

  /**
   * 새로운 캐시 인스턴스 생성
   */
  static createCache(options?: CacheOptions): Cache {
    return new MemoryCache(options);
  }

  /**
   * 모든 캐시 초기화
   */
  static async clearAll(): Promise<void> {
    for (const cache of this.instances.values()) {
      await cache.clear();
    }
    this.instances.clear();
  }

  /**
   * 캐시 인스턴스 제거
   */
  static removeInstance(name: string): boolean {
    return this.instances.delete(name);
  }
}

/**
 * 사용 예시
 */
export const examples = {
  basic: async () => {
    // 기본 사용법
    const cache = new MemoryCache<string, any>({
      max: 100,
      ttl: 60000, // 1분
    });

    // 저장
    await cache.set('user:123', { id: 123, name: 'Alice' });

    // 조회
    const user = await cache.get('user:123');
    console.log(user);

    // 통계
    const stats = await cache.stats();
    console.log('Cache stats:', stats);
  },

  withKeyBuilder: async () => {
    // 키 빌더 사용
    const cache = new MemoryCache();

    const key = CacheKeyBuilder.forApiRequest(
      'school-alrimi',
      'school-basic-info',
      { sidoCode: '11', schulKndCode: '04' }
    );

    await cache.set(key, { schoolName: 'Example School' });
  },

  factory: async () => {
    // 팩토리 패턴 사용
    const apiCache = CacheFactory.getInstance('api', { max: 1000 });
    const toonCache = CacheFactory.getInstance('toon', { max: 50 });

    await apiCache.set('key1', 'value1');
    await toonCache.set('key2', 'value2');

    // 통계 확인
    console.log('API cache stats:', await apiCache.stats());
    console.log('TOON cache stats:', await toonCache.stats());
  },
};
