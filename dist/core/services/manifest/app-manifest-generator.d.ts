import { Genome } from '@thearchitech.xyz/types';
export interface AppManifest {
    generatedAt: string;
    genomeVersion: string;
    cliVersion: string;
    project: {
        name: string;
        description?: string;
        path?: string;
    };
    genome: {
        name: string;
        description?: string;
        parameters: Record<string, any>;
    };
    modules: {
        [moduleId: string]: {
            id: string;
            name: string;
            type: 'feature' | 'technology' | 'connector' | 'adapter';
            description?: string;
            version: string;
            enabled: boolean;
            parameters: Record<string, any>;
            prerequisites?: {
                capabilities?: string[];
                adapters?: string[];
                technologies?: string[];
            };
            provides?: string[];
            generatedFiles: string[];
        };
    };
    dependencies: {
        [packageName: string]: string;
    };
    projectStructure: {
        directories: string[];
        files: string[];
    };
}
export declare class AppManifestGenerator {
    /**
     * Generate app manifest from genome execution result
     */
    generateManifest(genome: Genome, executionResult: any, projectPath: string): Promise<AppManifest>;
    /**
     * Save manifest to file
     */
    saveManifest(manifest: AppManifest, projectPath: string): Promise<void>;
    /**
     * Generate and save manifest in one operation
     */
    generateAndSaveManifest(genome: Genome, executionResult: any, projectPath: string): Promise<AppManifest>;
    /**
     * Get package.json dependencies
     */
    private getPackageJson;
    /**
     * Get project structure
     */
    private getProjectStructure;
    /**
     * Build modules information from genome modules
     */
    private buildModulesInfo;
    /**
     * Determine module type from module ID
     */
    private determineModuleType;
    /**
     * Extract genome parameters
     */
    private extractGenomeParameters;
}
