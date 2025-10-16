/**
 * Blueprint Preprocessor Service
 * 
 * Handles the dynamic blueprint execution pattern.
 * Converts blueprint functions into static action arrays for the BlueprintExecutor.
 */

import { 
  BlueprintAction, 
  MergedConfiguration, 
  BlueprintModule, 
  isDynamicBlueprint, 
  isLegacyBlueprint 
} from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/index.js';

// Helper function for static blueprint pattern (default export object)
const isStaticBlueprint = (blueprintModule: any) => 
  blueprintModule.default && 
  typeof blueprintModule.default === 'object' && 
  Array.isArray(blueprintModule.default.actions);

// Helper function for direct blueprint object (from BlueprintLoader)
const isDirectBlueprint = (blueprintModule: any) => 
  blueprintModule && 
  typeof blueprintModule === 'object' && 
  typeof blueprintModule.id === 'string' && 
  typeof blueprintModule.name === 'string' && 
  Array.isArray(blueprintModule.actions);

export interface BlueprintPreprocessingResult {
  success: boolean;
  actions: BlueprintAction[];
  error?: string;
}

export class BlueprintPreprocessor {
  /**
   * Process a blueprint module and return static actions
   * 
   * @param blueprintModule - The loaded blueprint module
   * @param mergedConfig - The merged configuration for Constitutional Architecture
   * @returns Preprocessing result with static actions
   */
  async processBlueprint(
    blueprintModule: BlueprintModule,
    mergedConfig: MergedConfiguration
  ): Promise<BlueprintPreprocessingResult> {
    try {
      Logger.info('🔄 Processing blueprint with preprocessor', {
        operation: 'blueprint_preprocessing'
      });

      // Handle dynamic blueprint (new pattern - function)
      if (isDynamicBlueprint(blueprintModule)) {
        Logger.info('📦 Processing dynamic blueprint (function)', {
          operation: 'blueprint_preprocessing'
        });

        const actions = (blueprintModule as any).default(mergedConfig);
        
        Logger.info(`✅ Dynamic blueprint processed: ${actions.length} actions generated`, {
          operation: 'blueprint_preprocessing',
          actionCount: actions.length
        });

        return {
          success: true,
          actions
        };
      }

      // Handle direct blueprint object (from BlueprintLoader)
      if (isDirectBlueprint(blueprintModule)) {
        Logger.info('📦 Processing direct blueprint object', {
          operation: 'blueprint_preprocessing'
        });

        const actions = (blueprintModule as any).actions;
        
        Logger.info(`✅ Direct blueprint processed: ${actions.length} actions`, {
          operation: 'blueprint_preprocessing',
          actionCount: actions.length
        });

        return {
          success: true,
          actions
        };
      }

      // Handle static blueprint (default export object)
      if (isStaticBlueprint(blueprintModule)) {
        Logger.info('📦 Processing static blueprint (default export object)', {
          operation: 'blueprint_preprocessing'
        });

        const actions = (blueprintModule as any).default.actions;
        
        Logger.info(`✅ Static blueprint processed: ${actions.length} actions`, {
          operation: 'blueprint_preprocessing',
          actionCount: actions.length
        });

        return {
          success: true,
          actions
        };
      }

      // Handle legacy blueprint (old pattern - named export)
      if (isLegacyBlueprint(blueprintModule)) {
        Logger.info('📦 Processing legacy blueprint (named export)', {
          operation: 'blueprint_preprocessing'
        });

        const actions = blueprintModule.blueprint.actions;
        
        Logger.info(`✅ Legacy blueprint processed: ${actions.length} actions`, {
          operation: 'blueprint_preprocessing',
          actionCount: actions.length
        });

        return {
          success: true,
          actions
        };
      }

      // Invalid blueprint module
      Logger.error('❌ Invalid blueprint module format', {
        operation: 'blueprint_preprocessing'
      });

      return {
        success: false,
        actions: [],
        error: 'Invalid blueprint module format. Must export either a function (dynamic), object with actions (static), or named blueprint export (legacy).'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Blueprint preprocessing failed: ${errorMessage}`, {
        operation: 'blueprint_preprocessing'
      });

      return {
        success: false,
        actions: [],
        error: `Blueprint preprocessing failed: ${errorMessage}`
      };
    }
  }

  /**
   * Load and process a blueprint from a file path
   * 
   * @param blueprintPath - Path to the blueprint file
   * @param mergedConfig - The merged configuration
   * @returns Preprocessing result with static actions
   */
  async loadAndProcessBlueprint(
    blueprintPath: string,
    mergedConfig: MergedConfiguration
  ): Promise<BlueprintPreprocessingResult> {
    try {
      Logger.info(`📁 Loading blueprint from: ${blueprintPath}`, {
        operation: 'blueprint_loading'
      });

      // Convert absolute path to file URL for proper ES module loading
      const blueprintUrl = blueprintPath.startsWith('/')
        ? `file://${blueprintPath}`
        : blueprintPath;

      // Dynamic import of the blueprint module
      const blueprintModule = await import(blueprintUrl) as BlueprintModule;
      
      return await this.processBlueprint(blueprintModule, mergedConfig);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Failed to load blueprint from ${blueprintPath}: ${errorMessage}`, {
        operation: 'blueprint_loading'
      });

      return {
        success: false,
        actions: [],
        error: `Failed to load blueprint: ${errorMessage}`
      };
    }
  }

  /**
   * Validate that a blueprint module is properly formatted
   * 
   * @param blueprintModule - The blueprint module to validate
   * @returns True if valid, false otherwise
   */
  validateBlueprintModule(blueprintModule: any): boolean {
    // Check if it's a dynamic blueprint (function)
    if (typeof blueprintModule.default === 'function') {
      return true;
    }

    // Check if default export is a blueprint object
    if (blueprintModule.default && 
        typeof blueprintModule.default === 'object' && 
        Array.isArray(blueprintModule.default.actions)) {
      return true;
    }

    // Check if it's a legacy blueprint (named export)
    if (blueprintModule.blueprint && 
        typeof blueprintModule.blueprint === 'object' && 
        Array.isArray(blueprintModule.blueprint.actions)) {
      return true;
    }

    return false;
  }
}
