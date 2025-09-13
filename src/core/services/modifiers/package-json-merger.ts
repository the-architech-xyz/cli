/**
 * Package.json Merger Modifier
 * 
 * Merges dependencies, scripts, and other package.json properties.
 * This is a core modifier for adding packages and scripts to existing projects.
 */

import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '../../../types/agent.js';

export class PackageJsonMergerModifier extends BaseModifier {
  getDescription(): string {
    return 'Merges dependencies, scripts, and other properties into package.json';
  }

  getSupportedFileTypes(): string[] {
    return ['json'];
  }

  getParamsSchema(): any {
    return {
      type: 'object',
      properties: {
        dependencies: {
          type: 'object',
          description: 'Dependencies to add or update'
        },
        devDependencies: {
          type: 'object',
          description: 'Dev dependencies to add or update'
        },
        scripts: {
          type: 'object',
          description: 'Scripts to add or update'
        },
        peerDependencies: {
          type: 'object',
          description: 'Peer dependencies to add or update'
        },
        optionalDependencies: {
          type: 'object',
          description: 'Optional dependencies to add or update'
        },
        engines: {
          type: 'object',
          description: 'Engine requirements to add or update'
        },
        browserslist: {
          type: 'array',
          description: 'Browserslist configuration'
        },
        mergeStrategy: {
          type: 'string',
          enum: ['merge', 'replace'],
          default: 'merge',
          description: 'Strategy for merging arrays and objects'
        }
      }
    };
  }

  async execute(
    filePath: string,
    params: ModifierParams,
    context: ProjectContext
  ): Promise<ModifierResult> {
    try {
      // Validate parameters
      const validation = this.validateParams(params);
      if (!validation.valid) {
        return {
          success: false,
          error: `Parameter validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Check if file exists
      const fileExists = this.engine.fileExists(filePath);
      if (!fileExists) {
        return {
          success: false,
          error: `Target file ${filePath} does not exist`
        };
      }

      // Read existing package.json
      const existingContent = await this.readFile(filePath);
      const existingPackage = JSON.parse(existingContent);
      
      // Merge the new content
      const mergedPackage = this.mergePackageJson(existingPackage, params);
      
      // Write back to VFS
      const newContent = JSON.stringify(mergedPackage, null, 2) + '\n';
      await this.writeFile(filePath, newContent);

      return {
        success: true,
        message: `Successfully merged package.json with new dependencies and scripts`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private mergePackageJson(existingPackage: any, params: ModifierParams): any {
    const mergedPackage = { ...existingPackage };
    const mergeStrategy = params.mergeStrategy || 'merge';

    // Merge dependencies
    if (params.dependencies) {
      mergedPackage.dependencies = this.mergeDependencies(
        existingPackage.dependencies || {},
        params.dependencies,
        mergeStrategy
      );
    }

    // Merge devDependencies
    if (params.devDependencies) {
      mergedPackage.devDependencies = this.mergeDependencies(
        existingPackage.devDependencies || {},
        params.devDependencies,
        mergeStrategy
      );
    }

    // Merge peerDependencies
    if (params.peerDependencies) {
      mergedPackage.peerDependencies = this.mergeDependencies(
        existingPackage.peerDependencies || {},
        params.peerDependencies,
        mergeStrategy
      );
    }

    // Merge optionalDependencies
    if (params.optionalDependencies) {
      mergedPackage.optionalDependencies = this.mergeDependencies(
        existingPackage.optionalDependencies || {},
        params.optionalDependencies,
        mergeStrategy
      );
    }

    // Merge scripts
    if (params.scripts) {
      mergedPackage.scripts = this.mergeScripts(
        existingPackage.scripts || {},
        params.scripts,
        mergeStrategy
      );
    }

    // Merge engines
    if (params.engines) {
      mergedPackage.engines = this.mergeEngines(
        existingPackage.engines || {},
        params.engines,
        mergeStrategy
      );
    }

    // Merge browserslist
    if (params.browserslist) {
      mergedPackage.browserslist = this.mergeBrowserslist(
        existingPackage.browserslist || [],
        params.browserslist,
        mergeStrategy
      );
    }

    return mergedPackage;
  }

  private mergeDependencies(
    existing: { [key: string]: string },
    newDeps: { [key: string]: string },
    strategy: string
  ): { [key: string]: string } {
    if (strategy === 'replace') {
      return { ...newDeps };
    }
    
    return { ...existing, ...newDeps };
  }

  private mergeScripts(
    existing: { [key: string]: string },
    newScripts: { [key: string]: string },
    strategy: string
  ): { [key: string]: string } {
    if (strategy === 'replace') {
      return { ...newScripts };
    }
    
    return { ...existing, ...newScripts };
  }

  private mergeEngines(
    existing: { [key: string]: string },
    newEngines: { [key: string]: string },
    strategy: string
  ): { [key: string]: string } {
    if (strategy === 'replace') {
      return { ...newEngines };
    }
    
    return { ...existing, ...newEngines };
  }

  private mergeBrowserslist(
    existing: string[],
    newBrowserslist: string[],
    strategy: string
  ): string[] {
    if (strategy === 'replace') {
      return [...newBrowserslist];
    }
    
    // Merge and deduplicate
    const merged = [...existing, ...newBrowserslist];
    return [...new Set(merged)];
  }
}

