import { redisClient } from '../../config/redis';
import { InstitutionConfig, GlobalConfig, CacheEntry } from './types';

export class ConfigurationCache {
  private readonly INSTITUTION_CONFIG_PREFIX = 'config:institution:';
  private readonly GLOBAL_CONFIG_KEY = 'config:global';
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private readonly GLOBAL_CONFIG_TTL = 1800; // 30 minutes for global config

  /**
   * Get institution configuration from cache
   */
  async getInstitutionConfig(institutionId: string): Promise<InstitutionConfig | null> {
    try {
      const key = this.getInstitutionKey(institutionId);
      const cached = await redisClient.get(key);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<InstitutionConfig> = JSON.parse(cached);
      
      // Check if cache entry has expired
      if (this.isExpired(entry)) {
        await this.invalidateInstitutionConfig(institutionId);
        return null;
      }

      // Parse dates back from JSON
      entry.data.lastUpdated = new Date(entry.data.lastUpdated);
      
      return entry.data;
    } catch (error) {
      console.error('Error getting institution config from cache:', error);
      return null;
    }
  }

  /**
   * Set institution configuration in cache
   */
  async setInstitutionConfig(institutionId: string, config: InstitutionConfig): Promise<void> {
    try {
      const key = this.getInstitutionKey(institutionId);
      const entry: CacheEntry<InstitutionConfig> = {
        data: config,
        timestamp: new Date(),
        ttl: this.DEFAULT_TTL
      };

      await redisClient.setEx(key, this.DEFAULT_TTL, JSON.stringify(entry));
      
      // Also set a shorter TTL for quick access patterns
      const quickKey = `${key}:quick`;
      await redisClient.setEx(quickKey, 300, JSON.stringify(config)); // 5 minutes
      
    } catch (error) {
      console.error('Error setting institution config in cache:', error);
      // Don't throw error, caching is not critical
    }
  }

  /**
   * Invalidate institution configuration cache
   */
  async invalidateInstitutionConfig(institutionId: string): Promise<void> {
    try {
      const key = this.getInstitutionKey(institutionId);
      const quickKey = `${key}:quick`;
      
      await Promise.all([
        redisClient.del(key),
        redisClient.del(quickKey)
      ]);
      
      // Also invalidate any feature-specific caches
      await this.invalidateFeatureCaches(institutionId);
      
    } catch (error) {
      console.error('Error invalidating institution config cache:', error);
    }
  }

  /**
   * Get global configuration from cache
   */
  async getGlobalConfig(): Promise<GlobalConfig | null> {
    try {
      const cached = await redisClient.get(this.GLOBAL_CONFIG_KEY);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<GlobalConfig> = JSON.parse(cached);
      
      // Check if cache entry has expired
      if (this.isExpired(entry)) {
        await this.invalidateGlobalConfig();
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error getting global config from cache:', error);
      return null;
    }
  }

  /**
   * Set global configuration in cache
   */
  async setGlobalConfig(config: GlobalConfig): Promise<void> {
    try {
      const entry: CacheEntry<GlobalConfig> = {
        data: config,
        timestamp: new Date(),
        ttl: this.GLOBAL_CONFIG_TTL
      };

      await redisClient.setEx(this.GLOBAL_CONFIG_KEY, this.GLOBAL_CONFIG_TTL, JSON.stringify(entry));
      
    } catch (error) {
      console.error('Error setting global config in cache:', error);
    }
  }

  /**
   * Invalidate global configuration cache
   */
  async invalidateGlobalConfig(): Promise<void> {
    try {
      await redisClient.del(this.GLOBAL_CONFIG_KEY);
      
      // Also invalidate all institution configs since global settings can override them
      await this.invalidateAllInstitutionConfigs();
      
    } catch (error) {
      console.error('Error invalidating global config cache:', error);
    }
  }

  /**
   * Cache specific feature status for quick access
   */
  async cacheFeatureStatus(institutionId: string, featureName: string, isEnabled: boolean): Promise<void> {
    try {
      const key = `feature:${institutionId}:${featureName}`;
      await redisClient.setEx(key, 300, JSON.stringify(isEnabled)); // 5 minutes TTL
    } catch (error) {
      console.error('Error caching feature status:', error);
    }
  }

  /**
   * Get cached feature status
   */
  async getCachedFeatureStatus(institutionId: string, featureName: string): Promise<boolean | null> {
    try {
      const key = `feature:${institutionId}:${featureName}`;
      const cached = await redisClient.get(key);
      
      if (cached === null) {
        return null;
      }
      
      return JSON.parse(cached);
    } catch (error) {
      console.error('Error getting cached feature status:', error);
      return null;
    }
  }

  /**
   * Cache current usage statistics for limits checking
   */
  async cacheUsageStats(institutionId: string, stats: Record<string, number>): Promise<void> {
    try {
      const key = `usage:${institutionId}`;
      await redisClient.setEx(key, 600, JSON.stringify(stats)); // 10 minutes TTL
    } catch (error) {
      console.error('Error caching usage stats:', error);
    }
  }

  /**
   * Get cached usage statistics
   */
  async getCachedUsageStats(institutionId: string): Promise<Record<string, number> | null> {
    try {
      const key = `usage:${institutionId}`;
      const cached = await redisClient.get(key);
      
      if (!cached) {
        return null;
      }
      
      return JSON.parse(cached);
    } catch (error) {
      console.error('Error getting cached usage stats:', error);
      return null;
    }
  }

  /**
   * Preload configurations for multiple institutions
   */
  async preloadInstitutionConfigs(institutionIds: string[]): Promise<void> {
    try {
      const keys = institutionIds.map(id => this.getInstitutionKey(id));
      const cached = await redisClient.mGet(keys);
      
      // Log cache hit rate for monitoring
      const hits = cached.filter(c => c !== null).length;
      const hitRate = (hits / institutionIds.length) * 100;
      
      console.log(`Configuration cache preload: ${hits}/${institutionIds.length} hits (${hitRate.toFixed(1)}%)`);
      
    } catch (error) {
      console.error('Error preloading institution configs:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed configurations
   */
  async warmupCache(institutionIds: string[]): Promise<void> {
    // This would be called during application startup or periodically
    // to ensure frequently accessed configurations are cached
    console.log(`Warming up configuration cache for ${institutionIds.length} institutions`);
    
    // The actual warming would be done by the ConfigurationService
    // by calling getInstitutionConfig for each institution
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    institutionConfigCount: number;
    globalConfigCached: boolean;
    featureCacheCount: number;
    usageCacheCount: number;
  }> {
    try {
      const [institutionKeys, featureKeys, usageKeys, globalExists] = await Promise.all([
        redisClient.keys(`${this.INSTITUTION_CONFIG_PREFIX}*`),
        redisClient.keys('feature:*'),
        redisClient.keys('usage:*'),
        redisClient.exists(this.GLOBAL_CONFIG_KEY)
      ]);

      return {
        institutionConfigCount: institutionKeys.length,
        globalConfigCached: globalExists === 1,
        featureCacheCount: featureKeys.length,
        usageCacheCount: usageKeys.length
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        institutionConfigCount: 0,
        globalConfigCached: false,
        featureCacheCount: 0,
        usageCacheCount: 0
      };
    }
  }

  /**
   * Clear all configuration caches (use with caution)
   */
  async clearAllCaches(): Promise<void> {
    try {
      const [institutionKeys, featureKeys, usageKeys] = await Promise.all([
        redisClient.keys(`${this.INSTITUTION_CONFIG_PREFIX}*`),
        redisClient.keys('feature:*'),
        redisClient.keys('usage:*')
      ]);

      const allKeys = [
        ...institutionKeys,
        ...featureKeys,
        ...usageKeys,
        this.GLOBAL_CONFIG_KEY
      ];

      if (allKeys.length > 0) {
        await redisClient.del(allKeys);
      }

      console.log(`Cleared ${allKeys.length} configuration cache entries`);
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }

  // Private helper methods

  private getInstitutionKey(institutionId: string): string {
    return `${this.INSTITUTION_CONFIG_PREFIX}${institutionId}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const now = new Date();
    const entryTime = new Date(entry.timestamp);
    const ageInSeconds = (now.getTime() - entryTime.getTime()) / 1000;
    
    return ageInSeconds > entry.ttl;
  }

  private async invalidateFeatureCaches(institutionId: string): Promise<void> {
    try {
      const featureKeys = await redisClient.keys(`feature:${institutionId}:*`);
      if (featureKeys.length > 0) {
        await redisClient.del(featureKeys);
      }
    } catch (error) {
      console.error('Error invalidating feature caches:', error);
    }
  }

  private async invalidateAllInstitutionConfigs(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.INSTITUTION_CONFIG_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Error invalidating all institution configs:', error);
    }
  }

  /**
   * Set cache with custom TTL
   */
  async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting cache with TTL:', error);
    }
  }

  /**
   * Get cache entry with metadata
   */
  async getWithMetadata(key: string): Promise<{ value: any; ttl: number } | null> {
    try {
      const [value, ttl] = await Promise.all([
        redisClient.get(key),
        redisClient.ttl(key)
      ]);

      if (value === null) {
        return null;
      }

      return {
        value: JSON.parse(value),
        ttl
      };
    } catch (error) {
      console.error('Error getting cache with metadata:', error);
      return null;
    }
  }

  /**
   * Batch invalidate multiple keys
   */
  async batchInvalidate(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Error batch invalidating keys:', error);
    }
  }
}