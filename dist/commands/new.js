/**
 * New Command
 *
 * Creates a new project from a TypeScript genome file
 * Usage: architech new <genome-file.ts>
 */
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { OrchestratorAgent } from '../agents/orchestrator-agent.js';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';
import { EnhancedLogger } from '../core/cli/enhanced-logger.js';
import { ErrorHandler } from '../core/services/infrastructure/error/index.js';
import { GenomeResolverFactory } from '../core/services/genome-resolution/index.js';
import { GenomeTransformationService } from '@thearchitech.xyz/genome-transformer';
import { MarketplaceRegistry } from '../core/services/marketplace/marketplace-registry.js';
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
            const resolver = GenomeResolverFactory.createDefault();
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
            // Transform genome (handles both capability-first and module-first genomes)
            logger.info('🔄 Transforming genome...');
            logger.debug('Genome snapshot before transformation', {
                hasModules: Array.isArray(rawGenome.modules),
                moduleCount: Array.isArray(rawGenome.modules) ? rawGenome.modules.length : 0,
                transformationMode: rawGenome.transformation?.mode || rawGenome.options?.transformation?.mode,
            });
            await configureMarketplaceOverrides(rawGenome, genomePath, logger);
            const marketplacePath = await MarketplaceRegistry.getCoreMarketplacePath();
            const { transformerOptions, mode: transformationMode } = resolveTransformationOptions(rawGenome, logger);
            const genomeTransformer = new GenomeTransformationService({
                marketplacePath,
                logger: {
                    info: (msg, meta) => logger.info(msg),
                    debug: (msg, meta) => logger.debug(msg),
                    warn: (msg, meta) => logger.warn(msg),
                    error: (msg, meta) => logger.error(msg),
                },
                options: transformerOptions,
            });
            const transformationResult = await genomeTransformer.transform(rawGenome);
            if (!transformationResult.success) {
                logger.error(`❌ Genome transformation failed: ${transformationResult.error}`);
                process.exit(1);
            }
            // Get the transformed genome (now guaranteed to have modules array)
            const validatedGenome = transformationResult.resolvedGenome;
            logger.info(`✅ Genome transformed: ${transformationResult.originalGenome.modules?.length || 0} → ${validatedGenome.modules.length} modules`, {
                steps: transformationResult.transformationSteps.length,
                duration: transformationResult.duration
            });
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
            // Initialize project manager and orchestrator
            const projectManager = new ProjectManager(validatedGenome.project);
            const orchestrator = new OrchestratorAgent(projectManager);
            // Execute the genome with enhanced logging
            const result = await orchestrator.executeRecipe(validatedGenome, options.verbose, enhancedLogger);
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
async function configureMarketplaceOverrides(rawGenome, genomePath, logger) {
    if (!rawGenome || typeof rawGenome !== 'object') {
        return;
    }
    const marketplaceConfig = rawGenome.marketplace || rawGenome.marketplaces;
    if (!marketplaceConfig || typeof marketplaceConfig !== 'object') {
        return;
    }
    const overrides = marketplaceConfig.overrides || marketplaceConfig;
    const baseDir = dirname(genomePath);
    if (overrides.core) {
        const coreOverridePath = resolve(baseDir, String(overrides.core));
        MarketplaceRegistry.setMarketplacePath('core', coreOverridePath);
        logger.info('🛒 Using custom core marketplace override', { corePath: coreOverridePath });
    }
    const uiOverrides = overrides.ui || marketplaceConfig.ui;
    if (uiOverrides && typeof uiOverrides === 'object') {
        for (const [uiName, relativePath] of Object.entries(uiOverrides)) {
            if (!relativePath)
                continue;
            const uiOverridePath = resolve(baseDir, String(relativePath));
            MarketplaceRegistry.setMarketplacePath(uiName, uiOverridePath);
            logger.info('🛒 Registered UI marketplace override', { uiName, path: uiOverridePath });
        }
    }
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
    const resolver = GenomeResolverFactory.createDefault();
    const genomes = await resolver.getAvailableGenomes();
    logger.info('🟢 Simple (Quick start, minimal setup):');
    logger.info('  • hello-world, minimal');
    logger.info('');
    logger.info('🟡 Intermediate (Common use cases):');
    logger.info('  • saas-starter, saas, full-saas');
    logger.info('  • blog, blog-starter');
    logger.info('  • ai-app, ai-chat, ai-powered');
    logger.info('');
    logger.info('🔴 Advanced (Full-featured):');
    logger.info('  • web3, dapp, blockchain');
    logger.info('  • showcase, ultimate, demo');
    logger.info('');
    logger.info('💡 Usage:');
    logger.info('  architech new --genome hello-world');
    logger.info('  architech new --genome saas-starter');
    logger.info('  architech new /path/to/custom.genome.ts\n');
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