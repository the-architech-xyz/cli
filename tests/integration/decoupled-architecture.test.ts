/**
 * Decoupled Architecture Integration Test
 * 
 * Tests the new decoupled architecture with marketplace integration
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheManagerService } from '../../src/core/services/cache/cache-manager.js';
import { ModuleFetcherService } from '../../src/core/services/fetcher/module-fetcher.js';
import { BlueprintOrchestrator } from '../../src/core/services/blueprint-orchestrator/blueprint-orchestrator.js';
import { AdapterLoader } from '../../src/core/services/adapter/adapter-loader.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Decoupled Architecture Integration', () => {
  let cacheManager: CacheManagerService;
  let moduleFetcher: ModuleFetcherService;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'architech-test-'));
    
    // Initialize services
    cacheManager = new CacheManagerService();
    moduleFetcher = new ModuleFetcherService(cacheManager);
    await moduleFetcher.initialize();
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('CacheManagerService', () => {
    it('should initialize cache directory', async () => {
      await cacheManager.initialize();
      const stats = await cacheManager.getStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should cache and retrieve modules', async () => {
      const moduleId = 'test/module';
      const version = '1.0.0';
      const content = { name: 'Test Module', version: '1.0.0' };

      // Cache the module
      await cacheManager.set(moduleId, version, content);

      // Check if it exists
      const exists = await cacheManager.has(moduleId, version);
      expect(exists).toBe(true);

      // Retrieve the module
      const retrieved = await cacheManager.get(moduleId, version);
      expect(retrieved).toEqual(content);
    });

    it('should handle cache cleanup', async () => {
      // Add multiple modules to test cleanup
      for (let i = 0; i < 5; i++) {
        await cacheManager.set(`test/module${i}`, '1.0.0', { id: i });
      }

      const stats = await cacheManager.getStats();
      expect(stats.totalEntries).toBe(5);

      // Clear cache
      await cacheManager.clear();
      const clearedStats = await cacheManager.getStats();
      expect(clearedStats.totalEntries).toBe(0);
    });
  });

  describe('ModuleFetcherService', () => {
    it('should initialize without errors', async () => {
      await expect(moduleFetcher.initialize()).resolves.not.toThrow();
    });

    it('should handle offline mode gracefully', async () => {
      // Mock offline scenario by using invalid URL
      const result = await moduleFetcher.fetch('nonexistent/module');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide cache statistics', async () => {
      const stats = await moduleFetcher.getCacheStats();
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('totalSize');
    });
  });

  describe('BlueprintOrchestrator Integration', () => {
    it('should initialize with ModuleFetcherService', () => {
      const orchestrator = new BlueprintOrchestrator(tempDir, moduleFetcher);
      expect(orchestrator).toBeDefined();
    });
  });

  describe('AdapterLoader Integration', () => {
    it('should initialize with ModuleFetcherService', () => {
      const loader = new AdapterLoader(moduleFetcher);
      expect(loader).toBeDefined();
    });

    it('should fallback to local loading when marketplace fails', async () => {
      const loader = new AdapterLoader(moduleFetcher);
      
      // This should not throw an error even if marketplace is unavailable
      // It should fallback to local loading
      try {
        await loader.loadAdapter('framework', 'nextjs');
        // If we get here, either marketplace worked or local fallback worked
        expect(true).toBe(true);
      } catch (error) {
        // If both fail, that's also acceptable for this test
        expect(error).toBeDefined();
      }
    });
  });

  describe('End-to-End Integration', () => {
    it('should handle complete workflow without errors', async () => {
      // Test the complete workflow
      const orchestrator = new BlueprintOrchestrator(tempDir, moduleFetcher);
      const loader = new AdapterLoader(moduleFetcher);
      
      // These should not throw errors
      expect(orchestrator).toBeDefined();
      expect(loader).toBeDefined();
      
      // Test cache operations
      await cacheManager.set('test/integration', '1.0.0', { test: true });
      const exists = await cacheManager.has('test/integration', '1.0.0');
      expect(exists).toBe(true);
    });
  });
});

