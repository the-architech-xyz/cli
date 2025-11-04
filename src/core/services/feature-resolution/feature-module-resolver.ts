/**
 * Feature Module Resolver
 * 
 * This service processes feature modules in the genome and resolves them
 * into their backend/frontend implementations using the manifest system.
 * 
 * This maintains the rich parameter system while leveraging manifest-driven resolution.
 */

import { Module } from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/index.js';
import { ManifestDrivenFeatureResolver, extractProjectStackFromModules } from './manifest-driven-feature-resolver.js';
import { PathService } from '../path/path-service.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FeatureModuleResolutionResult {
  resolvedModules: Module[];
  originalFeatureModule: Module;
  backendImplementation?: string;
  frontendImplementation?: string;
}

export class FeatureModuleResolver {
  private manifestResolver: ManifestDrivenFeatureResolver;

  constructor(manifestResolver: ManifestDrivenFeatureResolver) {
    this.manifestResolver = manifestResolver;
  }

  /**
   * Process all modules and resolve feature modules using manifests
   */
  async resolveFeatureModules(modules: Module[]): Promise<Module[]> {
    const resolvedModules: Module[] = [];
    const projectStack = extractProjectStackFromModules(modules);

    for (const module of modules) {
      if (await this.isFeatureModule(module)) {
        try {
          const resolution = await this.resolveFeatureModule(module, projectStack);
          resolvedModules.push(...resolution.resolvedModules);
          
          Logger.info(`✅ Resolved feature module: ${module.id}`, {
            operation: 'feature_module_resolution',
            featureId: module.id,
            backendImpl: resolution.backendImplementation,
            frontendImpl: resolution.frontendImplementation,
            resolvedModulesCount: resolution.resolvedModules.length
          });
        } catch (error) {
          Logger.error(`❌ Failed to resolve feature module: ${module.id}`, {
            operation: 'feature_module_resolution',
            featureId: module.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      } else {
        // Keep non-feature modules as-is
        resolvedModules.push(module);
      }
    }

    return resolvedModules;
  }

  /**
   * Check if a module is a feature module that needs resolution
   * Only modules that DON'T exist directly in the marketplace need manifest resolution
   */
  private async isFeatureModule(module: Module): Promise<boolean> {
    if (!module.id.startsWith('features/')) {
      return false;
    }
    
    // Check if the module exists directly in the marketplace
    // If it has feature.json and blueprint.ts, it's a direct feature, not a manifest-based one
    try {
      const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
      const modulePath = path.join(marketplaceRoot, module.id);
      const featureJsonPath = path.join(modulePath, 'feature.json');
      const blueprintPath = path.join(modulePath, 'blueprint.ts');
      
      // Check if both files exist
      const [featureExists, blueprintExists] = await Promise.all([
        fs.access(featureJsonPath).then(() => true).catch(() => false),
        fs.access(blueprintPath).then(() => true).catch(() => false)
      ]);
      
      if (featureExists && blueprintExists) {
        // This is a direct feature, don't resolve via manifest
        return false;
      }
    } catch {
      // If check fails, assume it needs manifest resolution
    }
    
    // Needs manifest resolution
    return true;
  }

  /**
   * Resolve a single feature module using manifest
   */
  private async resolveFeatureModule(
    featureModule: Module, 
    projectStack: any
  ): Promise<FeatureModuleResolutionResult> {
    const featureId = this.extractFeatureId(featureModule.id);
    
    // Resolve using manifest
    const resolvedFeature = await this.manifestResolver.resolveFeature(featureId, projectStack);
    
    // Apply feature module parameters to resolved implementations
    const resolvedModules = this.applyFeatureParameters(
      resolvedFeature.modules,
      featureModule.parameters
    );

    return {
      resolvedModules,
      originalFeatureModule: featureModule,
      backendImplementation: resolvedFeature.backendImplementation?.moduleId,
      frontendImplementation: resolvedFeature.frontendImplementation?.moduleId
    };
  }

  /**
   * Extract feature ID from module ID
   * Examples:
   *   'features/auth' -> 'auth'
   *   'features/auth/frontend/shadcn' -> 'auth'
   *   'features/architech-welcome/shadcn' -> 'architech-welcome'
   */
  private extractFeatureId(moduleId: string): string {
    const withoutPrefix = moduleId.replace('features/', '');
    const parts = withoutPrefix.split('/');
    // Return first part (the feature name)
    return parts[0] || withoutPrefix;
  }

  /**
   * Apply feature module parameters to resolved implementation modules
   */
  private applyFeatureParameters(resolvedModules: Module[], featureParameters: Record<string, any>): Module[] {
    return resolvedModules.map(module => {
      // Merge feature parameters with module parameters
      const enhancedModule: Module = {
        ...module,
        parameters: {
          ...module.parameters,
          ...featureParameters
        }
      };

      // Apply specific parameter mappings based on feature type
      if (module.id.includes('/backend/')) {
        enhancedModule.parameters = this.applyBackendParameters(enhancedModule.parameters, featureParameters);
      } else if (module.id.includes('/frontend/')) {
        enhancedModule.parameters = this.applyFrontendParameters(enhancedModule.parameters, featureParameters);
      }

      return enhancedModule;
    });
  }

  /**
   * Apply backend-specific parameter mappings
   */
  private applyBackendParameters(moduleParams: Record<string, any>, featureParams: Record<string, any>): Record<string, any> {
    const enhanced = { ...moduleParams };

    // Map feature parameters to backend implementation parameters
    if (featureParams.backend) {
      enhanced.implementation = featureParams.backend;
    }

    if (featureParams.features) {
      enhanced.features = {
        ...enhanced.features,
        ...featureParams.features
      };
    }

    // Map authentication-specific parameters
    if (featureParams.providers) {
      enhanced.providers = featureParams.providers;
    }

    if (featureParams.session) {
      enhanced.session = featureParams.session;
    }

    if (featureParams.csrf !== undefined) {
      enhanced.csrf = featureParams.csrf;
    }

    if (featureParams.rateLimit !== undefined) {
      enhanced.rateLimit = featureParams.rateLimit;
    }

    return enhanced;
  }

  /**
   * Apply frontend-specific parameter mappings
   */
  private applyFrontendParameters(moduleParams: Record<string, any>, featureParams: Record<string, any>): Record<string, any> {
    const enhanced = { ...moduleParams };

    // Map feature parameters to frontend implementation parameters
    if (featureParams.frontend) {
      enhanced.implementation = featureParams.frontend;
    }

    if (featureParams.features) {
      enhanced.features = {
        ...enhanced.features,
        ...featureParams.features
      };
    }

    // Map UI-specific parameters
    if (featureParams.theme) {
      enhanced.theme = featureParams.theme;
    }

    return enhanced;
  }
}
