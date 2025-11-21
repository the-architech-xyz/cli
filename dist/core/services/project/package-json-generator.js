/**
 * Package JSON Generator
 *
 * Generates package.json files for packages based on recipe book metadata.
 * This service replaces inline package.json generation with a centralized,
 * recipe-driven approach that supports granular packages and workspace dependencies.
 */
export class PackageJsonGenerator {
    /**
     * Generate package.json for a package based on recipe book metadata
     *
     * @param packageName - Package name (e.g., "auth", "db", "ui")
     * @param packageStructure - Package structure metadata from recipe book
     * @param projectName - Project name (for scoped package names)
     * @param genome - Genome for additional context (optional)
     * @param packagePath - Package path (e.g., "packages/auth") for relative path calculation
     * @param resolvedDependencies - Resolved dependencies from DependencyResolverService (optional)
     * @returns Generated package.json object
     */
    static generatePackageJson(packageName, packageStructure, projectName, genome, packagePath, resolvedDependencies) {
        // Use project name instead of @repo
        const packageScope = `@${projectName}`;
        return {
            name: `${packageScope}/${packageStructure.name}`,
            version: '1.0.0',
            private: true,
            main: 'src/index.ts',
            types: 'src/index.ts',
            scripts: this.getPackageScripts(packageName, packageStructure),
            dependencies: this.resolveDependencies(packageStructure.dependencies, projectName, genome, packagePath),
            devDependencies: packageStructure.devDependencies || {},
            exports: packageStructure.exports || {}
        };
    }
    /**
     * Resolve dependencies, replacing {projectName} placeholder with actual project name
     * and converting workspace dependencies based on package manager
     *
     * @param deps - Dependencies from packageStructure
     * @param projectName - Project name for placeholder replacement
     * @param genome - Genome for workspace dependency detection
     * @param packagePath - Package path (e.g., "packages/auth") for relative path calculation
     * @returns Resolved dependencies
     */
    static resolveDependencies(deps, projectName, genome, packagePath) {
        const resolved = {};
        // Detect package manager from genome
        const packageManager = this.detectPackageManager(genome);
        const useWorkspaceProtocol = packageManager === 'pnpm' || packageManager === 'yarn';
        // Get monorepo packages for relative path calculation
        const monorepoPackagesRaw = genome && 'project' in genome && genome.project?.monorepo?.packages
            ? genome.project.monorepo.packages
            : {};
        // Filter out undefined values and convert to Record<string, string>
        const monorepoPackages = {};
        for (const [key, value] of Object.entries(monorepoPackagesRaw)) {
            if (typeof value === 'string') {
                monorepoPackages[key] = value;
            }
        }
        for (const [dep, version] of Object.entries(deps)) {
            // Handle workspace dependencies (e.g., "@{projectName}/db": "workspace:*")
            if (dep.includes('{projectName}')) {
                const resolvedDep = dep.replace(/{projectName}/g, projectName);
                // If version is "workspace:*", convert based on package manager
                if (version === 'workspace:*') {
                    if (useWorkspaceProtocol) {
                        // pnpm/yarn: keep workspace:* protocol
                        resolved[resolvedDep] = version;
                    }
                    else {
                        // npm: convert to file: protocol with relative path
                        if (packagePath) {
                            const depPackageName = resolvedDep.replace(`@${projectName}/`, '');
                            const depPackagePath = this.findPackagePath(depPackageName, monorepoPackages);
                            if (depPackagePath) {
                                const relativePath = this.getRelativePathForNpm(packagePath, depPackagePath);
                                resolved[resolvedDep] = relativePath;
                            }
                            else {
                                // Fallback: keep workspace:* (will fail, but better than silent error)
                                resolved[resolvedDep] = version;
                            }
                        }
                        else {
                            // No package path: keep workspace:* (will fail, but better than silent error)
                            resolved[resolvedDep] = version;
                        }
                    }
                }
                else {
                    // Replace placeholder in version string if present
                    const resolvedVersion = version.replace(/{projectName}/g, projectName);
                    resolved[resolvedDep] = resolvedVersion;
                }
            }
            else {
                // Regular npm dependency
                resolved[dep] = version;
            }
        }
        return resolved;
    }
    /**
     * Detect package manager from genome
     */
    static detectPackageManager(genome) {
        // V2 COMPLIANCE: Get package manager from monorepo config, not modules
        // V2Genome doesn't have modules at top level - modules come from recipe books
        if (genome && 'project' in genome && genome.project?.monorepo) {
            const monorepoConfig = genome.project.monorepo;
            // Check if monorepo config has packageManager
            if (monorepoConfig && typeof monorepoConfig === 'object' && 'tool' in monorepoConfig) {
                const toolConfig = monorepoConfig;
                if (toolConfig.packageManager) {
                    return toolConfig.packageManager;
                }
                // Default based on tool
                if (toolConfig.tool === 'turborepo') {
                    return 'pnpm'; // Default for turborepo
                }
            }
        }
        return 'pnpm'; // Default for V2
    }
    /**
     * Find package path from package name in monorepo config
     */
    static findPackagePath(packageName, monorepoPackages) {
        // Try direct lookup
        if (monorepoPackages[packageName]) {
            return monorepoPackages[packageName];
        }
        // Try finding by package name in path
        for (const [key, path] of Object.entries(monorepoPackages)) {
            if (path.includes(`/${packageName}`) || path === `packages/${packageName}`) {
                return path;
            }
        }
        // Fallback: construct path from package name (standard convention)
        // This handles cases where monorepo config isn't fully populated yet
        return `packages/${packageName}`;
    }
    /**
     * Get relative path for npm file: protocol
     *
     * @param fromPath - Source path (e.g., "packages/auth")
     * @param toPath - Target path (e.g., "packages/db")
     * @returns Relative path (e.g., "file:../db")
     */
    static getRelativePathForNpm(fromPath, toPath) {
        // Calculate relative path
        const fromParts = fromPath.split('/');
        const toParts = toPath.split('/');
        // Find common prefix
        let commonLength = 0;
        while (commonLength < fromParts.length &&
            commonLength < toParts.length &&
            fromParts[commonLength] === toParts[commonLength]) {
            commonLength++;
        }
        // Calculate relative path
        // upLevels = number of directories to go up from source
        // We need to go up (fromParts.length - commonLength) levels to reach the common ancestor
        const upLevels = fromParts.length - commonLength;
        const downPath = toParts.slice(commonLength).join('/');
        const relativePath = upLevels > 0
            ? `${'../'.repeat(upLevels)}${downPath}`
            : `./${downPath}`;
        return `file:${relativePath}`;
    }
    /**
     * Get framework-specific scripts for package
     * Combines packageStructure scripts with package-specific defaults
     *
     * @param packageName - Package name
     * @param packageStructure - Package structure metadata
     * @returns Scripts object
     */
    static getPackageScripts(packageName, packageStructure) {
        // Start with scripts from packageStructure (if any)
        const scripts = {
            ...(packageStructure.scripts || {})
        };
        // Add package-specific scripts if not already defined
        if (packageName === 'db' || packageName === 'database') {
            if (!scripts['db:generate']) {
                scripts['db:generate'] = 'drizzle-kit generate';
            }
            if (!scripts['db:migrate']) {
                scripts['db:migrate'] = 'drizzle-kit migrate';
            }
        }
        // Add default build/dev scripts if not present
        if (!scripts['build']) {
            scripts['build'] = 'tsc';
        }
        if (!scripts['dev']) {
            scripts['dev'] = 'tsc --watch';
        }
        return scripts;
    }
    /**
     * Generate package.json for an app (web, mobile, api)
     * Apps have different structure than packages
     *
     * V2 COMPLIANCE: Accepts recipe books and framework adapter for metadata-driven scripts
     *
     * @param appName - App name (e.g., "web", "mobile", "api")
     * @param appFramework - Framework (e.g., "nextjs", "expo", "hono")
     * @param projectName - Project name
     * @param workspaceDependencies - Workspace dependencies to add
     * @param recipeBooks - Optional recipe books for framework scripts
     * @param frameworkAdapter - Optional framework adapter config for scripts
     * @returns Generated package.json object
     */
    static generateAppPackageJson(appName, appFramework, projectName, workspaceDependencies = {}, recipeBooks, frameworkAdapter) {
        const packageScope = `@${projectName}`;
        const basePackageJson = {
            name: `${packageScope}/${appName}`,
            version: '1.0.0',
            private: true,
            scripts: this.getAppScripts(appName, appFramework, recipeBooks, frameworkAdapter),
            dependencies: {
                ...workspaceDependencies
            },
            devDependencies: {
                'typescript': '^5.0.0',
                '@types/node': '^20.0.0'
            }
        };
        // Framework-specific dependencies
        // V2 COMPLIANCE: Should come from recipe book or adapter metadata
        // For now, keep hardcoded with deprecation warning
        if (appFramework === 'nextjs') {
            basePackageJson.dependencies = {
                ...basePackageJson.dependencies,
                'next': 'latest',
                'react': '^18.0.0',
                'react-dom': '^18.0.0'
            };
        }
        else if (appFramework === 'expo') {
            basePackageJson.dependencies = {
                ...basePackageJson.dependencies,
                'expo': 'latest',
                'react-native': 'latest'
            };
        }
        return basePackageJson;
    }
    /**
     * Get framework-specific scripts for apps
     *
     * V2 COMPLIANCE: Reads from recipe books or adapter metadata instead of hardcoding
     *
     * @param appName - App name
     * @param framework - Framework name
     * @param recipeBooks - Optional recipe books for framework scripts
     * @param frameworkAdapter - Optional framework adapter config
     * @returns Scripts object
     */
    static getAppScripts(appName, framework, recipeBooks, frameworkAdapter) {
        // PRIORITY 1: Try to get from recipe book (V2 compliant)
        if (recipeBooks && recipeBooks.size > 0) {
            const scripts = this.getScriptsFromRecipeBook(framework, recipeBooks);
            if (scripts && Object.keys(scripts).length > 0) {
                return scripts;
            }
        }
        // PRIORITY 2: Try to get from framework adapter config
        if (frameworkAdapter?.config?.scripts) {
            return frameworkAdapter.config.scripts;
        }
        // PRIORITY 3: Fallback to hardcoded (deprecated, for migration period)
        const fallbackScripts = this.getFallbackScripts(framework);
        if (fallbackScripts) {
            const Logger = require('../infrastructure/logging/logger.js').Logger;
            Logger.warn(`Using fallback scripts for framework '${framework}'. ` +
                `Framework scripts should be defined in recipe book or adapter metadata.`, { framework, appName });
            return fallbackScripts;
        }
        // Default scripts if nothing found
        return {
            'dev': 'tsc --watch',
            'build': 'tsc'
        };
    }
    /**
     * Get scripts from recipe book
     *
     * V2 COMPLIANCE: Reads framework scripts from recipe book metadata
     */
    static getScriptsFromRecipeBook(framework, recipeBooks) {
        // Search all recipe books for framework scripts
        // Recipe books don't have frameworks section yet
        // TODO: Add frameworks section to recipe book for framework scripts
        // For now, return null to use fallback
        for (const recipeBook of Array.from(recipeBooks.values())) {
            // Check if framework is defined as a package (if framework adapters are packages)
            if (recipeBook.packages && framework in recipeBook.packages) {
                const frameworkPackage = recipeBook.packages[framework];
                if (frameworkPackage?.packageStructure?.scripts) {
                    return frameworkPackage.packageStructure.scripts;
                }
            }
        }
        return null;
    }
    /**
     * Fallback scripts (deprecated, for migration period)
     *
     * @deprecated Scripts should come from recipe book or adapter metadata
     */
    static getFallbackScripts(framework) {
        const scripts = {};
        if (framework === 'nextjs') {
            scripts['dev'] = 'next dev';
            scripts['build'] = 'next build';
            scripts['start'] = 'next start';
            scripts['lint'] = 'next lint';
            return scripts;
        }
        else if (framework === 'expo') {
            scripts['start'] = 'expo start';
            scripts['android'] = 'expo start --android';
            scripts['ios'] = 'expo start --ios';
            scripts['web'] = 'expo start --web';
            return scripts;
        }
        else if (framework === 'hono') {
            scripts['dev'] = 'tsx watch src/index.ts';
            scripts['build'] = 'tsc';
            scripts['start'] = 'node dist/index.js';
            return scripts;
        }
        return null;
    }
}
//# sourceMappingURL=package-json-generator.js.map