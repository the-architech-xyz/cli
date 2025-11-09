/**
 * Architecture Validator Service
 * 
 * Integrates with the SmartArchitectureValidator to perform pre-execution validation
 */

import { Genome, Module } from '@thearchitech.xyz/marketplace';
import { ModuleArtifacts } from '@thearchitech.xyz/types';
import { Logger, ExecutionTracer } from '../infrastructure/logging/index.js';
// ModuleArtifacts will be imported dynamically at runtime

interface ValidationError {
  type: 'FILE_OWNERSHIP_VIOLATION' | 'CREATE_CONFLICT' | 'MISSING_DEPENDENCY' | 'INVALID_PATH';
  module: string;
  message: string;
  details: {
    file?: string;
    expectedOwner?: string;
    actualOwner?: string;
    conflictingModules?: string[];
  };
}

interface ValidationWarning {
  type: 'MISSING_ARTIFACTS' | 'DEPRECATED_ACTION' | 'UNUSED_TEMPLATE';
  module: string;
  message: string;
  details: {
    file?: string;
    suggestion?: string;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}


export class ArchitectureValidator {
  private artifactCache = new Map<string, ModuleArtifacts>();

  /**
   * Validate the recipe for architectural compliance
   */
  async validateRecipe(genome: Genome, traceId: string): Promise<ValidationResult> {
    Logger.info('🔍 Starting architectural validation...', {
      traceId,
      operation: 'architectural_validation'
    });
    
    const results = await Promise.all([
      this.validateFileOwnership(genome, traceId),
      this.detectCreateConflicts(genome, traceId),
      this.validateDependencies(genome, traceId)
    ]);
    
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    
    const isValid = allErrors.length === 0;
    
    if (isValid) {
      Logger.info('✅ Architectural validation passed!', {
        traceId,
        operation: 'architectural_validation'
      });
    } else {
      Logger.error(`❌ Architectural validation failed with ${allErrors.length} errors`, {
        traceId,
        operation: 'architectural_validation',
        errors: allErrors.map(e => e.message)
      });
    }
    
    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Validate file ownership - ensure integrators only enhance files owned by their dependencies
   */
  private async validateFileOwnership(genome: Genome, traceId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    Logger.info('🔍 Validating file ownership...', {
      traceId,
      operation: 'file_ownership_validation'
    });
    
    // Convert genome modules to CLI format and load artifacts
    const modules = genome.modules || [];
    const moduleArtifacts = await this.loadModuleArtifacts(modules, traceId);
    
    // Build ownership map from adapters
    const ownershipMap = new Map<string, string>();
    for (const [moduleId, artifacts] of moduleArtifacts) {
      const module = modules.find(m => m.id === moduleId);
      if (!module || this.getModuleType(module) !== 'adapter') continue;
      
      for (const fileArtifact of artifacts.creates) {
        ownershipMap.set(fileArtifact.path, moduleId);
      }
    }
    
    Logger.info(`📊 Built ownership map with ${ownershipMap.size} files`, {
      traceId,
      operation: 'file_ownership_validation'
    });
    
    // Validate integrators
    for (const [moduleId, artifacts] of moduleArtifacts) {
      const module = modules.find(m => m.id === moduleId);
      if (!module || this.getModuleType(module) !== 'integration') continue;
      
      const adapterDependencies = this.getAdapterDependencies(module);
      
      for (const enhanceFile of artifacts.enhances) {
        const actualOwner = ownershipMap.get(enhanceFile.path);
        
        if (!actualOwner) {
          errors.push({
            type: 'FILE_OWNERSHIP_VIOLATION',
            module: moduleId,
            message: `File '${enhanceFile.path}' is not created by any adapter`,
            details: { file: enhanceFile.path }
          });
        } else if (!adapterDependencies.includes(actualOwner)) {
          errors.push({
            type: 'FILE_OWNERSHIP_VIOLATION',
            module: moduleId,
            message: `File '${enhanceFile.path}' is owned by '${actualOwner}' which is not a declared dependency`,
            details: { 
              file: enhanceFile.path, 
              actualOwner,
              expectedOwner: adapterDependencies.join(', ')
            }
          });
        }
      }
    }
    
    Logger.info(`📊 File ownership validation: ${errors.length} errors, ${warnings.length} warnings`, {
      traceId,
      operation: 'file_ownership_validation'
    });
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Detect conflicts where multiple modules try to create the same file
   */
  private async detectCreateConflicts(genome: Genome, traceId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    Logger.info('🔍 Detecting create conflicts...', {
      traceId,
      operation: 'create_conflict_detection'
    });
    
    const modules = genome.modules || [];
    const moduleArtifacts = await this.loadModuleArtifacts(modules, traceId);
    const createMap = new Map<string, string[]>();
    
    // Collect all create paths
    for (const [moduleId, artifacts] of moduleArtifacts) {
      for (const fileArtifact of artifacts.creates) {
        if (!createMap.has(fileArtifact.path)) {
          createMap.set(fileArtifact.path, []);
        }
        createMap.get(fileArtifact.path)!.push(moduleId);
      }
    }
    
    // Detect conflicts
    for (const [path, modules] of createMap.entries()) {
      if (modules.length > 1) {
        errors.push({
          type: 'CREATE_CONFLICT',
          module: modules[0] || 'unknown', // Primary module
          message: `Multiple modules trying to create '${path}'`,
          details: { 
            file: path, 
            conflictingModules: modules 
          }
        });
      }
    }
    
    Logger.info(`📊 Create conflict detection: ${errors.length} conflicts found`, {
      traceId,
      operation: 'create_conflict_detection'
    });
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate module dependencies
   */
  private async validateDependencies(genome: Genome, traceId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    Logger.info('🔍 Validating dependencies...', {
      traceId,
      operation: 'dependency_validation'
    });
    
    const modules = genome.modules || [];
    const moduleIds = new Set(modules.map(m => m.id));
    
    for (const module of modules) {
      const dependencies = this.extractDependencies(module);
      if (dependencies.length > 0) {
        for (const dependency of dependencies) {
          if (!moduleIds.has(dependency)) {
            errors.push({
              type: 'MISSING_DEPENDENCY',
              module: module.id,
              message: `Module '${module.id}' depends on '${dependency}' which is not in the genome`,
              details: { file: dependency }
            });
          }
        }
      }
    }
    
    Logger.info(`📊 Dependency validation: ${errors.length} errors, ${warnings.length} warnings`, {
      traceId,
      operation: 'dependency_validation'
    });
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Load artifacts for all modules in the genome
   */
  private async loadModuleArtifacts(modules: Module[], traceId: string): Promise<Map<string, ModuleArtifacts>> {
    const artifacts = new Map<string, ModuleArtifacts>();
    
    for (const module of modules) {
      if (this.artifactCache.has(module.id)) {
        artifacts.set(module.id, this.artifactCache.get(module.id)!);
        continue;
      }
      
      try {
        // For now, create mock artifacts based on module type
        // In production, this would load from the generated ModuleArtifacts
        const moduleArtifacts = await this.loadRealArtifacts(module);
        this.artifactCache.set(module.id, moduleArtifacts);
        artifacts.set(module.id, moduleArtifacts);
      } catch (error) {
        Logger.warn(`⚠️  Failed to load artifacts for module ${module.id}:`, {
          traceId,
          operation: 'artifact_loading',
          error: error instanceof Error ? error.message : String(error)
        });
        
        const emptyArtifacts: ModuleArtifacts = {
          creates: [],
          enhances: [],
          installs: [],
          envVars: []
        };
        artifacts.set(module.id, emptyArtifacts);
      }
    }
    
    return artifacts;
  }

  /**
   * Create mock artifacts for testing
   */
  private async loadRealArtifacts(module: Module): Promise<ModuleArtifacts> {
    try {
      // Dynamically import the marketplace ModuleArtifacts
      const { ModuleArtifacts: MarketplaceModuleArtifacts } = await import('@thearchitech.xyz/marketplace');
      
      // Load real artifacts from the marketplace package
      const artifactLoader = MarketplaceModuleArtifacts[module.id];
      if (!artifactLoader) {
        Logger.warn(`⚠️  No artifacts found for module ${module.id}`, {
          operation: 'artifact_loading'
        });
        return this.getEmptyArtifacts();
      }

      const artifacts = await artifactLoader();
      return artifacts;
    } catch (error) {
      Logger.warn(`⚠️  Failed to load real artifacts for module ${module.id}:`, {
        operation: 'artifact_loading',
        error: error instanceof Error ? error.message : String(error)
      });
      return this.getEmptyArtifacts();
    }
  }

  private getEmptyArtifacts(): ModuleArtifacts {
    return {
      creates: [],
      enhances: [],
      installs: [],
      envVars: []
    };
  }

  /**
   * Get module type from module ID
   */
  private getModuleType(module: Module): 'adapter' | 'integration' {
    // This is a simplified classification
    // In production, this would use the actual module classification logic
    if (module.category === 'adapter') {
      return 'adapter';
    } else if (module.category === 'integration') {
      return 'integration';
    }
    
    // Fallback based on module ID patterns
    if (module.id.includes('/')) {
      return 'adapter'; // adapters/database/drizzle
    } else {
      return 'integration'; // drizzle-nextjs-integration
    }
  }

  /**
   * Extract dependencies from a module
   */
  private extractDependencies(module: Module): string[] {
    // Extract dependencies from module parameters
    if (module.parameters && module.parameters.dependencies) {
      return Array.isArray(module.parameters.dependencies) 
        ? module.parameters.dependencies 
        : [];
    }
    return [];
  }

  /**
   * Get adapter dependencies for a module
   */
  private getAdapterDependencies(module: Module): string[] {
    return this.extractDependencies(module);
  }

  /**
   * Clear the artifact cache
   */
  clearCache(): void {
    this.artifactCache.clear();
  }
}
