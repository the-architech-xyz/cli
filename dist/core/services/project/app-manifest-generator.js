/**
 * App Manifest Generator
 *
 * Generates a manifest.json file that describes the generated application,
 * including all installed modules, features, and configuration.
 */
import { Logger } from '../infrastructure/logging/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class AppManifestGenerator {
    /**
     * Generate and save application manifest
     */
    async generateAndSaveManifest(genome, projectPath) {
        try {
            const manifest = this.generateManifest(genome);
            const manifestPath = path.join(projectPath, '.architech', 'manifest.json');
            // Ensure .architech directory exists
            await fs.mkdir(path.dirname(manifestPath), { recursive: true });
            // Write manifest
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
            Logger.info(`✅ Generated app manifest: ${manifestPath}`, {
                operation: 'manifest_generation',
                moduleCount: manifest.modules.length,
                featureCount: manifest.features.length
            });
        }
        catch (error) {
            Logger.error(`❌ Failed to generate manifest: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                operation: 'manifest_generation'
            });
            // Non-critical: don't fail the entire operation
        }
    }
    /**
     * Generate manifest object
     */
    generateManifest(genome) {
        const modules = genome.modules.map(module => ({
            id: module.id,
            category: this.getCategoryFromId(module.id),
            parameters: module.parameters
        }));
        const features = modules
            .filter(m => m.category === 'feature')
            .map(m => m.id);
        return {
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            generator: {
                name: '@thearchitech.xyz/cli',
                version: genome.version || '1.0.0'
            },
            project: {
                name: genome.project.name,
                description: genome.project.description,
                framework: genome.project.framework
            },
            modules,
            features
        };
    }
    /**
     * Extract category from module ID
     */
    getCategoryFromId(moduleId) {
        const parts = moduleId.split('/');
        return parts[0] || 'unknown';
    }
}
//# sourceMappingURL=app-manifest-generator.js.map