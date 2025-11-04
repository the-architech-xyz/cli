/**
 * Blueprint Types
 *
 * Type definitions for dynamic blueprint architecture
 */
import { BlueprintAction } from './blueprint-actions.js';
import { MergedConfiguration } from './constitutional-architecture.js';
/**
 * Dynamic Blueprint Interface
 *
 * Blueprints are now functions that take configuration and return actions.
 * This provides maximum flexibility while maintaining VFS safety.
 */
export interface DynamicBlueprint {
    id: string;
    name: string;
    description: string;
    version: string;
    actions: (config: MergedConfiguration) => BlueprintAction[];
}
/**
 * Legacy Blueprint Interface (for backward compatibility)
 *
 * Old blueprints that export static action arrays
 */
export interface LegacyBlueprint {
    id: string;
    name: string;
    description: string;
    version: string;
    actions: BlueprintAction[];
}
/**
 * Blueprint Module Export
 *
 * A blueprint module can export either a function (new) or an object (legacy)
 */
export type BlueprintModule = {
    default: (config: MergedConfiguration) => BlueprintAction[];
} | {
    blueprint: LegacyBlueprint;
};
/**
 * Type guard to check if a blueprint module is dynamic
 */
export declare function isDynamicBlueprint(module: BlueprintModule): module is {
    default: (config: MergedConfiguration) => BlueprintAction[];
};
/**
 * Type guard to check if a blueprint module is legacy
 */
export declare function isLegacyBlueprint(module: BlueprintModule): module is {
    blueprint: LegacyBlueprint;
};
