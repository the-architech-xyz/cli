/**
 * Centralized Blueprint Loader
 * 
 * Handles all blueprint export patterns consistently:
 * - default exports
 * - named exports (moduleNameBlueprint)
 * - wrapped objects
 * - mixed exports
 */

import { existsSync } from 'fs';
import { pathToFileURL } from 'url';

export interface BlueprintLoaderResult {
  success: boolean;
  blueprint?: any;
  error?: string;
  exportType?: 'default' | 'named' | 'wrapped';
}

export class BlueprintLoader {
  /**
   * Load and normalize a blueprint from a module
   */
  static async loadBlueprint(moduleId: string, blueprintPath: string): Promise<BlueprintLoaderResult> {
    try {
        const blueprintModule = await this.loadModuleWithFallbacks(blueprintPath);
      
      const moduleName = moduleId.split('/').pop() || moduleId;
      
     
      // Try different export patterns in order of preference
      let blueprint = this.tryDefaultExport(blueprintModule);
      if (blueprint) {
        return { success: true, blueprint, exportType: 'default' };
      }
      
      blueprint = this.tryNamedExport(blueprintModule, moduleName);
      if (blueprint) {
        return { success: true, blueprint, exportType: 'named' };
      }
      
      blueprint = this.tryWrappedExport(blueprintModule, moduleName);
      if (blueprint) {
        return { success: true, blueprint, exportType: 'wrapped' };
      }
      
      return {
        success: false,
        error: `No blueprint found in ${blueprintPath}. Available exports: ${Object.keys(blueprintModule).join(', ')}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to load blueprint from ${blueprintPath}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private static async loadModuleWithFallbacks(blueprintPath: string): Promise<any> {
    const attempted: string[] = [];
    const pathsToTry = this.buildCandidatePaths(blueprintPath);

    let lastError: unknown = null;

    for (const candidate of pathsToTry) {
      attempted.push(candidate);

      try {
        if (candidate.endsWith('.ts')) {
          await this.ensureTypeScriptLoader();
        }
        const fileUrl = pathToFileURL(candidate).href;
        return await import(fileUrl);
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    const errorMessage =
      lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(
      `Failed to load blueprint from any source. Attempted: ${attempted.join(', ')}. Last error: ${errorMessage}`
    );
  }

  private static buildCandidatePaths(blueprintPath: string): string[] {
    const candidates = new Set<string>();

    const normalizedPath = this.normalizePath(blueprintPath);
    if (existsSync(normalizedPath)) {
      candidates.add(normalizedPath);
    }

    if (normalizedPath.endsWith('.ts')) {
      const compiledPath = normalizedPath.replace(/\.ts$/, '.js');
      if (existsSync(compiledPath)) {
        candidates.add(compiledPath);
      }
    } else if (normalizedPath.endsWith('.js')) {
      const sourcePath = normalizedPath.replace(/\.js$/, '.ts');
      if (existsSync(sourcePath)) {
        candidates.add(sourcePath);
      }
    }

    return Array.from(candidates);
  }

  private static normalizePath(targetPath: string): string {
    return targetPath.startsWith('file://')
      ? new URL(targetPath).pathname
      : targetPath;
  }

  private static tsLoaderInitialized = false;

  private static async ensureTypeScriptLoader(): Promise<void> {
    if (this.tsLoaderInitialized) {
      return;
    }
    await import('tsx/esm');
    this.tsLoaderInitialized = true;
  }
  
  /**
   * Try to get blueprint from default export
   */
  private static tryDefaultExport(blueprintModule: any): any {
    if (!blueprintModule.default) return null;
    
    const defaultExport = blueprintModule.default;
    
    // If default export is a function, it's a dynamic blueprint (valid)
    // Return it wrapped so the preprocessor can recognize it
    if (typeof defaultExport === 'function') {
      return { default: defaultExport };
    }
    
    // If default export is already a blueprint (has id, name, actions)
    if (this.isBlueprint(defaultExport)) {
      return defaultExport;
    }
    
    // If default export is wrapped, try to extract blueprint
    if (typeof defaultExport === 'object' && !this.isBlueprint(defaultExport)) {
      const keys = Object.keys(defaultExport);
      if (keys.length === 1 && keys[0]) {
        const candidate = defaultExport[keys[0]];
        if (this.isBlueprint(candidate)) {
          return candidate;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Try to get blueprint from named export (moduleNameBlueprint)
   */
  private static tryNamedExport(blueprintModule: any, moduleName: string): any {
    const namedExportKey = `${moduleName}Blueprint`;
    if (blueprintModule[namedExportKey] && this.isBlueprint(blueprintModule[namedExportKey])) {
      return blueprintModule[namedExportKey];
    }
    
    // Try other blueprint-like exports
    const blueprintKeys = Object.keys(blueprintModule).filter(key => 
      key.toLowerCase().includes('blueprint') && 
      !key.includes('default')
    );
    
    for (const key of blueprintKeys) {
      if (this.isBlueprint(blueprintModule[key])) {
        return blueprintModule[key];
      }
    }
    
    return null;
  }
  
  /**
   * Try to get blueprint from wrapped export
   */
  private static tryWrappedExport(blueprintModule: any, moduleName: string): any {
    const exports = Object.keys(blueprintModule);
    
    // Look for single-key objects that might contain a blueprint
    for (const key of exports) {
      const candidate = blueprintModule[key];
      if (typeof candidate === 'object' && !this.isBlueprint(candidate)) {
        const subKeys = Object.keys(candidate);
        if (subKeys.length === 1 && subKeys[0]) {
          const subCandidate = candidate[subKeys[0]];
          if (this.isBlueprint(subCandidate)) {
            return subCandidate;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if an object is a valid blueprint
   */
  private static isBlueprint(obj: any): boolean {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.id === 'string' && 
           typeof obj.name === 'string' && 
           Array.isArray(obj.actions);
  }
}
