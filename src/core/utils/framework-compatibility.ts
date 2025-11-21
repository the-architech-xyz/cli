/**
 * Framework Compatibility Utilities
 * 
 * Provides framework compatibility checking to prevent framework-specific modules
 * from executing in incompatible apps (e.g., Next.js module in Hono app).
 */

import { Module, ResolvedGenome, FrameworkApp } from '@thearchitech.xyz/types';
import { getProjectApps } from './genome-helpers.js';
import { Logger } from '../services/infrastructure/logging/logger.js';

/**
 * Extract framework requirement from module
 * 
 * Priority:
 * 1. Module metadata `requires` array (explicit: "framework/nextjs")
 * 2. Module ID pattern (implicit: "backend/nextjs", "connectors/auth/better-auth-nextjs")
 * 3. Module config prerequisites (future)
 * 
 * @param module - Module to check
 * @returns Framework name (e.g., "nextjs", "hono", "express") or null if framework-agnostic
 */
export function extractFrameworkRequirement(module: Module): string | null {
  // 1. Check module config prerequisites (explicit framework requirement)
  if (module.config?.prerequisites?.modules) {
    const frameworkReq = module.config.prerequisites.modules.find(
      (req: string) => req.startsWith('framework/')
    );
    if (frameworkReq) {
      return frameworkReq.replace('framework/', '');
    }
  }

  // 2. Check module metadata requires (if available)
  const moduleMetadata = (module as { metadata?: { requires?: string[] } }).metadata;
  if (moduleMetadata?.requires) {
    const requires = moduleMetadata.requires;
    if (Array.isArray(requires)) {
      const frameworkReq = requires.find(
        (req: string) => typeof req === 'string' && req.startsWith('framework/')
      );
      if (frameworkReq) {
        return frameworkReq.replace('framework/', '');
      }
    }
  }

  // 3. Check module ID pattern (implicit framework requirement)
  const moduleId = module.id.toLowerCase();
  
  // Backend modules: features/ai-chat/backend/nextjs
  if (moduleId.includes('/backend/nextjs')) return 'nextjs';
  if (moduleId.includes('/backend/hono')) return 'hono';
  if (moduleId.includes('/backend/express')) return 'express';
  
  // Connectors: connectors/auth/better-auth-nextjs
  if (moduleId.includes('-nextjs') || moduleId.endsWith('/nextjs')) return 'nextjs';
  if (moduleId.includes('-hono') || moduleId.endsWith('/hono')) return 'hono';
  if (moduleId.includes('-express') || moduleId.endsWith('/express')) return 'express';
  if (moduleId.includes('-expo') || moduleId.endsWith('/expo')) return 'expo';
  if (moduleId.includes('-react-native') || moduleId.endsWith('/react-native')) return 'react-native';
  
  // Frontend modules: features/auth/frontend/shadcn (usually framework-agnostic)
  // But check for explicit framework in path
  if (moduleId.includes('/frontend/nextjs')) return 'nextjs';
  if (moduleId.includes('/frontend/expo')) return 'expo';

  // No framework requirement (framework-agnostic)
  return null;
}

/**
 * Filter apps by framework and app type compatibility
 * 
 * Only returns apps that match both:
 * - Module's framework requirement (if specified)
 * - Module's app type requirement (if specified)
 * 
 * If module has no requirements, returns all apps.
 * 
 * @param appIds - Array of app IDs to filter
 * @param module - Module with potential framework/app type requirements
 * @param genome - Genome containing app definitions
 * @param frameworkRequirement - Optional explicit framework requirement (from recipe book or extracted)
 * @param requiredAppTypes - Optional explicit app type requirements (from recipe book)
 * @returns Filtered array of compatible app IDs
 */
export function filterAppsByFramework(
  appIds: string[],
  module: Module,
  genome: ResolvedGenome,
  frameworkRequirement?: string | null,
  requiredAppTypes?: ('web' | 'mobile' | 'api' | 'desktop' | 'worker')[]
): string[] {
  // Use provided framework requirement or extract from module
  const requiredFramework = frameworkRequirement !== undefined 
    ? frameworkRequirement 
    : null;
  
  // If no requirements, allow all apps (framework-agnostic, app-type-agnostic module)
  if (!requiredFramework && !requiredAppTypes) {
    Logger.debug(`Module ${module.id} has no framework or app type requirements, allowing all apps`, {
      operation: 'framework_compatibility',
      moduleId: module.id,
      appIds
    });
    return appIds;
  }
  
  const apps = getProjectApps(genome);
  const compatibleApps: string[] = [];
  
  for (const appId of appIds) {
    // Find app by ID - single strategy (id field must be set correctly)
    const app = apps.find((a: FrameworkApp) => a.id === appId);
    
    if (!app) {
      Logger.warn(
        `App ${appId} not found in genome, skipping compatibility check. Available app IDs: ${apps.map(a => a.id).join(', ')}`,
        {
          operation: 'framework_compatibility',
          moduleId: module.id,
          appId,
          availableAppIds: apps.map(a => a.id)
        }
      );
      continue;
    }
    
    // Check framework compatibility
    if (requiredFramework && app.framework !== requiredFramework) {
      Logger.warn(
        `⚠️ Skipping app ${appId}: Framework mismatch ` +
        `(module ${module.id} requires ${requiredFramework}, app uses ${app.framework})`,
        {
          operation: 'framework_compatibility',
          moduleId: module.id,
          appId,
          requiredFramework,
          appFramework: app.framework
        }
      );
      continue;
    }
    
    // Check app type compatibility
    if (requiredAppTypes && requiredAppTypes.length > 0) {
      if (!app.type) {
        Logger.warn(
          `App ${appId} missing type field, skipping app type compatibility check`,
          {
            operation: 'app_type_compatibility',
            moduleId: module.id,
            appId
          }
        );
        continue;
      }
      if (!requiredAppTypes.includes(app.type)) {
        Logger.warn(
          `⚠️ Skipping app ${appId}: App type mismatch ` +
          `(module ${module.id} requires app types: ${requiredAppTypes.join(', ')}, app is ${app.type})`,
          {
            operation: 'app_type_compatibility',
            moduleId: module.id,
            appId,
            requiredAppTypes,
            appType: app.type
          }
        );
        continue;
      }
    }
    
    // App passed all compatibility checks
    compatibleApps.push(appId);
    Logger.debug(
      `✅ App ${appId} is compatible with module ${module.id} ` +
      `(framework: ${requiredFramework || 'any'}, app type: ${requiredAppTypes?.join(', ') || 'any'})`,
      {
        operation: 'framework_compatibility',
        moduleId: module.id,
        appId,
        framework: requiredFramework,
        appTypes: requiredAppTypes
      }
    );
  }
  
  return compatibleApps;
}

/**
 * Validate framework and app type compatibility before execution
 * 
 * Double-check that app framework and type match module requirements.
 * This is a safety check in addition to filtering.
 * 
 * @param module - Module to execute
 * @param appId - App ID to execute in
 * @param genome - Genome containing app definitions
 * @param frameworkRequirement - Optional explicit framework requirement (from recipe book)
 * @param requiredAppTypes - Optional explicit app type requirements (from recipe book)
 * @returns true if compatible, false otherwise
 */
export function validateFrameworkCompatibility(
  module: Module,
  appId: string,
  genome: ResolvedGenome,
  frameworkRequirement?: string | null,
  requiredAppTypes?: ('web' | 'mobile' | 'api' | 'desktop' | 'worker')[]
): { compatible: boolean; error?: string } {
  // Use provided framework requirement or extract from module
  const requiredFramework = frameworkRequirement !== undefined
    ? frameworkRequirement
    : extractFrameworkRequirement(module);
  
  // If no requirements, always compatible
  if (!requiredFramework && !requiredAppTypes) {
    return { compatible: true };
  }
  
  const apps = getProjectApps(genome);
  const app = apps.find((a: FrameworkApp) => a.id === appId);
  
  if (!app) {
    return {
      compatible: false,
      error: `App ${appId} not found in genome. Available app IDs: ${apps.map(a => a.id).join(', ')}`
    };
  }
  
  // Check framework compatibility
  if (requiredFramework && app.framework !== requiredFramework) {
    return {
      compatible: false,
      error: `Framework mismatch: Module ${module.id} requires ${requiredFramework}, but app ${appId} uses ${app.framework}`
    };
  }
  
  // Check app type compatibility
  if (requiredAppTypes && requiredAppTypes.length > 0) {
    if (!app.type) {
      return {
        compatible: false,
        error: `App ${appId} missing type field`
      };
    }
    if (!requiredAppTypes.includes(app.type)) {
      return {
        compatible: false,
        error: `App type mismatch: Module ${module.id} requires app types [${requiredAppTypes.join(', ')}], but app ${appId} is ${app.type}`
      };
    }
  }
  
  return { compatible: true };
}

