/**
 * Cache Manager Service
 * 
 * Intelligent caching system with version tracking and update detection.
 * Provides automatic cache invalidation and user update prompts.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  modulesWithUpdates: number;
}

export interface UpdateInfo {
  moduleId: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  lastChecked: Date;
  updateAvailable: boolean;
  lastModified: Date;
}

export interface CacheEntry {
  content: any;
  version: string;
  lastModified: Date;
  checksum: string;
  metadata: {
    moduleId: string;
    fetchedAt: Date;
    size: number;
  };
}

export class CacheManagerService {
  private cacheDir: string;
  private manifestPath: string;
  private updateCheckInterval: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), '.architech-cache');
    this.manifestPath = path.join(this.cacheDir, 'manifest.json');
  }

  /**
   * Initialize the cache system
   */
  async initialize(): Promise<void> {
    try {
      // Create cache directory if it doesn't exist
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // Initialize manifest if it doesn't exist
      if (!await this.manifestExists()) {
        await this.createManifest();
      }
      
    } catch (error) {
      throw new Error(`Failed to initialize cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a module version exists in cache
   */
  async has(moduleId: string, version: string): Promise<boolean> {
    try {
      const entryPath = this.getEntryPath(moduleId, version);
      const stats = await fs.stat(entryPath).catch(() => null);
      return stats !== null && stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Get a module from cache
   */
  async get(moduleId: string, version: string): Promise<any> {
    try {
      const entryPath = this.getEntryPath(moduleId, version);
      const entryData = await fs.readFile(entryPath, 'utf-8');
      const entry: CacheEntry = JSON.parse(entryData);
      
      // Verify checksum
      const contentChecksum = this.calculateChecksum(entry.content);
      if (contentChecksum !== entry.checksum) {
        console.warn(`⚠️  Cache entry checksum mismatch for ${moduleId}@${version}, removing...`);
        await this.remove(moduleId, version);
        return null;
      }
      
      return entry.content;
    } catch (error) {
      console.warn(`⚠️  Failed to read cache entry for ${moduleId}@${version}:`, error);
      return null;
    }
  }

  /**
   * Store a module in cache
   */
  async set(moduleId: string, version: string, content: any): Promise<void> {
    try {
      const entry: CacheEntry = {
        content,
        version,
        lastModified: new Date(),
        checksum: this.calculateChecksum(content),
        metadata: {
          moduleId,
          fetchedAt: new Date(),
          size: JSON.stringify(content).length
        }
      };

      const entryPath = this.getEntryPath(moduleId, version);
      await fs.mkdir(path.dirname(entryPath), { recursive: true });
      await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
      
      // Update manifest
      await this.updateManifest(moduleId, version, entry);
      
    } catch (error) {
      throw new Error(`Failed to cache ${moduleId}@${version}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a specific module version from cache
   */
  async remove(moduleId: string, version: string): Promise<void> {
    try {
      const entryPath = this.getEntryPath(moduleId, version);
      await fs.unlink(entryPath).catch(() => {}); // Ignore if file doesn't exist
      
      // Update manifest
      await this.removeFromManifest(moduleId, version);
    } catch (error) {
      console.warn(`⚠️  Failed to remove cache entry for ${moduleId}@${version}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await this.initialize();
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all cached versions for a module
   */
  async getCachedVersions(moduleId: string): Promise<string[]> {
    try {
      const manifest = await this.getManifest();
      return manifest.modules[moduleId]?.versions || [];
    } catch {
      return [];
    }
  }

  /**
   * Get last update time for a module version
   */
  async getLastUpdateTime(moduleId: string, version: string): Promise<Date | null> {
    try {
      const entryPath = this.getEntryPath(moduleId, version);
      const entryData = await fs.readFile(entryPath, 'utf-8');
      const entry: CacheEntry = JSON.parse(entryData);
      return entry.lastModified;
    } catch {
      return null;
    }
  }

  /**
   * Check for updates for a specific module
   */
  async checkForUpdates(moduleId: string): Promise<UpdateInfo> {
    try {
      const manifest = await this.getManifest();
      const moduleInfo = manifest.modules[moduleId];
      
      if (!moduleInfo) {
        return {
          moduleId,
          currentVersion: 'none',
          latestVersion: 'unknown',
          hasUpdate: false,
          lastChecked: new Date(),
          updateAvailable: false,
          lastModified: new Date()
        };
      }

      const currentVersion = moduleInfo.versions[0] || 'unknown';
      const lastChecked = new Date(moduleInfo.lastChecked || 0);
      const lastModified = new Date(moduleInfo.lastModified || 0);
      
      // For now, we'll assume updates are available if cache is older than 24 hours
      // In a real implementation, this would check against the marketplace
      const needsUpdate = (Date.now() - lastChecked.getTime()) > this.updateCheckInterval;
      
      return {
        moduleId,
        currentVersion,
        latestVersion: 'latest', // Would be fetched from marketplace
        hasUpdate: needsUpdate,
        lastChecked,
        updateAvailable: needsUpdate,
        lastModified
      };
    } catch (error) {
      console.warn(`⚠️  Failed to check updates for ${moduleId}:`, error);
      return {
        moduleId,
        currentVersion: 'unknown',
        latestVersion: 'unknown',
        hasUpdate: false,
        lastChecked: new Date(),
        updateAvailable: false,
        lastModified: new Date()
      };
    }
  }

  /**
   * Invalidate a module (mark for refresh)
   */
  async invalidateModule(moduleId: string): Promise<void> {
    try {
      const manifest = await this.getManifest();
      if (manifest.modules[moduleId]) {
        manifest.modules[moduleId].lastChecked = new Date(0).toISOString();
        await this.saveManifest(manifest);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to invalidate ${moduleId}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const manifest = await this.getManifest();
      const modules = Object.values(manifest.modules);
      
      let totalSize = 0;
      let oldestEntry: Date | null = null;
      let newestEntry: Date | null = null;
      let modulesWithUpdates = 0;

      for (const module of modules) {
        const moduleInfo = module as any; // Type assertion for manifest structure
        totalSize += moduleInfo.totalSize || 0;
        
        const lastModified = new Date(moduleInfo.lastModified || 0);
        if (!oldestEntry || lastModified < oldestEntry) {
          oldestEntry = lastModified;
        }
        if (!newestEntry || lastModified > newestEntry) {
          newestEntry = lastModified;
        }
        
        if (moduleInfo.needsUpdate) {
          modulesWithUpdates++;
        }
      }

      return {
        totalEntries: modules.length,
        totalSize,
        oldestEntry,
        newestEntry,
        modulesWithUpdates
      };
    } catch (error) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
        modulesWithUpdates: 0
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getEntryPath(moduleId: string, version: string): string {
    const safeModuleId = moduleId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeVersion = version.replace(/[^a-zA-Z0-9.-]/g, '_');
    return path.join(this.cacheDir, 'entries', safeModuleId, `${safeVersion}.json`);
  }

  private calculateChecksum(content: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }

  private async manifestExists(): Promise<boolean> {
    try {
      await fs.access(this.manifestPath);
      return true;
    } catch {
      return false;
    }
  }

  private async createManifest(): Promise<void> {
    const manifest = {
      version: '1.0.0',
      created: new Date().toISOString(),
      modules: {}
    };
    await this.saveManifest(manifest);
  }

  private async getManifest(): Promise<any> {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { version: '1.0.0', created: new Date().toISOString(), modules: {} };
    }
  }

  private async saveManifest(manifest: any): Promise<void> {
    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  private async updateManifest(moduleId: string, version: string, entry: CacheEntry): Promise<void> {
    const manifest = await this.getManifest();
    
    if (!manifest.modules[moduleId]) {
      manifest.modules[moduleId] = {
        versions: [],
        lastChecked: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalSize: 0,
        needsUpdate: false
      };
    }
    
    const moduleInfo = manifest.modules[moduleId];
    
    // Add version if not already present
    if (!moduleInfo.versions.includes(version)) {
      moduleInfo.versions.unshift(version); // Add to beginning
    }
    
    // Update metadata
    moduleInfo.lastModified = entry.lastModified.toISOString();
    moduleInfo.totalSize = (moduleInfo.totalSize || 0) + entry.metadata.size;
    
    await this.saveManifest(manifest);
  }

  private async removeFromManifest(moduleId: string, version: string): Promise<void> {
    const manifest = await this.getManifest();
    
    if (manifest.modules[moduleId]) {
      const moduleInfo = manifest.modules[moduleId];
      moduleInfo.versions = moduleInfo.versions.filter((v: string) => v !== version);
      
      if (moduleInfo.versions.length === 0) {
        delete manifest.modules[moduleId];
      }
      
      await this.saveManifest(manifest);
    }
  }
}
