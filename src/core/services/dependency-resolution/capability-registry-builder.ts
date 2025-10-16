/**
 * Capability Registry Builder
 * 
 * Builds the capability registry by scanning the marketplace
 */

import { CapabilityRegistry, ModuleProvider, ModuleConsumer, CapabilityConflict } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CapabilityRegistryBuilder {
  constructor(private moduleService: ModuleService) {}

  /**
   * Build capability registry from marketplace
   */
  async buildRegistry(): Promise<CapabilityRegistry> {
    Logger.info('🏗️ Building capability registry from marketplace');
    
    const registry: CapabilityRegistry = {};
    
    try {
      // Scan all modules in marketplace
      const modules = await this.scanMarketplace();
      
      for (const module of modules) {
        const config = await this.loadModuleConfig(module);
        if (!config) continue;
        
        // Register capabilities
        if (config.capabilities) {
          for (const [capability, details] of Object.entries(config.capabilities)) {
            if (!registry[capability]) {
              registry[capability] = { providers: [], consumers: [], conflicts: [] };
            }
            
            registry[capability].providers.push({
              moduleId: module.id,
              capabilityVersion: (details as any).version || '1.0.0',
              confidence: this.calculateConfidence(module, capability),
              metadata: {
                description: (details as any).description,
                provides: (details as any).provides,
                requires: (details as any).requires
              }
            });
          }
        }
        
        // Register prerequisites
        if (config.prerequisites?.capabilities) {
          for (const capability of config.prerequisites.capabilities) {
            if (!registry[capability]) {
              registry[capability] = { providers: [], consumers: [], conflicts: [] };
            }
            
            registry[capability].consumers.push({
              moduleId: module.id,
              requiredVersion: '1.0.0',
              metadata: {
                description: `Required by ${module.id}`,
                context: 'prerequisite'
              }
            });
          }
        }
      }
      
      // Detect conflicts
      this.detectCapabilityConflicts(registry);
      
      Logger.info(`✅ Capability registry built: ${Object.keys(registry).length} capabilities`);
      return registry;
      
    } catch (error) {
      Logger.error(`❌ Failed to build capability registry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Scan marketplace for all modules
   */
  private async scanMarketplace(): Promise<any[]> {
    const modules: any[] = [];
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    
    // Scan adapters
    const adaptersPath = path.join(marketplaceRoot, 'adapters');
    if (await this.directoryExists(adaptersPath)) {
      const adapterCategories = await fs.readdir(adaptersPath);
      for (const category of adapterCategories) {
        const categoryPath = path.join(adaptersPath, category);
        if (await this.isDirectory(categoryPath)) {
          const adapters = await fs.readdir(categoryPath);
          for (const adapter of adapters) {
            if (await this.isDirectory(path.join(categoryPath, adapter))) {
              modules.push({
                id: `${category}/${adapter}`,
                path: `adapters/${category}/${adapter}`,
                type: 'adapter'
              });
            }
          }
        }
      }
    }
    
    // Scan connectors
    const connectorsPath = path.join(marketplaceRoot, 'connectors');
    if (await this.directoryExists(connectorsPath)) {
      const connectors = await fs.readdir(connectorsPath);
      for (const connector of connectors) {
        if (await this.isDirectory(path.join(connectorsPath, connector))) {
          modules.push({
            id: `connectors/${connector}`,
            path: `connectors/${connector}`,
            type: 'connector'
          });
        }
      }
    }
    
    // Scan features
    const featuresPath = path.join(marketplaceRoot, 'features');
    if (await this.directoryExists(featuresPath)) {
      const features = await fs.readdir(featuresPath);
      for (const feature of features) {
        if (await this.isDirectory(path.join(featuresPath, feature))) {
          modules.push({
            id: `features/${feature}`,
            path: `features/${feature}`,
            type: 'feature'
          });
        }
      }
    }
    
    return modules;
  }

  /**
   * Load module configuration
   */
  private async loadModuleConfig(module: any): Promise<any> {
    try {
      // Use MarketplaceService to load the actual configuration
      return await MarketplaceService.loadModuleConfig(module.id);
    } catch (error) {
      Logger.warn(`Failed to load config for ${module.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if path is a directory
   */
  private async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get mock configuration for testing
   */
  private getMockConfig(moduleId: string): any {
    const configs: Record<string, any> = {
      'framework/nextjs': {
        id: 'framework/nextjs',
        category: 'framework',
        version: '1.0.0',
        capabilities: {
          'api-routes': {
            version: '1.0.0',
            description: 'Next.js API routes',
            provides: ['api-routes', 'middleware']
          }
        },
        prerequisites: { modules: [], capabilities: [], adapters: [], integrators: [] }
      },
      'database/drizzle': {
        id: 'database/drizzle',
        category: 'adapter',
        version: '1.0.0',
        capabilities: {
          'database-orm': {
            version: '1.0.0',
            description: 'Type-safe SQL ORM',
            provides: ['sql', 'postgresql', 'mysql', 'sqlite']
          }
        },
        prerequisites: { modules: [], capabilities: [], adapters: [], integrators: [] }
      },
      'auth/better-auth': {
        id: 'auth/better-auth',
        category: 'adapter',
        version: '1.0.0',
        capabilities: {
          'user-authentication': {
            version: '1.0.0',
            description: 'User authentication system',
            provides: ['email-password', 'oauth', 'session-management']
          }
        },
        prerequisites: { modules: [], capabilities: [], adapters: [], integrators: [] }
      },
      'integrations/drizzle-nextjs-integration': {
        id: 'integrations/drizzle-nextjs-integration',
        category: 'integrator',
        version: '1.0.0',
        capabilities: {
          'database-nextjs-integration': {
            version: '1.0.0',
            description: 'Drizzle + Next.js integration',
            provides: ['teams-data-hooks', 'database-api-routes']
          }
        },
        prerequisites: {
          modules: ['database/drizzle', 'framework/nextjs'],
          capabilities: ['database-orm', 'api-routes']
        }
      },
      'features/teams-dashboard': {
        id: 'features/teams-dashboard',
        category: 'feature',
        version: '1.0.0',
        capabilities: {
          'teams-management': {
            version: '1.0.0',
            description: 'Teams management system',
            provides: ['teams-management', 'user-dashboard']
          }
        },
        prerequisites: {
          capabilities: ['teams-data-hooks', 'shadcn-ui', 'user-authentication'],
          adapters: ['nextjs'],
          integrators: ['drizzle-nextjs-integration']
        }
      }
    };

    return configs[moduleId] || null;
  }

  /**
   * Calculate confidence for a module capability
   */
  private calculateConfidence(module: any, capability: string): number {
    // Simplified confidence calculation
    // In reality, this would consider module maturity, usage stats, etc.
    return 95;
  }

  /**
   * Detect capability conflicts
   */
  private detectCapabilityConflicts(registry: CapabilityRegistry): void {
    for (const [capability, data] of Object.entries(registry)) {
      if (data.providers.length > 1) {
        const conflict: CapabilityConflict = {
          capability,
          providers: data.providers,
          severity: 'error',
          message: `Capability '${capability}' is provided by multiple modules: ${data.providers.map(p => p.moduleId).join(', ')}`
        };
        data.conflicts.push(conflict);
      }
    }
  }
}
