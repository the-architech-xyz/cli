/**
 * Blueprint Preprocessor Service
 *
 * Handles the dynamic blueprint execution pattern.
 * Converts blueprint functions into static action arrays for the BlueprintExecutor.
 */
import { BlueprintAction, MergedConfiguration, BlueprintModule } from '@thearchitech.xyz/types';
export interface BlueprintPreprocessingResult {
    success: boolean;
    actions: BlueprintAction[];
    error?: string;
}
export declare class BlueprintPreprocessor {
    /**
     * Process a blueprint module and return static actions
     *
     * @param blueprintModule - The loaded blueprint module
     * @param mergedConfig - The merged configuration for Constitutional Architecture
     * @returns Preprocessing result with static actions
     */
    processBlueprint(blueprintModule: BlueprintModule, mergedConfig: MergedConfiguration): Promise<BlueprintPreprocessingResult>;
    /**
     * Load and process a blueprint from a file path
     *
     * @param blueprintPath - Path to the blueprint file
     * @param mergedConfig - The merged configuration
     * @returns Preprocessing result with static actions
     */
    loadAndProcessBlueprint(blueprintPath: string, mergedConfig: MergedConfiguration): Promise<BlueprintPreprocessingResult>;
    /**
     * Validate that a blueprint module is properly formatted
     *
     * @param blueprintModule - The blueprint module to validate
     * @returns True if valid, false otherwise
     */
    validateBlueprintModule(blueprintModule: any): boolean;
}
