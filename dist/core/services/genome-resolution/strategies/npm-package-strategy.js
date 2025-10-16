/**
 * NPM Package Resolution Strategy
 *
 * Resolves genomes from installed NPM packages.
 * Checks: node_modules/@architech/marketplace/genomes/official/{name}.genome.ts
 *
 * This enables users to install marketplace as npm package and use genomes seamlessly.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
// Create require for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(__filename);
export class NpmPackageStrategy {
    resolver;
    packageName;
    name = 'npm-package';
    constructor(resolver, packageName = '@architech/marketplace') {
        this.resolver = resolver;
        this.packageName = packageName;
    }
    /**
     * Can handle any non-path input
     */
    canHandle(input) {
        return !this.resolver.looksLikeFilePath(input);
    }
    /**
     * Resolve from NPM package
     */
    async resolve(input) {
        if (!this.canHandle(input)) {
            return null;
        }
        try {
            // Try to resolve the marketplace package
            const packageJsonPath = require.resolve(`${this.packageName}/package.json`);
            const packageRoot = path.dirname(packageJsonPath);
            // Normalize the genome name
            const normalized = this.resolver.normalizeGenomeName(input);
            // Try official genomes
            const genomePath = path.join(packageRoot, 'genomes', 'official', `${normalized}.genome.ts`);
            try {
                await fs.access(genomePath);
                const metadata = await this.resolver.extractMetadata(genomePath);
                return {
                    name: input,
                    path: genomePath,
                    source: 'npm-package',
                    metadata
                };
            }
            catch {
                // Not found in this package
                return null;
            }
        }
        catch (error) {
            // Package not installed or not found
            // This is expected if package isn't published yet
            return null;
        }
    }
    /**
     * Check if NPM package is installed
     */
    async isPackageInstalled() {
        try {
            require.resolve(`${this.packageName}/package.json`);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get package version if installed
     */
    async getPackageVersion() {
        try {
            const packageJsonPath = require.resolve(`${this.packageName}/package.json`);
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            return packageJson.version;
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=npm-package-strategy.js.map