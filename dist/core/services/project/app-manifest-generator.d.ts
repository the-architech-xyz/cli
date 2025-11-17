/**
 * App Manifest Generator
 *
 * Generates a manifest.json file that describes the generated application,
 * including all installed modules, features, and configuration.
 */
import { ResolvedGenome } from '@thearchitech.xyz/types';
export interface AppManifest {
    version: string;
    generatedAt: string;
    generator: {
        name: string;
        version: string;
    };
    project: {
        name: string;
        description?: string;
        framework: string;
    };
    modules: {
        id: string;
        category: string;
        parameters?: Record<string, any>;
    }[];
    features: string[];
}
export declare class AppManifestGenerator {
    /**
     * Generate and save application manifest
     */
    generateAndSaveManifest(genome: ResolvedGenome, projectPath: string): Promise<void>;
    /**
     * Generate manifest object
     */
    private generateManifest;
    /**
     * Extract category from module ID
     */
    private getCategoryFromId;
}
