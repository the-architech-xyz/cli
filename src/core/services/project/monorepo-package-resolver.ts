/**
 * Monorepo Package Resolver
 * 
 * Determines which package (apps/web, apps/api, packages/shared, etc.)
 * a module should be executed in based on:
 * - Module type and layer (frontend/backend/tech-stack/database)
 * - Module usage (frontend-only, backend-only, or full-stack)
 * - Genome structure and apps configuration
 */

import { Genome, ResolvedGenome, Module } from '@thearchitech.xyz/types';
import { getProjectApps } from '../../utils/genome-helpers.js';
import { Logger } from '../infrastructure/logging/logger.js';

export interface ModuleUsage {
  frontend: boolean;
  backend: boolean;
}

export type ModuleLayer = 'frontend' | 'backend' | 'tech-stack' | 'database' | null;

export class MonorepoPackageResolver {
  /**
   * Determine which package a module should be executed in
   * 
   * Priority Order (Highest to Lowest):
   * 1. Genome module targetPackage (explicit) - ALWAYS respected
   * 2. Module metadata targetPackage (if preserved during conversion)
   * 3. Module ID patterns (ui/* → packages/ui, database/* → packages/database)
   * 4. Layer-based inference (tech-stack, database, frontend, backend)
   * 5. Usage-based inference (frontend-only, backend-only, full-stack)
   * 6. Module type-based inference (framework, feature, adapter, connector)
   * 
   * Strategy:
   * - UI libraries → packages/ui (reusable components)
   * - Database modules → packages/database (database logic)
   * - Frontend-only modules → apps/web (single app) or packages/shared (multiple apps)
   * - Backend-only modules → apps/api (if exists) or packages/shared
   * - Full-stack modules → packages/shared (shared between apps)
   * - Tech-stack layers → packages/shared (shared utilities)
   */
  static resolveTargetPackage(module: Module, genome: ResolvedGenome): string | null {
    // Check if genome defines monorepo structure
    if (genome.project.structure !== 'monorepo' || !genome.project.monorepo) {
      return null;
    }

    const monorepoConfig = genome.project.monorepo;
    const apps = getProjectApps(genome);
    
    Logger.debug(`🔍 Resolving target package for module: ${module.id}`, {
      operation: 'package_resolution',
      moduleId: module.id,
      structure: genome.project.structure
    });
    
    // PRIORITY 1: Check genome module targetPackage FIRST (HIGHEST PRIORITY)
    const genomeModule = this.findGenomeModule(module.id, genome);
    if (genomeModule && (genomeModule as any).targetPackage) {
      const targetPackage = (genomeModule as any).targetPackage;
      Logger.debug(`✅ Using explicit targetPackage from genome: ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id,
        targetPackage,
        source: 'genome_definition'
      });
      return targetPackage;
    }
    
    // PRIORITY 2: Check module.targetPackage (if preserved during conversion)
    if ((module as any).targetPackage) {
      const targetPackage = (module as any).targetPackage;
      Logger.debug(`✅ Using targetPackage from module metadata: ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id,
        targetPackage,
        source: 'module_metadata'
      });
      return targetPackage;
    }
    
    // PRIORITY 3: Module ID pattern-based detection (before layer inference)
    const moduleId = module.id.toLowerCase();
    
    // UI modules → packages/ui (reusable UI libraries)
    if (moduleId.includes('ui/') || moduleId.includes('tamagui') || moduleId.includes('shadcn') || moduleId.includes('mantine')) {
      const targetPackage = monorepoConfig.packages?.ui || 'packages/ui';
      Logger.debug(`✅ Resolved to UI package (UI library): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id,
        targetPackage,
        source: 'module_id_pattern'
      });
      return targetPackage;
    }
    
    // Database modules → packages/database (database logic)
    if (moduleId.includes('database/') || moduleId.includes('db/') || moduleId.includes('drizzle') || moduleId.includes('prisma') || moduleId.includes('typeorm')) {
      const targetPackage = monorepoConfig.packages?.database || 'packages/database';
      Logger.debug(`✅ Resolved to database package (database module): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id,
        targetPackage,
        source: 'module_id_pattern'
      });
      return targetPackage;
    }
    
    // PRIORITY 4: Layer-based inference
    const moduleLayer = this.inferModuleLayer(module.id);
    
    // Tech-stack layers → packages/shared (shared utilities)
    if (moduleLayer === 'tech-stack') {
      const targetPackage = monorepoConfig.packages?.shared || 'packages/shared';
      Logger.debug(`✅ Resolved to shared package (tech-stack layer): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id,
        layer: moduleLayer,
        targetPackage,
        source: 'layer_inference'
      });
      return targetPackage;
    }
    
    // Database layers → packages/database (NOT shared, database-specific)
    if (moduleLayer === 'database') {
      const targetPackage = monorepoConfig.packages?.database || 'packages/database';
      Logger.debug(`✅ Resolved to database package (database layer): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id,
        layer: moduleLayer,
        targetPackage,
        source: 'layer_inference'
      });
      return targetPackage;
    }
    
    // PRIORITY 5: Usage-based inference
    const usage = this.inferModuleUsage(module, moduleLayer);
    
    Logger.debug(`📊 Module usage analysis:`, {
      operation: 'package_resolution',
      moduleId: module.id,
      layer: moduleLayer,
      usage
    });
    
    if (usage.frontend && usage.backend) {
      // Full-stack or shared: goes to packages/shared
      const targetPackage = monorepoConfig.packages?.shared || 'packages/shared';
      Logger.debug(`✅ Resolved to shared package (full-stack): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id
      });
      return targetPackage;
    } else if (usage.frontend && !usage.backend) {
      // Frontend-only: check if multiple frontend apps
      const frontendApps = apps.filter((a: any) => a.type === 'web' || a.type === 'mobile');
      if (frontendApps.length > 1) {
        // Shared between multiple frontend apps → shared
        const targetPackage = monorepoConfig.packages?.shared || 'packages/shared';
        Logger.debug(`✅ Resolved to shared package (shared between multiple frontend apps): ${targetPackage}`, {
          operation: 'package_resolution',
          moduleId: module.id
        });
        return targetPackage;
      }
      // Default to web app
      const webApp = apps.find((a: any) => a.type === 'web');
      const targetPackage = webApp?.package || monorepoConfig.packages?.web || 'apps/web';
      Logger.debug(`✅ Resolved to web app (frontend-only): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id
      });
      return targetPackage;
    } else if (!usage.frontend && usage.backend) {
      // Backend-only: check if API app exists
      const apiApp = apps.find((a: any) => a.type === 'api');
      if (apiApp) {
        const targetPackage = apiApp.package || monorepoConfig.packages?.api || 'apps/api';
        Logger.debug(`✅ Resolved to API app (backend-only): ${targetPackage}`, {
          operation: 'package_resolution',
          moduleId: module.id
        });
        return targetPackage;
      }
      // Fallback to shared if no API app
      const targetPackage = monorepoConfig.packages?.shared || 'packages/shared';
      Logger.debug(`✅ Resolved to shared package (backend-only, no API app): ${targetPackage}`, {
        operation: 'package_resolution',
        moduleId: module.id
      });
      return targetPackage;
    }
    
    // 4. Fallback: module type-based logic
    const moduleType = this.getModuleType(module.id);
    
    switch (moduleType) {
      case 'framework':
        if (module.id.includes('nextjs')) {
          return monorepoConfig.packages?.web || 'apps/web';
        } else if (module.id.includes('expo')) {
          return monorepoConfig.packages?.mobile || 'apps/mobile';
        } else if (module.id.includes('api')) {
          return monorepoConfig.packages?.api || 'packages/api';
        }
        break;
      case 'feature':
        // Features with frontend layer → web, backend layer → api
        if (moduleLayer === 'frontend') {
          const webApp = apps.find((a: any) => a.type === 'web');
          return webApp?.package || monorepoConfig.packages?.web || 'apps/web';
        } else if (moduleLayer === 'backend') {
          const apiApp = apps.find((a: any) => a.type === 'api');
          return apiApp?.package || monorepoConfig.packages?.api || 'apps/api';
        }
        // Default to web
        return monorepoConfig.packages?.web || 'apps/web';
      case 'connector':
      case 'adapter':
        // Check usage first - if frontend-only, go to web app
        if (usage.frontend && !usage.backend) {
          const webApp = apps.find((a: any) => a.type === 'web');
          return webApp?.package || monorepoConfig.packages?.web || 'apps/web';
        }
        // Default to shared for adapters/connectors (typically used by multiple apps)
        return monorepoConfig.packages?.shared || 'packages/shared';
    }

    // PRIORITY 6: Default fallback
    const targetPackage = monorepoConfig.packages?.shared || 'packages/shared';
    Logger.debug(`✅ Resolved to shared package (default fallback): ${targetPackage}`, {
      operation: 'package_resolution',
      moduleId: module.id,
      targetPackage,
      source: 'default_fallback'
    });
    return targetPackage;
  }

  /**
   * Find genome module definition by module ID
   * Used to check for explicit targetPackage in genome
   */
  private static findGenomeModule(moduleId: string, genome: Genome): any {
    if (!genome.modules) {
      return null;
    }
    
    for (const module of genome.modules) {
      const moduleIdToCheck = typeof module === 'string' ? module : (module as any).id;
      if (moduleIdToCheck === moduleId) {
        return typeof module === 'string' ? null : module;
      }
    }
    
    return null;
  }

  /**
   * Infer module layer from module ID
   */
  private static inferModuleLayer(moduleId: string): ModuleLayer {
    const lowerId = moduleId.toLowerCase();
    
    if (lowerId.includes('/frontend') || lowerId.includes('/ui/')) {
      return 'frontend';
    }
    if (lowerId.includes('/backend') || lowerId.includes('/api/')) {
      return 'backend';
    }
    if (lowerId.includes('/tech-stack') || lowerId.includes('/techstack')) {
      return 'tech-stack';
    }
    if (lowerId.includes('/database') || lowerId.includes('/db/')) {
      return 'database';
    }
    
    return null;
  }

  /**
   * Infer module usage (frontend/backend/both) from module ID and layer
   * 
   * Improved inference logic based on best practices:
   * - UI modules are ALWAYS frontend-only (reusable components)
   * - Database modules are ALWAYS backend-focused (database logic)
   * - Auth/Payment/Email adapters are typically full-stack (shared)
   * - More specific detection before defaulting to full-stack
   */
  private static inferModuleUsage(module: Module, layer: ModuleLayer): ModuleUsage {
    const moduleId = module.id.toLowerCase();
    
    // Explicit layer detection
    if (layer === 'frontend') {
      return { frontend: true, backend: false };
    }
    if (layer === 'backend') {
      return { frontend: false, backend: true };
    }
    if (layer === 'tech-stack') {
      // Tech-stack utilities are typically shared
      return { frontend: true, backend: true };
    }
    if (layer === 'database') {
      // Database is backend-focused, but schemas/types may be used by frontend
      // For now, treat as backend-only (schemas will be in shared if needed)
      return { frontend: false, backend: true };
    }
    
    // CRITICAL: UI modules are ALWAYS frontend-only (reusable UI libraries)
    if (moduleId.includes('ui/') || moduleId.includes('tamagui') || moduleId.includes('shadcn') || moduleId.includes('mantine')) {
      return { frontend: true, backend: false };
    }
    
    // CRITICAL: Database modules are ALWAYS backend-focused
    if (moduleId.includes('database/') || moduleId.includes('db/') || moduleId.includes('drizzle') || moduleId.includes('prisma') || moduleId.includes('typeorm')) {
      return { frontend: false, backend: true };
    }
    
    // Adapter/connector detection
    const moduleType = this.getModuleType(module.id);
    
    // Auth adapters are typically full-stack (used by frontend and backend)
    if (moduleId.includes('auth/') || moduleId.includes('better-auth')) {
      return { frontend: true, backend: true };
    }
    
    // Payment adapters are typically full-stack (used by frontend and backend)
    if (moduleId.includes('payment/') || moduleId.includes('stripe') || moduleId.includes('revenuecat')) {
      return { frontend: true, backend: true };
    }
    
    // Email adapters are typically full-stack (used by frontend and backend)
    if (moduleId.includes('email/') || moduleId.includes('resend') || moduleId.includes('sendgrid')) {
      return { frontend: true, backend: true };
    }
    
    // Infrastructure connectors (query, state management) are frontend-only if they target a specific framework
    if (moduleId.includes('infrastructure/') && (moduleId.includes('nextjs') || moduleId.includes('react') || moduleId.includes('query'))) {
      return { frontend: true, backend: false };
    }
    
    // Data fetching (tRPC, React Query) - check if it's frontend-only or full-stack
    if (moduleId.includes('trpc') || moduleId.includes('data-fetching')) {
      // If it's a connector to a specific framework, it's frontend-only
      if (moduleId.includes('nextjs') || moduleId.includes('react')) {
        return { frontend: true, backend: false };
      }
      // Otherwise, tRPC is full-stack (used by both frontend and backend)
      return { frontend: true, backend: true };
    }
    
    // Default for adapters/connectors: check more specifically
    if (moduleType === 'adapter' || moduleType === 'connector') {
      // Frontend-only indicators
      if (moduleId.includes('client') || moduleId.includes('react') || moduleId.includes('nextjs') || moduleId.includes('query') || moduleId.includes('expo')) {
        return { frontend: true, backend: false };
      }
      // Backend-only indicators
      if (moduleId.includes('server') || moduleId.includes('api') || moduleId.includes('hono')) {
        return { frontend: false, backend: true };
      }
      // Default: shared (full-stack) - but this should be less common now
      return { frontend: true, backend: true };
    }
    
    // Default: assume frontend-only (most features are frontend)
    return { frontend: true, backend: false };
  }

  /**
   * Get module type from module ID
   */
  private static getModuleType(moduleId: string): 'adapter' | 'connector' | 'feature' | 'framework' | null {
    if (moduleId.startsWith('adapters/')) {
      return 'adapter';
    }
    if (moduleId.startsWith('connectors/')) {
      return 'connector';
    }
    if (moduleId.startsWith('features/')) {
      return 'feature';
    }
    if (moduleId.startsWith('framework/') || moduleId.includes('framework/')) {
      return 'framework';
    }
    return null;
  }
}

