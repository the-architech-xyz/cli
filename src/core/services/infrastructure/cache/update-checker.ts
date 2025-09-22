/**
 * Update Checker Service
 * 
 * Handles module update detection and user prompts for updates.
 * Integrates with CacheManagerService to provide intelligent update management.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { CacheManagerService, UpdateInfo } from './cache-manager.js';
import { ModuleFetcherService } from '../../module-management/fetcher/module-fetcher.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

export interface ModuleUpdateInfo {
  moduleId: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  lastModified: Date;
  updateSize?: number;
  description?: string;
}

export interface UpdatePromptOptions {
  forceCheck?: boolean;
  autoUpdate?: boolean;
  silent?: boolean;
}

export class UpdateChecker {
  private cacheManager: CacheManagerService;
  private moduleFetcher: ModuleFetcherService;

  constructor(cacheManager: CacheManagerService, moduleFetcher: ModuleFetcherService) {
    this.cacheManager = cacheManager;
    this.moduleFetcher = moduleFetcher;
  }

  /**
   * Check all modules for updates
   */
  async checkAllModules(moduleIds: string[]): Promise<ModuleUpdateInfo[]> {
    console.log('🔍 Checking for module updates...');
    
    const updateInfos: ModuleUpdateInfo[] = [];
    
    for (const moduleId of moduleIds) {
      try {
        const updateInfo = await this.cacheManager.checkForUpdates(moduleId);
        
        if (updateInfo.hasUpdate) {
          updateInfos.push({
            moduleId: updateInfo.moduleId,
            currentVersion: updateInfo.currentVersion,
            latestVersion: updateInfo.latestVersion,
            hasUpdate: updateInfo.hasUpdate,
            lastModified: updateInfo.lastModified,
            description: `Module ${moduleId} has updates available`
          });
        }
      } catch (error) {
        console.warn(`⚠️  Failed to check updates for ${moduleId}:`, error);
      }
    }
    
    return updateInfos;
  }

  /**
   * Prompt user for updates
   */
  async promptUserForUpdates(updates: ModuleUpdateInfo[], options: UpdatePromptOptions = {}): Promise<boolean> {
    if (updates.length === 0) {
      if (!options.silent) {
        console.log('✅ All modules are up to date');
      }
      return false;
    }

    if (options.autoUpdate) {
      console.log(`🔄 Auto-updating ${updates.length} modules...`);
      return true;
    }

    if (options.silent) {
      return false;
    }

    console.log(chalk.yellow(`\n🔄 ${updates.length} module(s) have updates available:`));
    
    updates.forEach((update, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${update.moduleId}`));
      console.log(chalk.gray(`     Current: ${update.currentVersion} → Latest: ${update.latestVersion}`));
      if (update.description) {
        console.log(chalk.gray(`     ${update.description}`));
      }
      console.log('');
    });

    const { shouldUpdate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldUpdate',
        message: 'Would you like to update these modules before generation?',
        default: true
      }
    ]);

    return shouldUpdate;
  }

  /**
   * Update specific modules
   */
  async updateModules(moduleIds: string[]): Promise<void> {
    console.log(`🔄 Updating ${moduleIds.length} module(s)...`);
    
    for (const moduleId of moduleIds) {
      try {
        console.log(`  📦 Updating ${moduleId}...`);
        
        // Invalidate cache for this module
        await this.cacheManager.invalidateModule(moduleId);
        
        // Fetch fresh version
        const result = await this.moduleFetcher.fetch(moduleId, 'latest');
        
        if (result.success) {
          console.log(`  ✅ Updated ${moduleId}`);
        } else {
          console.warn(`  ⚠️  Failed to update ${moduleId}: ${result.error}`);
        }
      } catch (error) {
        console.warn(`  ⚠️  Error updating ${moduleId}:`, error);
      }
    }
    
    console.log('✅ Module updates completed');
  }

  /**
   * Check and handle updates for a generation session
   */
  async checkAndHandleUpdates(
    moduleIds: string[], 
    options: UpdatePromptOptions = {}
  ): Promise<{ updated: boolean; updatedModules: string[] }> {
    try {
      // Check for updates
      const updates = await this.checkAllModules(moduleIds);
      
      if (updates.length === 0) {
        return { updated: false, updatedModules: [] };
      }

      // Prompt user (unless auto-update or silent)
      const shouldUpdate = await this.promptUserForUpdates(updates, options);
      
      if (!shouldUpdate) {
        console.log('ℹ️  Continuing with cached modules...');
        return { updated: false, updatedModules: [] };
      }

      // Update modules
      const moduleIdsToUpdate = updates.map(u => u.moduleId);
      await this.updateModules(moduleIdsToUpdate);
      
      return { updated: true, updatedModules: moduleIdsToUpdate };
    } catch (error) {
      console.warn('⚠️  Update check failed:', error);
      return { updated: false, updatedModules: [] };
    }
  }

  /**
   * Force refresh all modules (clear cache and re-fetch)
   */
  async forceRefreshAll(moduleIds: string[]): Promise<void> {
    console.log('🔄 Force refreshing all modules...');
    
    for (const moduleId of moduleIds) {
      await this.cacheManager.invalidateModule(moduleId);
    }
    
    await this.updateModules(moduleIds);
  }

  /**
   * Get update statistics
   */
  async getUpdateStats(): Promise<{
    totalModules: number;
    modulesWithUpdates: number;
    lastChecked: Date | null;
  }> {
    const stats = await this.cacheManager.getStats();
    
    return {
      totalModules: stats.totalEntries,
      modulesWithUpdates: stats.modulesWithUpdates,
      lastChecked: stats.newestEntry
    };
  }
}
