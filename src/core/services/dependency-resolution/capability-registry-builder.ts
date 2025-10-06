/**
 * Capability Registry Builder
 * 
 * Builds the capability registry by scanning the marketplace
 */

import { CapabilityRegistry, ModuleProvider, ModuleConsumer, CapabilityConflict } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
import { Logger } from '../infrastructure/logging/logger.js';

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
    // This would scan the actual marketplace directory
    // For now, return mock modules
    return [
      { id: 'framework/nextjs', path: 'adapters/framework/nextjs' },
      { id: 'database/drizzle', path: 'adapters/database/drizzle' },
      { id: 'auth/better-auth', path: 'adapters/auth/better-auth' },
      { id: 'integrations/drizzle-nextjs-integration', path: 'integrations/drizzle-nextjs-integration' },
      { id: 'features/teams-dashboard', path: 'features/teams-dashboard/nextjs-shadcn' }
    ];
  }

  /**
   * Load module configuration
   */
  private async loadModuleConfig(module: any): Promise<any> {
    try {
      // This would load the actual adapter.json or feature.json
      // For now, return mock configs based on module ID
      return this.getMockConfig(module.id);
    } catch (error) {
      Logger.warn(`Failed to load config for ${module.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
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
