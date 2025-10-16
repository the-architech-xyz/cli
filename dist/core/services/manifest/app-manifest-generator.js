import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../infrastructure/logging/index.js';
export class AppManifestGenerator {
    /**
     * Generate app manifest from genome execution result
     */
    async generateManifest(genome, executionResult, projectPath) {
        Logger.info('📋 Generating app manifest...');
        try {
            // Get package.json to extract dependencies
            const packageJson = await this.getPackageJson(projectPath);
            // Get project structure
            const projectStructure = await this.getProjectStructure(projectPath);
            // Build modules information
            const modules = this.buildModulesInfo(genome.modules, executionResult);
            const manifest = {
                generatedAt: new Date().toISOString(),
                genomeVersion: '1.0.0', // TODO: Get from package.json
                cliVersion: '1.0.0', // TODO: Get from package.json
                project: {
                    name: genome.project.name,
                    description: genome.project.description,
                    path: genome.project.path,
                },
                genome: {
                    name: genome.project.name,
                    description: genome.project.description,
                    parameters: this.extractGenomeParameters(genome),
                },
                modules,
                dependencies: packageJson.dependencies || {},
                projectStructure,
            };
            Logger.info(`✅ App manifest generated with ${Object.keys(modules).length} modules`);
            return manifest;
        }
        catch (error) {
            Logger.error(`❌ Failed to generate app manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    /**
     * Save manifest to file
     */
    async saveManifest(manifest, projectPath) {
        const manifestPath = join(projectPath, 'app-manifest.json');
        try {
            await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
            Logger.info(`💾 App manifest saved to: ${manifestPath}`);
        }
        catch (error) {
            Logger.error(`❌ Failed to save app manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    /**
     * Generate and save manifest in one operation
     */
    async generateAndSaveManifest(genome, executionResult, projectPath) {
        const manifest = await this.generateManifest(genome, executionResult, projectPath);
        await this.saveManifest(manifest, projectPath);
        return manifest;
    }
    /**
     * Get package.json dependencies
     */
    async getPackageJson(projectPath) {
        try {
            const packageJsonPath = join(projectPath, 'package.json');
            const content = await readFile(packageJsonPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            Logger.warn('⚠️ Could not read package.json, using empty dependencies');
            return { dependencies: {} };
        }
    }
    /**
     * Get project structure
     */
    async getProjectStructure(projectPath) {
        // TODO: Implement directory scanning
        // For now, return empty structure
        return {
            directories: [],
            files: [],
        };
    }
    /**
     * Build modules information from genome modules
     */
    buildModulesInfo(genomeModules, executionResult) {
        const modules = {};
        genomeModules.forEach(module => {
            modules[module.id] = {
                id: module.id,
                name: module.config?.name || module.id,
                type: this.determineModuleType(module.id),
                description: module.config?.description,
                version: module.config?.version || '1.0.0',
                enabled: true,
                parameters: module.parameters || {},
                prerequisites: module.config?.prerequisites,
                provides: module.config?.provides?.capabilities,
                generatedFiles: [], // TODO: Track generated files
            };
        });
        return modules;
    }
    /**
     * Determine module type from module ID
     */
    determineModuleType(moduleId) {
        if (moduleId.startsWith('features/'))
            return 'feature';
        if (moduleId.startsWith('adapters/'))
            return 'adapter';
        if (moduleId.startsWith('connectors/'))
            return 'connector';
        return 'technology';
    }
    /**
     * Extract genome parameters
     */
    extractGenomeParameters(genome) {
        const parameters = {};
        // Extract parameters from each module
        genome.modules.forEach(module => {
            if (module.parameters) {
                parameters[module.id] = module.parameters;
            }
        });
        return parameters;
    }
}
//# sourceMappingURL=app-manifest-generator.js.map