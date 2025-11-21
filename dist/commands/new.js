/**
 * New Command
 *
 * Creates a new project from a TypeScript genome file
 * Usage: architech new <genome-file.ts>
 */
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname, isAbsolute } from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { isV2Genome } from '@thearchitech.xyz/types';
import { OrchestratorAgent } from '../agents/orchestrator-agent.js';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';
import { EnhancedLogger } from '../core/cli/enhanced-logger.js';
import { ErrorHandler } from '../core/services/infrastructure/error/index.js';
import { createGenomeResolver } from '../core/services/genome-resolution/index.js';
import { MarketplaceRegistry } from '../core/services/marketplace/marketplace-registry.js';
import { V2GenomeHandler } from '../core/services/composition/v2-genome-handler.js';
import { fileURLToPath, pathToFileURL } from 'url';
export function createNewCommand() {
    const command = new Command('new');
    command
        .description('Create a new project from a genome')
        .argument('[project-name]', 'Project name (optional, for interactive mode)')
        .option('-g, --genome <genome>', 'Genome name or path to .genome.ts file')
        .option('-l, --list', 'List available genomes before choosing', false)
        .option('-d, --dry-run', 'Show what would be created without executing', false)
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-q, --quiet', 'Suppress all output except errors', false)
        .option('--ui-framework <framework>', 'UI framework to use (shadcn, tamagui)', 'shadcn')
        .action(async (projectName, options) => {
        const logger = new Logger(options.verbose);
        try {
            // Handle --list flag
            if (options.list) {
                await showGenomeList(logger);
                return;
            }
            // Determine genome input (from --genome flag or positional arg for backward compat)
            let genomeInput = options.genome || projectName;
            // If no genome specified, show interactive picker
            if (!genomeInput) {
                genomeInput = await promptForGenome(logger);
            }
            if (!genomeInput) {
                logger.error('❌ No genome specified');
                logger.info('💡 Use: architech new --genome <name> or architech new <path>');
                logger.info('💡 Or run: architech new --list');
                process.exit(1);
            }
            logger.info(`🚀 Creating new project with genome: ${genomeInput}`);
            // GENOME RESOLUTION LAYER (NEW!)
            logger.info('🔍 Resolving genome...');
            const resolver = createGenomeResolver();
            let resolved;
            try {
                resolved = await resolver.resolve(genomeInput, {
                    verbose: options.verbose
                });
            }
            catch (error) {
                logger.error(`❌ Genome not found: ${genomeInput}`);
                logger.info('💡 Available genomes:');
                logger.info('  - hello-world: Minimal Next.js starter');
                logger.info('  - saas-starter: Full-featured SaaS template');
                logger.info('  - ai-chatbot: AI-powered chat application');
                logger.info('💡 Or use: architech new --list');
                process.exit(1);
            }
            logger.info(`✅ Resolved genome: ${resolved.name}`);
            logger.info(`📁 Source: ${resolved.source}`);
            if (resolved.metadata) {
                logger.info(`📊 Complexity: ${resolved.metadata.complexity} (${resolved.metadata.moduleCount} modules)`);
                if (resolved.metadata.estimatedTime) {
                    logger.info(`⏱️  Estimated time: ${resolved.metadata.estimatedTime}`);
                }
            }
            // Use resolved path for execution
            const genomePath = resolved.path;
            // Check if file exists
            try {
                readFileSync(genomePath, 'utf-8');
            }
            catch (error) {
                logger.error(`❌ Genome file not found: ${genomePath}`);
                process.exit(1);
            }
            // Execute the TypeScript genome file with tsx
            logger.info('🔧 Executing TypeScript genome...');
            const rawGenome = await executeTypeScriptGenome(genomePath, logger);
            if (!rawGenome) {
                logger.error('❌ Failed to execute genome file');
                process.exit(1);
            }
            // Check if this is a V2 genome
            const isV2 = isV2Genome(rawGenome);
            if (isV2) {
                logger.info('🧬 Detected V2 genome format - using Composition Engine');
                return await handleV2Genome(rawGenome, genomePath, options, logger);
            }
            // Transform genome (handles both capability-first and module-first genomes) - V1 path
            logger.info('🔄 Transforming genome...');
            logger.debug('Genome snapshot before transformation', {
                hasModules: Array.isArray(rawGenome.modules),
                moduleCount: Array.isArray(rawGenome.modules) ? rawGenome.modules.length : 0,
                transformationMode: rawGenome.transformation?.mode || rawGenome.options?.transformation?.mode,
            });
            const marketplaceResolution = await configureMarketplaceOverrides(rawGenome, genomePath, logger);
            let marketplaceAdapter = marketplaceResolution?.adapterPath
                ? await loadMarketplaceAdapter(marketplaceResolution.adapterPath, logger)
                : undefined;
            if (!marketplaceAdapter) {
                marketplaceAdapter = await loadDefaultMarketplaceAdapter(logger);
            }
            if (marketplaceAdapter?.validateGenome) {
                await marketplaceAdapter.validateGenome(rawGenome);
            }
            if (marketplaceAdapter?.getDefaultParameters && Array.isArray(rawGenome.modules)) {
                rawGenome.modules = rawGenome.modules.map((module) => {
                    const defaults = marketplaceAdapter.getDefaultParameters(module.id);
                    if (!defaults) {
                        return module;
                    }
                    const parameters = module.parameters ? { ...defaults, ...module.parameters } : { ...defaults };
                    return {
                        ...module,
                        parameters,
                    };
                });
            }
            // Transform genome via marketplace adapter (required - no legacy fallback)
            if (!marketplaceAdapter?.transformGenome) {
                logger.error('❌ The selected marketplace does not support the required "transformGenome" capability.');
                logger.error('   This marketplace adapter must implement the transformGenome method to be compatible with this CLI version.');
                process.exit(1);
            }
            let validatedGenome;
            let transformationMode = 'agnostic';
            const { transformerOptions, mode: resolvedMode } = resolveTransformationOptions(rawGenome, logger);
            transformationMode = resolvedMode;
            logger.info('🔄 Transforming genome via marketplace adapter...');
            try {
                validatedGenome = await marketplaceAdapter.transformGenome(rawGenome, {
                    mode: transformationMode,
                    options: {
                        ...transformerOptions,
                        // Ensure index signature compatibility
                    },
                });
                const originalModuleCount = rawGenome.modules?.length || 0;
                const transformedModuleCount = validatedGenome.modules?.length || 0;
                logger.info(`✅ Genome transformed via adapter: ${originalModuleCount} → ${transformedModuleCount} modules`);
            }
            catch (error) {
                logger.error(`❌ Genome transformation via adapter failed: ${error instanceof Error ? error.message : String(error)}`);
                process.exit(1);
            }
            const debugEventStoreModule = validatedGenome.modules?.find((module) => module.id === 'capabilities/event-store');
            if (debugEventStoreModule) {
                logger.debug?.('Module metadata snapshot', {
                    moduleId: debugEventStoreModule.id,
                    hasResolved: !!debugEventStoreModule.resolved,
                    hasSource: !!debugEventStoreModule.source,
                    marketplace: debugEventStoreModule.marketplace?.name,
                });
            }
            // Ensure modules have default values for optional fields
            validatedGenome.modules = validatedGenome.modules.map((module) => ({
                ...module,
                category: module.category || extractCategoryFromModuleId(module.id),
                version: module.version || 'latest',
                parameters: module.parameters || {},
            }));
            if (transformationMode === 'opinionated') {
                validatedGenome.project.skipFrameworkSetup = true;
                if (!validatedGenome.options) {
                    validatedGenome.options = {};
                }
                validatedGenome.options.skipFrameworkSetup = true;
                validatedGenome.metadata = {
                    ...validatedGenome.metadata,
                    transformationMode,
                };
            }
            // Auto-generate project path if missing
            if (!validatedGenome.project.path) {
                validatedGenome.project.path = `./${validatedGenome.project.name || 'my-app'}`;
            }
            // Add UI framework parameter if provided
            if (options.uiFramework) {
                if (!validatedGenome.options) {
                    validatedGenome.options = {};
                }
                validatedGenome.options.uiFramework = options.uiFramework;
            }
            // Validate genome structure (now we know it has modules)
            const validation = validateRecipe(validatedGenome);
            if (!validation.valid) {
                logger.error('❌ Invalid genome structure:');
                validation.errors.forEach(error => logger.error(`  - ${error}`));
                process.exit(1);
            }
            // Initialize enhanced logger
            const enhancedLogger = new EnhancedLogger({
                verbose: options.verbose || false,
                quiet: options.quiet || false
            });
            if (options.dryRun) {
                enhancedLogger.info('Dry run mode - showing what would be created:');
                showDryRunPreview(validatedGenome, logger);
                return;
            }
            const marketplaceInfo = marketplaceResolution.marketplaceInfo ??
                rawGenome.marketplace ??
                (marketplaceAdapter ? { name: 'core' } : undefined);
            // Initialize project manager and orchestrator
            const projectManager = new ProjectManager(validatedGenome.project);
            const orchestrator = new OrchestratorAgent(projectManager);
            // Execute the genome with enhanced logging
            const result = await orchestrator.executeRecipe(validatedGenome, options.verbose, enhancedLogger, {
                marketplaceAdapter,
                marketplaceInfo,
                pathOverrides: marketplaceResolution.pathOverrides,
            });
            if (result.success) {
                enhancedLogger.success('Project created successfully!');
                enhancedLogger.logNextSteps(validatedGenome.project.path || './', validatedGenome.project.name);
                if (result.warnings && result.warnings.length > 0) {
                    enhancedLogger.warn('Warnings:');
                    result.warnings.forEach((warning) => enhancedLogger.warn(`  - ${warning}`));
                }
            }
            else {
                enhancedLogger.error('Project creation failed:');
                if (result.errors) {
                    result.errors.forEach((error) => enhancedLogger.error(`  - ${error}`));
                }
                process.exit(1);
            }
        }
        catch (error) {
            const criticalErrorResult = ErrorHandler.handleCriticalError(error, 'new-command', 'project_creation', options.verbose);
            logger.error(`💥 ${ErrorHandler.formatUserError(criticalErrorResult, options.verbose)}`);
            process.exit(1);
        }
    });
    return command;
}
function resolveTransformationOptions(rawGenome, logger) {
    const defaultOptions = {
        enableCapabilityResolution: true,
        enableAutoInclusion: true,
        enableParameterDistribution: true,
        enableConnectorAutoInclusion: true,
    };
    let mode = 'agnostic';
    if (!rawGenome || typeof rawGenome !== 'object') {
        return { mode, transformerOptions: defaultOptions };
    }
    const transformationConfig = rawGenome.transformation || rawGenome.options?.transformation;
    const declaredMode = transformationConfig?.mode || rawGenome.meta?.transformation?.mode;
    if (declaredMode === 'opinionated') {
        logger.info('🧩 Using opinionated transformation mode (marketplace-controlled)');
        mode = 'opinionated';
        return {
            mode,
            transformerOptions: {
                enableCapabilityResolution: false,
                enableAutoInclusion: false,
                enableParameterDistribution: false,
                enableConnectorAutoInclusion: false,
            },
        };
    }
    if (declaredMode === 'agnostic') {
        logger.info('🧩 Using agnostic transformation mode (default pipeline)');
        mode = 'agnostic';
        return { mode, transformerOptions: defaultOptions };
    }
    if (transformationConfig?.options && typeof transformationConfig.options === 'object') {
        logger.info('🧩 Applying custom transformation options from genome metadata');
        return {
            mode,
            transformerOptions: {
                enableCapabilityResolution: transformationConfig.options.enableCapabilityResolution ?? defaultOptions.enableCapabilityResolution,
                enableAutoInclusion: transformationConfig.options.enableAutoInclusion ?? defaultOptions.enableAutoInclusion,
                enableParameterDistribution: transformationConfig.options.enableParameterDistribution ?? defaultOptions.enableParameterDistribution,
                enableConnectorAutoInclusion: transformationConfig.options.enableConnectorAutoInclusion ?? defaultOptions.enableConnectorAutoInclusion,
            },
        };
    }
    return { mode, transformerOptions: defaultOptions };
}
function normalizeMarketplacePath(value, baseDir) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }
    if (trimmed.startsWith('file://')) {
        try {
            return fileURLToPath(new URL(trimmed));
        }
        catch {
            return undefined;
        }
    }
    if (isAbsolute(trimmed)) {
        return trimmed;
    }
    return resolve(baseDir, trimmed);
}
async function loadMarketplaceAdapter(adapterPath, logger) {
    try {
        const moduleUrl = pathToFileURL(adapterPath);
        const imported = await import(moduleUrl.href);
        const adapter = imported.default ??
            imported.marketplaceAdapter ??
            imported.adapter ??
            imported.synapMarketplaceAdapter;
        if (!adapter) {
            logger.warn('⚠️  Marketplace adapter module did not export an adapter instance', { adapterPath });
        }
        return adapter;
    }
    catch (error) {
        logger.warn('⚠️  Failed to load marketplace adapter', {
            adapterPath,
            error: error instanceof Error ? error.message : error,
        });
        return undefined;
    }
}
async function loadDefaultMarketplaceAdapter(logger) {
    try {
        const imported = await import('@thearchitech.xyz/marketplace/adapter');
        const adapter = imported.default ??
            imported.marketplaceAdapter ??
            imported.adapter;
        if (!adapter) {
            logger.debug?.('⚠️  Default marketplace adapter module did not export an adapter instance', {});
        }
        return adapter;
    }
    catch (error) {
        logger.debug?.('ℹ️  Default marketplace adapter unavailable', {
            error: error instanceof Error ? error.message : error,
        });
        return undefined;
    }
}
async function configureMarketplaceOverrides(rawGenome, genomePath, logger) {
    const result = {};
    if (!rawGenome || typeof rawGenome !== 'object') {
        return result;
    }
    const marketplaceConfig = rawGenome.marketplace || rawGenome.marketplaces;
    if (!marketplaceConfig || typeof marketplaceConfig !== 'object') {
        return result;
    }
    const baseDir = dirname(genomePath);
    const overrides = (typeof marketplaceConfig.overrides === 'object' && marketplaceConfig.overrides) || marketplaceConfig;
    const rawName = typeof marketplaceConfig.name === 'string' ? marketplaceConfig.name.trim() : undefined;
    const normalizedName = rawName && rawName.length > 0 ? rawName : 'core';
    const normalizedInfo = { name: normalizedName };
    const rootCandidate = marketplaceConfig.root ?? overrides.core;
    const resolvedRoot = normalizeMarketplacePath(rootCandidate, baseDir);
    if (resolvedRoot) {
        normalizedInfo.root = resolvedRoot;
        const isCoreMarketplace = normalizedName === 'core' || normalizedName === '@thearchitech.xyz/marketplace';
        if (isCoreMarketplace) {
            MarketplaceRegistry.setMarketplacePath('core', resolvedRoot);
            logger.info('🛒 Using custom core marketplace override', { corePath: resolvedRoot });
            result.corePath = resolvedRoot;
        }
    }
    else if (typeof marketplaceConfig.root === 'string') {
        normalizedInfo.root = marketplaceConfig.root;
    }
    const manifestCandidate = marketplaceConfig.manifest ?? overrides.manifest;
    const resolvedManifest = normalizeMarketplacePath(manifestCandidate, resolvedRoot ?? baseDir);
    if (resolvedManifest) {
        normalizedInfo.manifest = resolvedManifest;
        result.manifestPath = resolvedManifest;
    }
    else if (typeof marketplaceConfig.manifest === 'string') {
        normalizedInfo.manifest = marketplaceConfig.manifest;
    }
    const adapterCandidate = marketplaceConfig.adapter ?? overrides.adapter;
    const resolvedAdapter = normalizeMarketplacePath(adapterCandidate, resolvedRoot ?? baseDir);
    if (resolvedAdapter) {
        normalizedInfo.adapter = resolvedAdapter;
        result.adapterPath = resolvedAdapter;
    }
    else if (typeof marketplaceConfig.adapter === 'string') {
        normalizedInfo.adapter = marketplaceConfig.adapter;
    }
    if (typeof marketplaceConfig.types === 'string') {
        const resolvedTypes = normalizeMarketplacePath(marketplaceConfig.types, resolvedRoot ?? baseDir);
        normalizedInfo.types = resolvedTypes ?? marketplaceConfig.types;
    }
    if (typeof marketplaceConfig.version === 'string') {
        normalizedInfo.version = marketplaceConfig.version;
    }
    const pathOverrideSource = overrides.paths || marketplaceConfig.paths;
    if (pathOverrideSource && typeof pathOverrideSource === 'object') {
        const normalizedOverrides = {};
        for (const [key, value] of Object.entries(pathOverrideSource)) {
            if (typeof value === 'string' && value.trim().length > 0) {
                normalizedOverrides[key] = value;
            }
        }
        if (Object.keys(normalizedOverrides).length > 0) {
            result.pathOverrides = normalizedOverrides;
        }
    }
    const uiOverrides = overrides.ui || marketplaceConfig.ui;
    if (uiOverrides && typeof uiOverrides === 'object') {
        for (const [uiName, overridePath] of Object.entries(uiOverrides)) {
            if (!overridePath)
                continue;
            const resolvedPath = normalizeMarketplacePath(overridePath, resolvedRoot ?? baseDir);
            if (!resolvedPath)
                continue;
            MarketplaceRegistry.setMarketplacePath(uiName, resolvedPath);
            logger.info('🛒 Registered UI marketplace override', { uiName, path: resolvedPath });
        }
    }
    result.marketplaceInfo = normalizedInfo;
    return result;
}
/**
 * Execute a TypeScript genome file and return the Genome object
 */
async function executeTypeScriptGenome(genomePath, logger) {
    try {
        // Create a temporary wrapper script that imports and outputs the genome as JSON
        const { writeFileSync, unlinkSync } = await import('fs');
        const { tmpdir } = await import('os');
        const { join, dirname } = await import('path');
        const tempScriptPath = join(tmpdir(), `genome-loader-${Date.now()}.mjs`);
        const wrapperScript = `
import genome from '${genomePath}';
console.log(JSON.stringify(genome));
`;
        writeFileSync(tempScriptPath, wrapperScript);
        try {
            // Find the marketplace root to resolve imports correctly
            // The genome is in marketplace/genomes/*, so go up 2 directories to get marketplace root
            const marketplaceRoot = dirname(dirname(genomePath));
            // Execute with tsx via npx from the marketplace directory so imports can be resolved
            const result = execSync(`npx --yes tsx ${tempScriptPath} `, {
                encoding: 'utf-8',
                cwd: marketplaceRoot, // Run from marketplace root to resolve @thearchitech.xyz/* imports
                stdio: 'pipe'
            });
            // Clean up temp file
            unlinkSync(tempScriptPath);
            // Parse the JSON result
            logger.debug('Genome loader raw output', { output: result.trim() });
            const parsedGenome = JSON.parse(result.trim());
            const genome = parsedGenome && typeof parsedGenome === 'object' && 'default' in parsedGenome
                ? parsedGenome.default
                : parsedGenome;
            logger.info('✅ TypeScript genome executed successfully');
            return genome;
        }
        catch (execError) {
            // Clean up temp file even on error
            try {
                unlinkSync(tempScriptPath);
            }
            catch { }
            throw execError;
        }
    }
    catch (error) {
        logger.error(`❌ Failed to execute TypeScript genome: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}
/**
 * Handle V2 genome using Composition Engine
 */
async function handleV2Genome(genome, genomePath, options, logger) {
    try {
        logger.info('🚀 Processing V2 genome with Composition Engine', {
            marketplaces: Object.keys(genome.marketplaces).length,
            packages: Object.keys(genome.packages).length,
            apps: Object.keys(genome.apps).length
        });
        // Load marketplace adapters
        const marketplaceAdapters = new Map();
        for (const [marketplaceName, marketplaceConfig] of Object.entries(genome.marketplaces)) {
            let adapter;
            if (marketplaceConfig.type === 'local' && marketplaceConfig.path) {
                // Load local marketplace adapter
                // Resolve path relative to genome file location
                const genomeDir = dirname(genomePath);
                const marketplaceRoot = resolve(genomeDir, marketplaceConfig.path);
                // Try adapter/index.js
                const adapterPath = resolve(marketplaceRoot, 'adapter/index.js');
                logger.debug(`Loading marketplace adapter from: ${adapterPath}`);
                adapter = await loadMarketplaceAdapter(adapterPath, logger);
                // If that fails, try the marketplace root itself
                if (!adapter) {
                    logger.debug(`Trying marketplace root as adapter: ${marketplaceRoot}`);
                    adapter = await loadMarketplaceAdapter(resolve(marketplaceRoot, 'index.js'), logger);
                }
            }
            else {
                // Load default adapter for now (can be extended for npm/git marketplaces)
                logger.debug(`Loading default marketplace adapter for: ${marketplaceName}`);
                adapter = await loadDefaultMarketplaceAdapter(logger);
            }
            if (adapter) {
                marketplaceAdapters.set(marketplaceName, adapter);
            }
        }
        if (marketplaceAdapters.size === 0) {
            logger.error('❌ No marketplace adapters found');
            process.exit(1);
        }
        // Determine project root (will be set after project initialization)
        const projectRoot = process.cwd();
        // Create V2 genome handler
        const v2Handler = new V2GenomeHandler(marketplaceAdapters, logger, projectRoot);
        // Resolve genome to lock file
        logger.info('🔍 Resolving V2 genome...');
        const lockFile = await v2Handler.resolveGenome(genome, projectRoot, false);
        logger.info('✅ Genome resolved', {
            moduleCount: lockFile.modules.length,
            executionPlanLength: lockFile.executionPlan.length
        });
        // Convert lock file to ResolvedGenome format
        logger.info('🔄 Converting to execution format...');
        const resolvedGenome = await v2Handler.convertLockFileToResolvedGenome(lockFile, genome);
        // Auto-generate project path if missing
        if (!resolvedGenome.project.path) {
            resolvedGenome.project.path = `./${resolvedGenome.project.name || 'my-app'}`;
        }
        // Add UI framework parameter if provided
        if (options.uiFramework) {
            if (!resolvedGenome.options) {
                resolvedGenome.options = {};
            }
            resolvedGenome.options.uiFramework = options.uiFramework;
        }
        // Initialize enhanced logger
        const enhancedLogger = new EnhancedLogger({
            verbose: options.verbose || false,
            quiet: options.quiet || false
        });
        if (options.dryRun) {
            enhancedLogger.info('Dry run mode - showing what would be created:');
            showDryRunPreview(resolvedGenome, logger);
            return;
        }
        // Initialize project manager and orchestrator
        const projectManager = new ProjectManager(resolvedGenome.project);
        const orchestrator = new OrchestratorAgent(projectManager);
        // Get first marketplace adapter for options (for backward compatibility)
        const firstAdapter = Array.from(marketplaceAdapters.values())[0];
        const marketplaceInfo = {
            name: Object.keys(genome.marketplaces)[0] || 'core'
        };
        // Execute the genome with enhanced logging
        const result = await orchestrator.executeRecipe(resolvedGenome, options.verbose, enhancedLogger, {
            marketplaceAdapter: firstAdapter,
            marketplaceInfo,
            pathOverrides: undefined
        });
        if (result.success) {
            enhancedLogger.success('Project created successfully!');
            enhancedLogger.logNextSteps(resolvedGenome.project.path || './', resolvedGenome.project.name);
            if (result.warnings && result.warnings.length > 0) {
                enhancedLogger.warn('Warnings:');
                result.warnings.forEach((warning) => enhancedLogger.warn(`  - ${warning}`));
            }
        }
        else {
            enhancedLogger.error('Project creation failed:');
            if (result.errors) {
                result.errors.forEach((error) => enhancedLogger.error(`  - ${error}`));
            }
            process.exit(1);
        }
    }
    catch (error) {
        const criticalErrorResult = ErrorHandler.handleCriticalError(error, 'new-command', 'v2_genome_processing', options.verbose);
        logger.error(`💥 ${ErrorHandler.formatUserError(criticalErrorResult, options.verbose)}`);
        process.exit(1);
    }
}
/**
 * Extract category from module ID (e.g., 'adapters/framework/nextjs' -> 'adapters')
 * Helper function to infer category when not explicitly provided
 */
function extractCategoryFromModuleId(moduleId) {
    const parts = moduleId.split('/');
    const category = parts[0] || 'unknown';
    // Normalize some categories
    if (category === 'integrations') {
        return 'integration';
    }
    return category;
}
/**
 * Validate recipe structure
 * Only validates critical fields required for execution
 */
function validateRecipe(recipe) {
    const errors = [];
    if (!recipe) {
        errors.push('Recipe is null or undefined');
        return { valid: false, errors };
    }
    if (!recipe.project) {
        errors.push('Recipe must have a project section');
    }
    else {
        if (!recipe.project.name) {
            errors.push('Project must have a name');
        }
        // Auto-generate path if missing (not a critical error)
        if (!recipe.project.path) {
            recipe.project.path = `./${recipe.project.name || 'my-app'}`;
        }
    }
    if (!recipe.modules || !Array.isArray(recipe.modules)) {
        errors.push('Recipe must have a modules array');
    }
    else if (recipe.modules.length === 0) {
        errors.push('Recipe must have at least one module');
    }
    else {
        recipe.modules.forEach((module, index) => {
            // Only validate critical fields
            if (!module.id) {
                errors.push(`Module ${index} must have an id`);
            }
            // Category and version are optional - can be inferred or have defaults
            // Parameters are also optional (defaults to empty object)
            if (module.parameters === undefined) {
                module.parameters = {};
            }
        });
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Show dry run preview
 */
function showDryRunPreview(genome, logger) {
    logger.info(`📋 Project: ${genome.project.name}`);
    logger.info(`📁 Path: ${genome.project.path}`);
    logger.info(`🔧 Modules to be executed:`);
    genome.modules.forEach((module, index) => {
        logger.info(`  ${index + 1}. ${module.id}`);
        if (module.parameters && Object.keys(module.parameters).length > 0) {
            logger.info(`     Parameters: ${JSON.stringify(module.parameters)}`);
        }
    });
    if (genome.options?.skipInstall) {
        logger.info(`📦 Dependencies: Will be skipped (skipInstall: true)`);
    }
    else {
        logger.info(`📦 Dependencies: Will be installed automatically`);
    }
}
/**
 * Show list of available genomes
 */
async function showGenomeList(logger) {
    logger.info('📚 Available Genomes:\n');
    logger.info('🧬 Available genomes:\n');
    logger.info('  • hello-world');
    logger.info('  • saas-starter');
    logger.info('  • ai-chat');
    logger.info('  • blog');
    logger.info('\nUse --genome to select one of these.');
}
/**
 * Interactive genome picker
 */
async function promptForGenome(logger) {
    logger.info('🎯 Choose a genome for your project:\n');
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'genome',
            message: 'Select a genome:',
            choices: [
                {
                    name: '🟢 Hello World - Minimal Next.js starter (60 seconds)',
                    value: 'hello-world',
                    short: 'hello-world'
                },
                {
                    name: '🟡 SaaS Starter - Full-featured SaaS platform (10 minutes)',
                    value: 'saas-starter',
                    short: 'saas-starter'
                },
                {
                    name: '🟡 Blog - Modern blog with CMS (5 minutes)',
                    value: 'blog',
                    short: 'blog'
                },
                {
                    name: '🟡 AI App - AI-powered application (8 minutes)',
                    value: 'ai-app',
                    short: 'ai-app'
                },
                {
                    name: '🔴 Web3 DApp - Blockchain application (12 minutes)',
                    value: 'web3',
                    short: 'web3'
                },
                {
                    name: '🔴 Ultimate Showcase - Everything enabled (15 minutes)',
                    value: 'showcase',
                    short: 'showcase'
                },
                {
                    name: '📁 Use custom genome file path...',
                    value: '__custom__',
                    short: 'custom'
                }
            ]
        },
        {
            type: 'input',
            name: 'customPath',
            message: 'Enter path to custom genome file:',
            when: (answers) => answers.genome === '__custom__',
            validate: (input) => input.length > 0 || 'Path cannot be empty'
        }
    ]);
    return answers.customPath || answers.genome;
}
//# sourceMappingURL=new.js.map