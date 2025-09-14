/**
 * TypeScript Config Enhancer Modifier
 * 
 * Enhances tsconfig.json with additional compiler options, paths, and includes.
 * This is essential for proper TypeScript configuration in Next.js projects.
 */

import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/types';

export class TsconfigEnhancerModifier extends BaseModifier {
  getDescription(): string {
    return 'Enhances tsconfig.json with additional compiler options, paths, and includes';
  }

  getSupportedFileTypes(): string[] {
    return ['json'];
  }

  getParamsSchema(): any {
    return {
      type: 'object',
      properties: {
        compilerOptions: {
          type: 'object',
          description: 'Additional compiler options to add or update'
        },
        paths: {
          type: 'object',
          description: 'Path mappings to add or update'
        },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional files to include'
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional files to exclude'
        },
        extends: {
          type: 'string',
          description: 'Base configuration to extend'
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

      // Read existing tsconfig.json
      const existingContent = await this.readFile(filePath);
      const existingConfig = JSON.parse(existingContent);
      
      // Enhance the configuration
      const enhancedConfig = this.enhanceTsconfig(existingConfig, params);
      
      // Write back to VFS
      const newContent = JSON.stringify(enhancedConfig, null, 2) + '\n';
      await this.writeFile(filePath, newContent);

      return {
        success: true,
        message: `Successfully enhanced tsconfig.json with new compiler options and paths`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private enhanceTsconfig(existingConfig: any, params: ModifierParams): any {
    const enhancedConfig = { ...existingConfig };
    const mergeStrategy = params.mergeStrategy || 'merge';

    // Set extends if provided
    if (params.extends) {
      enhancedConfig.extends = params.extends;
    }

    // Initialize compilerOptions if not present
    if (!enhancedConfig.compilerOptions) {
      enhancedConfig.compilerOptions = {};
    }

    // Merge compiler options
    if (params.compilerOptions) {
      enhancedConfig.compilerOptions = this.mergeCompilerOptions(
        enhancedConfig.compilerOptions,
        params.compilerOptions,
        mergeStrategy
      );
    }

    // Merge paths
    if (params.paths) {
      if (!enhancedConfig.compilerOptions.paths) {
        enhancedConfig.compilerOptions.paths = {};
      }
      enhancedConfig.compilerOptions.paths = this.mergePaths(
        enhancedConfig.compilerOptions.paths,
        params.paths,
        mergeStrategy
      );
    }

    // Merge include array
    if (params.include) {
      enhancedConfig.include = this.mergeArray(
        enhancedConfig.include || [],
        params.include,
        mergeStrategy
      );
    }

    // Merge exclude array
    if (params.exclude) {
      enhancedConfig.exclude = this.mergeArray(
        enhancedConfig.exclude || [],
        params.exclude,
        mergeStrategy
      );
    }

    return enhancedConfig;
  }

  private mergeCompilerOptions(
    existing: any,
    newOptions: any,
    strategy: string
  ): any {
    if (strategy === 'replace') {
      return { ...newOptions };
    }
    
    return { ...existing, ...newOptions };
  }

  private mergePaths(
    existing: any,
    newPaths: any,
    strategy: string
  ): any {
    if (strategy === 'replace') {
      return { ...newPaths };
    }
    
    return { ...existing, ...newPaths };
  }

  private mergeArray(
    existing: string[],
    newArray: string[],
    strategy: string
  ): string[] {
    if (strategy === 'replace') {
      return [...newArray];
    }
    
    // Merge and deduplicate
    const merged = [...existing, ...newArray];
    return [...new Set(merged)];
  }
}

