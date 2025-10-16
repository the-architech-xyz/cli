import { Logger } from '../infrastructure/logging/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class ComposableFeatureResolver {
    moduleService;
    marketplacePath;
    constructor(moduleService, marketplacePath) {
        this.moduleService = moduleService;
        this.marketplacePath = marketplacePath;
    }
    async resolveFeature(featureId, projectStack) {
        Logger.debug(`Resolving composable feature: ${featureId}`, {
            operation: 'feature_resolution',
            featureId,
            projectStack
        });
        // 1. Read the master schema
        const masterSchemaPath = path.join(this.marketplacePath, 'features', featureId, 'feature.master.json');
        const masterSchema = await this.readMasterSchema(masterSchemaPath);
        // 2. Find backend implementation
        const backendImplementation = await this.findBackendImplementation(featureId, projectStack.backend);
        // 3. Find frontend implementation
        const frontendImplementation = await this.findFrontendImplementation(featureId, projectStack.frontend);
        // 4. Resolve sub-features (for now, return empty array - can be enhanced later)
        const subFeatures = [];
        const resolvedFeature = {
            featureId,
            masterSchema,
            ...(backendImplementation && { backendImplementation }),
            ...(frontendImplementation && { frontendImplementation }),
            subFeatures
        };
        Logger.debug(`Resolved composable feature: ${featureId}`, {
            operation: 'feature_resolution',
            featureId,
            hasBackend: !!backendImplementation,
            hasFrontend: !!frontendImplementation,
            subFeaturesCount: subFeatures.length
        });
        return resolvedFeature;
    }
    async convertToModules(resolvedFeature) {
        const modules = [];
        // Add backend implementation as a module
        if (resolvedFeature.backendImplementation) {
            const backendModule = await this.convertImplementationToModule(resolvedFeature.backendImplementation, 'backend');
            modules.push(backendModule);
        }
        // Add frontend implementation as a module
        if (resolvedFeature.frontendImplementation) {
            const frontendModule = await this.convertImplementationToModule(resolvedFeature.frontendImplementation, 'frontend');
            modules.push(frontendModule);
        }
        return modules;
    }
    async readMasterSchema(schemaPath) {
        try {
            const schemaContent = await fs.readFile(schemaPath, 'utf-8');
            return JSON.parse(schemaContent);
        }
        catch (error) {
            Logger.error(`Failed to read master schema: ${schemaPath}`, {
                operation: 'feature_resolution',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Failed to read master schema: ${schemaPath}`);
        }
    }
    async findBackendImplementation(featureId, backendStack) {
        const backendDir = path.join(this.marketplacePath, 'features', featureId, 'backend');
        try {
            const backendDirs = await fs.readdir(backendDir);
            for (const dir of backendDirs) {
                const implementationPath = path.join(backendDir, dir, 'implementation.json');
                try {
                    const implementationContent = await fs.readFile(implementationPath, 'utf-8');
                    const implementation = JSON.parse(implementationContent);
                    // Check if this implementation matches the project stack
                    if (this.matchesBackendStack(implementation, backendStack)) {
                        return implementation;
                    }
                }
                catch (error) {
                    Logger.warn(`Failed to read implementation: ${implementationPath}`, {
                        operation: 'feature_resolution',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    continue;
                }
            }
        }
        catch (error) {
            Logger.warn(`Failed to read backend directory: ${backendDir}`, {
                operation: 'feature_resolution',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        Logger.warn(`No backend implementation found for feature: ${featureId}`, {
            operation: 'feature_resolution',
            featureId,
            backendStack
        });
        return undefined;
    }
    async findFrontendImplementation(featureId, frontendStack) {
        const frontendDir = path.join(this.marketplacePath, 'features', featureId, 'frontend');
        try {
            const frontendDirs = await fs.readdir(frontendDir);
            for (const dir of frontendDirs) {
                const implementationPath = path.join(frontendDir, dir, 'implementation.json');
                try {
                    const implementationContent = await fs.readFile(implementationPath, 'utf-8');
                    const implementation = JSON.parse(implementationContent);
                    // Check if this implementation matches the project stack
                    if (this.matchesFrontendStack(implementation, frontendStack)) {
                        return implementation;
                    }
                }
                catch (error) {
                    Logger.warn(`Failed to read implementation: ${implementationPath}`, {
                        operation: 'feature_resolution',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    continue;
                }
            }
        }
        catch (error) {
            Logger.warn(`Failed to read frontend directory: ${frontendDir}`, {
                operation: 'feature_resolution',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        Logger.warn(`No frontend implementation found for feature: ${featureId}`, {
            operation: 'feature_resolution',
            featureId,
            frontendStack
        });
        return undefined;
    }
    matchesBackendStack(implementation, backendStack) {
        const techStack = implementation.tech_stack;
        return techStack.database === backendStack.database &&
            techStack.framework === backendStack.framework;
    }
    matchesFrontendStack(implementation, frontendStack) {
        const techStack = implementation.tech_stack;
        return techStack.ui === frontendStack.ui &&
            techStack.framework === frontendStack.framework;
    }
    async convertImplementationToModule(implementation, type) {
        const techStackKey = type === 'backend' ? 'database' : 'ui';
        const techStack = implementation.tech_stack[techStackKey];
        if (!techStack) {
            throw new Error(`Missing tech stack configuration for ${techStackKey} in implementation ${implementation.id}`);
        }
        const blueprintPath = path.join(this.marketplacePath, 'features', implementation.implements, type, techStack, implementation.blueprint);
        try {
            Logger.debug(`Reading blueprint: ${blueprintPath}`, {
                operation: 'feature_resolution',
                implementationId: implementation.id,
                type
            });
            const blueprintContent = await fs.readFile(blueprintPath, 'utf-8');
            // Parse the blueprint as JSON
            const blueprint = JSON.parse(blueprintContent);
            return {
                id: implementation.id,
                category: 'feature',
                config: {
                    ...implementation,
                    category: 'feature',
                    blueprint: blueprint,
                    capabilities: implementation.provides?.capabilities ? {
                        [implementation.id]: {
                            version: implementation.version,
                            description: implementation.description,
                            provides: implementation.provides.capabilities
                        }
                    } : {},
                    prerequisites: implementation.prerequisites || {}
                },
                parameters: {},
                features: {}
            };
        }
        catch (error) {
            Logger.error(`Failed to convert implementation to module: ${implementation.id}`, {
                operation: 'feature_resolution',
                implementationId: implementation.id,
                type,
                blueprintPath,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}
//# sourceMappingURL=composable-feature-resolver.js.map