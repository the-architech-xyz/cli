/**
 * Structure Initialization Layer
 *
 * Analyzes genome (capabilities, apps, modules) and initializes the complete
 * project structure (single-app or monorepo) BEFORE module execution.
 *
 * This layer ensures that:
 * - All required packages are created based on capabilities
 * - Package structure is initialized (package.json, tsconfig, etc.)
 * - Genome is updated with created packages
 */
import { Logger } from '../infrastructure/logging/logger.js';
import { getProjectStructure, getProjectMonorepo, getProjectApps } from '../../utils/genome-helpers.js';
import * as path from 'path';
import * as fs from 'fs/promises';
export class StructureInitializationLayer {
    pathHandler;
    constructor(pathHandler) {
        this.pathHandler = pathHandler;
    }
    /**
     * Initialize project structure based on genome
     */
    async initialize(genome) {
        // Debug: Log genome structure
        const projectStructure = getProjectStructure(genome);
        const hasMonorepo = !!getProjectMonorepo(genome);
        const hasApps = getProjectApps(genome).length > 0;
        Logger.info(`🔍 Structure detection: structure=${projectStructure}, hasMonorepo=${!!hasMonorepo}, hasApps=${!!hasApps}`, {
            operation: 'structure_initialization',
            projectStructure,
            monorepo: hasMonorepo,
            apps: hasApps
        });
        const structure = projectStructure || 'single-app';
        Logger.info(`📁 Initializing ${structure} structure for project: ${genome.project.name}`, {
            operation: 'structure_initialization'
        });
        if (structure === 'single-app') {
            return this.initializeSingleApp(genome);
        }
        else if (structure === 'monorepo') {
            return this.initializeMonorepo(genome);
        }
        return {
            success: false,
            packages: [],
            error: `Unknown structure: ${structure}`
        };
    }
    /**
     * Initialize single app structure
     */
    async initializeSingleApp(genome) {
        const projectRoot = this.pathHandler.getProjectRoot();
        // Create basic single app structure
        const directories = [
            path.join(projectRoot, 'src'),
            path.join(projectRoot, 'src/lib'),
            path.join(projectRoot, 'public'),
            path.join(projectRoot, 'scripts')
        ];
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
        Logger.info('✅ Single app structure initialized', {
            operation: 'structure_initialization'
        });
        return {
            success: true,
            packages: []
        };
    }
    /**
     * Initialize monorepo structure based on capabilities and apps
     */
    async initializeMonorepo(genome) {
        Logger.info('📁 Initializing monorepo structure based on capabilities and apps', {
            operation: 'structure_initialization'
        });
        const projectRoot = this.pathHandler.getProjectRoot();
        const monorepoConfig = getProjectMonorepo(genome);
        const apps = getProjectApps(genome);
        const capabilities = genome.capabilities || {};
        // ResolvedGenome guarantees modules is always an array
        const modules = genome.modules;
        Logger.info(`🔍 Monorepo initialization details:`, {
            operation: 'structure_initialization',
            projectRoot,
            hasMonorepoConfig: !!monorepoConfig,
            monorepoPackages: monorepoConfig?.packages,
            appsCount: apps.length,
            capabilitiesCount: Object.keys(capabilities).length,
            modulesCount: modules.length,
            apps: apps.map((a) => ({ id: a.id, type: a.type, package: a.package }))
        });
        // Determine required packages based on capabilities, apps, and modules
        // FIRST: Resolve actual target packages for all modules to know which packages will be used
        const usedPackages = await this.resolveUsedPackages(genome, modules);
        Logger.info(`📦 Packages that will receive content:`, {
            operation: 'structure_initialization',
            usedPackages: Array.from(usedPackages)
        });
        // THEN: Determine required packages based on capabilities, apps, and modules
        const requiredPackages = this.determineRequiredPackages(apps, capabilities, modules, usedPackages);
        Logger.info(`📦 Required packages determined:`, {
            operation: 'structure_initialization',
            requiredPackages
        });
        // Merge with explicit packages from config (explicit takes precedence)
        // Filter out undefined values from packages to match Record<string, string> type
        const explicitPackages = monorepoConfig?.packages || {};
        const filteredPackages = {};
        for (const [key, value] of Object.entries(explicitPackages)) {
            if (value !== undefined) {
                filteredPackages[key] = value;
            }
        }
        const finalPackages = this.mergePackages(requiredPackages, filteredPackages);
        Logger.info(`📦 Determined ${Object.keys(finalPackages).length} packages to create`, {
            packages: Object.keys(finalPackages),
            operation: 'structure_initialization'
        });
        // Create package directories and initialize them
        const createdPackages = [];
        for (const [packageName, packagePath] of Object.entries(finalPackages)) {
            const fullPath = path.join(projectRoot, packagePath);
            // Create package directory
            await fs.mkdir(fullPath, { recursive: true });
            const packageType = this.getPackageType(packageName);
            // Only initialize packages (not apps) - apps will be created by their framework adapters
            if (packageType === 'package') {
                await this.initializePackage(packageName, packagePath, fullPath, genome);
                Logger.info(`📦 Created and initialized package: ${packagePath}`, {
                    package: packageName,
                    path: packagePath,
                    operation: 'structure_initialization'
                });
            }
            else {
                // For apps, just create the directory - framework will handle initialization
                Logger.info(`📱 Created app directory (will be initialized by framework): ${packagePath}`, {
                    package: packageName,
                    path: packagePath,
                    operation: 'structure_initialization'
                });
            }
            createdPackages.push({
                name: packageName,
                path: packagePath,
                type: packageType,
                purpose: this.getPackagePurpose(packageName, capabilities, modules)
            });
        }
        // Create root package.json for workspace WITHOUT workspaces property initially
        // This prevents create-next-app and similar tools from detecting the workspace
        // and generating workspace:* protocol references (which npm doesn't support)
        // The workspaces property will be added later by the monorepo/turborepo module
        await this.createRootPackageJsonMinimal(finalPackages, monorepoConfig);
        // Generate monorepo tool configuration
        await this.generateMonorepoToolConfig(finalPackages, monorepoConfig);
        // CRITICAL: Update genome.project.monorepo.packages with created packages
        // This ensures the rest of the system knows about the packages
        if (!genome.project.monorepo) {
            genome.project.monorepo = {};
        }
        genome.project.monorepo.packages = finalPackages;
        Logger.info(`✅ Monorepo structure initialized with ${createdPackages.length} packages`, {
            packages: createdPackages.map(p => `${p.name} (${p.path})`),
            operation: 'structure_initialization'
        });
        return {
            success: true,
            packages: createdPackages
        };
    }
    /**
     * Resolve which packages will actually be used by modules
     * Uses MonorepoPackageResolver to predict module placement
     */
    async resolveUsedPackages(genome, modules) {
        const usedPackages = new Set();
        // Import resolver dynamically to avoid circular dependencies (ESM import)
        const { MonorepoPackageResolver } = await import('./monorepo-package-resolver.js');
        for (const module of modules) {
            try {
                const targetPackage = MonorepoPackageResolver.resolveTargetPackage(module, genome);
                if (targetPackage) {
                    usedPackages.add(targetPackage);
                    Logger.debug(`📦 Module ${module.id || module} will use package: ${targetPackage}`, {
                        operation: 'structure_initialization',
                        moduleId: typeof module === 'string' ? module : module.id,
                        targetPackage
                    });
                }
            }
            catch (error) {
                // If resolution fails, we'll still create packages based on capabilities
                Logger.warn(`⚠️ Failed to resolve target package for module: ${typeof module === 'string' ? module : module.id}`, {
                    operation: 'structure_initialization',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return usedPackages;
    }
    /**
     * Determine required packages based on capabilities, apps, and modules
     * Now also considers which packages will actually be used
     */
    determineRequiredPackages(apps, capabilities, modules, usedPackages) {
        const packages = {};
        // 1. Packages from apps (always required)
        for (const app of apps) {
            if (app.package) {
                const packageName = this.extractPackageName(app.package, app.type);
                packages[packageName] = app.package;
            }
            else {
                // Auto-generate package path if not specified
                const packageName = app.id || app.type;
                if (app.type === 'web') {
                    packages[packageName] = `apps/${packageName}`;
                }
                else if (app.type === 'api') {
                    packages[packageName] = `packages/${packageName}`;
                }
                else if (app.type === 'mobile') {
                    packages[packageName] = `apps/${packageName}`;
                }
            }
        }
        // 2. Packages based on capabilities (shared code)
        const hasSharedCapabilities = this.hasSharedCode(capabilities);
        if (hasSharedCapabilities) {
            packages.shared = 'packages/shared';
        }
        // 3. Add packages that will actually be used by modules (from resolved target packages)
        // This ensures we create packages that will receive content
        for (const usedPackage of usedPackages) {
            // Extract package name from path (e.g., 'packages/ui' -> 'ui', 'apps/web' -> 'web')
            const parts = usedPackage.split('/');
            const packageName = parts.length > 0 ? parts[parts.length - 1] : null;
            if (packageName && !packages[packageName]) {
                packages[packageName] = usedPackage;
                Logger.debug(`📦 Added package from module resolution: ${packageName} (${usedPackage})`, {
                    operation: 'structure_initialization',
                    packageName,
                    packagePath: usedPackage
                });
            }
        }
        // 4. Packages based on capabilities (only if they will be used)
        // Skip creating packages for capabilities that won't receive content
        for (const [capabilityId, capabilityConfig] of Object.entries(capabilities)) {
            const packageName = this.getCapabilityPackageName(capabilityId);
            const packagePath = `packages/${packageName}`;
            // Only add if this package will actually be used OR if it's explicitly needed
            if (usedPackages.has(packagePath)) {
                if (!packages[packageName]) {
                    packages[packageName] = packagePath;
                    Logger.debug(`📦 Added package from capability (will be used): ${packageName}`, {
                        operation: 'structure_initialization',
                        capabilityId,
                        packageName
                    });
                }
            }
            else {
                // Check if this capability really needs its own package
                const needsPackage = this.capabilityNeedsPackage(capabilityId, capabilityConfig, modules);
                if (needsPackage && !packages[packageName]) {
                    // Only add if it's a critical package (like database, ui)
                    const criticalPackages = ['database', 'ui'];
                    if (criticalPackages.includes(packageName)) {
                        packages[packageName] = packagePath;
                        Logger.debug(`📦 Added critical package from capability: ${packageName}`, {
                            operation: 'structure_initialization',
                            capabilityId,
                            packageName
                        });
                    }
                }
            }
        }
        // 5. Ensure required packages are always created (apps, shared, ui, database)
        // These are always needed regardless of usage
        if (!packages.shared && (usedPackages.has('packages/shared') || capabilities && Object.keys(capabilities).length > 0)) {
            packages.shared = 'packages/shared';
        }
        // UI package is always created if UI modules exist
        const hasUIModules = modules.some(m => {
            const id = typeof m === 'string' ? m : m.id;
            return id?.includes('ui/') || id?.includes('tamagui') || id?.includes('shadcn');
        });
        if (hasUIModules && !packages.ui) {
            packages.ui = 'packages/ui';
        }
        // Database package is always created if database modules exist
        const hasDatabaseModules = modules.some(m => {
            const id = typeof m === 'string' ? m : m.id;
            return id?.includes('database/') || id?.includes('db/') || id?.includes('drizzle') || id?.includes('prisma');
        });
        if (hasDatabaseModules && !packages.database) {
            packages.database = 'packages/database';
        }
        return packages;
    }
    /**
     * Check if capabilities require shared code
     */
    hasSharedCode(capabilities) {
        // Capabilities that typically need shared code (tech-stack, schemas, types)
        const sharedCapabilities = [
            'auth', 'payments', 'teams-management', 'emailing',
            'monitoring', 'ai-chat', 'synap', 'semantic-search',
            'projects', 'web3', 'waitlist', 'architech-welcome'
        ];
        return Object.keys(capabilities).some(key => sharedCapabilities.includes(key));
    }
    /**
     * Determine if a capability needs its own dedicated package
     */
    capabilityNeedsPackage(capabilityId, capabilityConfig, modules) {
        // Capabilities that typically need their own package
        const packageCapabilities = [
            'auth', 'payments', 'database', 'emailing', 'teams-management'
        ];
        if (!packageCapabilities.includes(capabilityId)) {
            return false;
        }
        // Check if there are modules for this capability that would benefit from a dedicated package
        const hasCapabilityModules = modules.some(m => m.id?.includes(capabilityId) ||
            m.id?.includes(`adapters/${capabilityId}/`) ||
            m.id?.includes(`features/${capabilityId}/`));
        return hasCapabilityModules;
    }
    /**
     * Get package name for a capability
     */
    getCapabilityPackageName(capabilityId) {
        // Map capability IDs to package names
        const mapping = {
            'auth': 'auth',
            'payments': 'payments',
            'database': 'database',
            'emailing': 'emailing',
            'teams-management': 'teams',
            'monitoring': 'monitoring',
            'ai-chat': 'ai',
            'projects': 'projects'
        };
        return mapping[capabilityId] || capabilityId;
    }
    /**
     * Extract package name from app package path
     */
    extractPackageName(packagePath, appType) {
        // Extract from path like "apps/web" -> "web"
        const parts = packagePath.split('/');
        return parts[parts.length - 1] || appType;
    }
    /**
     * Get package type (app or package)
     */
    getPackageType(packageName) {
        if (packageName === 'web' || packageName === 'mobile' || packageName === 'api') {
            return 'app';
        }
        return 'package';
    }
    /**
     * Merge required packages with explicit config
     * Explicit config takes precedence
     */
    mergePackages(required, explicit) {
        // Explicit config takes precedence, but we keep required packages that aren't explicit
        return { ...required, ...explicit };
    }
    /**
     * Initialize a package (create package.json, tsconfig, src/, etc.)
     */
    async initializePackage(packageName, packagePath, fullPath, genome) {
        // Create src directory
        await fs.mkdir(path.join(fullPath, 'src'), { recursive: true });
        // Determine package type and dependencies based on package name and genome
        const packageConfig = this.determinePackageConfig(packageName, packagePath, genome);
        // Create package.json with dynamic configuration
        const packageJson = {
            name: `@repo/${packageName}`,
            version: '1.0.0',
            private: true,
            main: 'src/index.ts',
            types: 'src/index.ts',
            scripts: packageConfig.scripts || {},
            dependencies: packageConfig.dependencies || {},
            devDependencies: packageConfig.devDependencies || {},
            ...packageConfig.extra
        };
        await fs.writeFile(path.join(fullPath, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
        Logger.info(`📦 Created package.json for ${packageName}`, {
            operation: 'structure_initialization',
            packageName,
            packagePath,
            hasDependencies: Object.keys(packageConfig.dependencies || {}).length > 0
        });
        // Create tsconfig.json for TypeScript packages
        const tsconfig = {
            extends: '../../tsconfig.json',
            compilerOptions: {
                outDir: './dist',
                rootDir: './src'
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
        };
        await fs.writeFile(path.join(fullPath, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n');
        // Create index.ts placeholder
        // ResolvedGenome guarantees modules is always an array
        await this.createPackageIndex(packageName, fullPath, genome.capabilities || {}, genome.modules);
    }
    /**
     * Determine package configuration (dependencies, scripts, etc.) based on package name and genome
     */
    determinePackageConfig(packageName, packagePath, genome) {
        const capabilities = genome.capabilities || {};
        const isMonorepo = genome.project.structure === 'monorepo';
        const monorepoConfig = genome.project.monorepo;
        // Base TypeScript dependencies for all packages
        const baseDevDependencies = {
            'typescript': '^5.0.0',
            '@types/node': '^20.0.0'
        };
        // Package-specific configurations
        const configs = {
            'shared': {
                dependencies: {},
                devDependencies: baseDevDependencies,
                scripts: {
                    'build': 'tsc',
                    'dev': 'tsc --watch'
                }
            },
            'auth': {
                dependencies: {
                // Will be added by adapters/auth/better-auth module
                },
                devDependencies: baseDevDependencies,
                scripts: {
                    'build': 'tsc',
                    'dev': 'tsc --watch'
                }
            },
            'database': {
                dependencies: {
                // Will be added by adapters/database/drizzle module
                },
                devDependencies: {
                    ...baseDevDependencies,
                    'drizzle-kit': 'latest'
                },
                scripts: {
                    'build': 'tsc',
                    'dev': 'tsc --watch',
                    'db:generate': 'drizzle-kit generate',
                    'db:migrate': 'drizzle-kit migrate'
                }
            },
            'payments': {
                dependencies: {
                // Will be added by adapters/payments/stripe module
                },
                devDependencies: baseDevDependencies,
                scripts: {
                    'build': 'tsc',
                    'dev': 'tsc --watch'
                }
            },
            'emailing': {
                dependencies: {
                // Will be added by adapters/emailing/resend module
                },
                devDependencies: baseDevDependencies,
                scripts: {
                    'build': 'tsc',
                    'dev': 'tsc --watch'
                }
            }
        };
        // Get base config for this package
        const baseConfig = configs[packageName] || {
            dependencies: {},
            devDependencies: baseDevDependencies,
            scripts: {
                'build': 'tsc',
                'dev': 'tsc --watch'
            }
        };
        // Add workspace references if monorepo
        // IMPORTANT: Format depends on package manager
        // - npm: uses file: protocol (doesn't support workspace:*)
        // - pnpm/yarn: uses workspace:* protocol
        if (isMonorepo && monorepoConfig) {
            const workspaceDeps = {};
            const packages = monorepoConfig.packages || {};
            // Detect package manager from genome or monorepo config
            // Check if turborepo module has packageManager parameter
            const turborepoModule = genome.modules?.find((m) => m.id === 'monorepo/turborepo' || m.id === 'adapters/monorepo/turborepo');
            const packageManager = turborepoModule?.parameters?.packageManager || 'npm';
            // Determine workspace protocol based on package manager
            const useWorkspaceProtocol = packageManager === 'pnpm' || packageManager === 'yarn';
            // Add dependencies on other packages if needed
            // Apps (web, api) depend on shared packages
            if (packageName === 'web' || packageName === 'api') {
                // Calculate relative path from app package to target package
                const getRelativePath = (targetPackagePath) => {
                    if (useWorkspaceProtocol) {
                        return 'workspace:*';
                    }
                    // For npm, use file: protocol with relative path
                    // packagePath is like "apps/web" or "packages/shared"
                    // targetPackagePath is like "packages/shared" or "packages/auth"
                    const appBaseDir = packagePath.startsWith('apps/') ? 'apps' : 'packages';
                    const targetBaseDir = targetPackagePath.startsWith('apps/') ? 'apps' : 'packages';
                    if (appBaseDir === targetBaseDir) {
                        // Same base directory (e.g., apps/web -> apps/api)
                        const targetName = targetPackagePath.split('/').pop() || targetPackagePath;
                        return `file:../${targetName}`;
                    }
                    else {
                        // Different base directory (e.g., apps/web -> packages/shared)
                        // From apps/web to packages/shared: go up to root (../../) then into packages/shared
                        return `file:../../${targetPackagePath}`;
                    }
                };
                // Apps depend on shared packages
                if (packages.shared) {
                    workspaceDeps['@repo/shared'] = getRelativePath(packages.shared);
                }
                if (packages.auth) {
                    workspaceDeps['@repo/auth'] = getRelativePath(packages.auth);
                }
                if (packages.database) {
                    workspaceDeps['@repo/database'] = getRelativePath(packages.database);
                }
                if (packages.payments) {
                    workspaceDeps['@repo/payments'] = getRelativePath(packages.payments);
                }
            }
            if (Object.keys(workspaceDeps).length > 0) {
                baseConfig.dependencies = {
                    ...baseConfig.dependencies,
                    ...workspaceDeps
                };
            }
        }
        return baseConfig;
    }
    /**
     * Create index.ts placeholder for package
     */
    async createPackageIndex(packageName, fullPath, capabilities, modules) {
        const indexContent = `/**
 * ${packageName} package
 * 
 * ${this.getPackagePurpose(packageName, capabilities, modules)}
 */

export {};
`;
        await fs.writeFile(path.join(fullPath, 'src', 'index.ts'), indexContent);
    }
    /**
     * Get package purpose description
     */
    getPackagePurpose(packageName, capabilities, modules) {
        if (packageName === 'shared') {
            const capabilityNames = Object.keys(capabilities);
            if (capabilityNames.length > 0) {
                return `Shared code for capabilities: ${capabilityNames.join(', ')}`;
            }
            return 'Shared code and utilities';
        }
        if (packageName === 'web') {
            return 'Web application';
        }
        if (packageName === 'api') {
            return 'API server';
        }
        if (packageName === 'mobile') {
            return 'Mobile application';
        }
        return 'Package';
    }
    /**
     * Create minimal root package.json WITHOUT workspaces property
     * This prevents create-next-app from detecting workspace and generating workspace:* references
     * The workspaces property will be added by the monorepo/turborepo module after apps are created
     */
    async createRootPackageJsonMinimal(packages, monorepoConfig) {
        const projectRoot = this.pathHandler.getProjectRoot();
        // Create minimal package.json WITHOUT workspaces to avoid workspace detection
        // during framework setup (create-next-app, etc.)
        const packageJson = {
            name: this.pathHandler.projectName || 'monorepo',
            version: '1.0.0',
            private: true,
            // NOTE: workspaces property is intentionally omitted here
            // It will be added by the monorepo/turborepo module after apps are created
            scripts: {
                dev: 'turbo run dev',
                build: 'turbo run build',
                lint: 'turbo run lint'
            },
            devDependencies: {}
        };
        // Add monorepo tool as dev dependency
        if (monorepoConfig?.tool === 'turborepo') {
            packageJson.devDependencies['turbo'] = 'latest';
        }
        await fs.writeFile(path.join(projectRoot, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
        Logger.info('📄 Created minimal root package.json (without workspaces)', {
            operation: 'structure_initialization'
        });
    }
    /**
     * Generate monorepo tool configuration
     */
    async generateMonorepoToolConfig(packages, monorepoConfig) {
        const projectRoot = this.pathHandler.getProjectRoot();
        const tool = monorepoConfig?.tool || 'turborepo';
        if (tool === 'turborepo') {
            const turboConfig = {
                $schema: 'https://turbo.build/schema.json',
                pipeline: {
                    build: {
                        dependsOn: ['^build'],
                        outputs: ['.next/**', '!.next/cache/**', 'dist/**']
                    },
                    dev: {
                        cache: false,
                        persistent: true
                    },
                    lint: {
                        dependsOn: ['^lint']
                    }
                }
            };
            await fs.writeFile(path.join(projectRoot, 'turbo.json'), JSON.stringify(turboConfig, null, 2) + '\n');
            Logger.info('📄 Created turbo.json', {
                operation: 'structure_initialization'
            });
        }
    }
}
//# sourceMappingURL=structure-initialization-layer.js.map