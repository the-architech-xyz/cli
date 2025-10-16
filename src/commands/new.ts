/**
 * New Command
 * 
 * Creates a new project from a TypeScript genome file
 * Usage: architech new <genome-file.ts>
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { Genome } from '@thearchitech.xyz/types';
import { OrchestratorAgent } from '../agents/orchestrator-agent.js';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';
import { EnhancedLogger } from '../core/cli/enhanced-logger.js';
import { GenomeValidator } from '../core/services/validation/genome-validator.js';
import { ModuleService } from '../core/services/module-management/module-service.js';
import { CacheManagerService } from '../core/services/infrastructure/cache/cache-manager.js';
import { ErrorHandler } from '../core/services/infrastructure/error/index.js';
import { GenomeResolverFactory } from '../core/services/genome-resolution/index.js';

export function createNewCommand(): Command {
  const command = new Command('new');
  
  command
    .description('Create a new project from a genome')
    .argument('[project-name]', 'Project name (optional, for interactive mode)')
    .option('-g, --genome <genome>', 'Genome name or path to .genome.ts file')
    .option('-l, --list', 'List available genomes before choosing', false)
    .option('-d, --dry-run', 'Show what would be created without executing', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-q, --quiet', 'Suppress all output except errors', false)
    .action(async (projectName: string | undefined, options: { 
      genome?: string;
      list?: boolean;
      dryRun?: boolean; 
      verbose?: boolean; 
      quiet?: boolean;
    }) => {
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
        const resolved = await resolver.resolve(genomeInput, { 
          verbose: options.verbose 
        });

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
        } catch (error) {
          logger.error(`❌ Genome file not found: ${genomePath}`);
          process.exit(1);
        }
        
        // Execute the TypeScript genome file with tsx
        logger.info('🔧 Executing TypeScript genome...');
        const genome = await executeTypeScriptGenome(genomePath, logger);
        
        if (!genome) {
          logger.error('❌ Failed to execute genome file');
          process.exit(1);
        }
        
        // Convert Genome to proper format
        const validatedGenome = convertGenomeToRecipe(genome);
        
        // Validate genome structure
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
            result.warnings.forEach((warning: string) => enhancedLogger.warn(`  - ${warning}`));
          }
        } else {
          enhancedLogger.error('Project creation failed:');
          if (result.errors) {
            result.errors.forEach((error: string) => enhancedLogger.error(`  - ${error}`));
          }
          process.exit(1);
        }
        
      } catch (error) {
        const criticalErrorResult = ErrorHandler.handleCriticalError(
          error,
          'new-command',
          'project_creation',
          options.verbose
        );
        logger.error(`💥 ${ErrorHandler.formatUserError(criticalErrorResult, options.verbose)}`);
        process.exit(1);
      }
    });
  
  return command;
}

/**
 * Execute a TypeScript genome file and return the Genome object
 */
async function executeTypeScriptGenome(genomePath: string, logger: Logger): Promise<any> {
  try {
    // Read the genome file
    const genomeCode = readFileSync(genomePath, 'utf-8');
    
    // Create a wrapper that exports the genome
    const wrapperCode = `
      ${genomeCode}
      
      // Export the genome if it's the default export
      if (typeof genome !== 'undefined') {
        console.log(JSON.stringify(genome));
      } else if (typeof module !== 'undefined' && module.exports && module.exports.default) {
        console.log(JSON.stringify(module.exports.default));
      } else {
        throw new Error('No genome found. Please export a Genome object as default or named export "genome"');
      }
    `;
    
    // Execute with tsx
    // Escape double quotes and backslashes to prevent shell interpretation issues
    const escapedWrapperCode = wrapperCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const result = execSync(`tsx -e "${escapedWrapperCode}"`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    // Parse the JSON result
    const genome = JSON.parse(result.trim());
    logger.info('✅ TypeScript genome executed successfully');
    
    return genome;
  } catch (error) {
    logger.error(`❌ Failed to execute TypeScript genome: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Convert Genome object to Recipe format
 */
function convertGenomeToRecipe(genome: any): Genome {
  // Ensure the genome has the required structure
  if (!genome.project || !genome.modules) {
    throw new Error('Invalid genome structure: missing project or modules');
  }
  
  // Convert modules to the expected format
  const modules = genome.modules.map((module: any) => ({
    id: module.id,
    category: module.category || extractCategoryFromId(module.id),
    version: module.version || 'latest',
    parameters: module.parameters || module.params || {},
    features: module.features || {}
  }));
  
  return {
    version: genome.version || '1.0',
    project: {
      name: genome.project.name,
      framework: genome.project.framework || 'nextjs',
      description: genome.project.description || '',
      path: genome.project.path || `./${genome.project.name}`,
      version: genome.project.version || '1.0.0'
    },
    modules,
    options: genome.options || {}
  };
}

/**
 * Extract category from module ID (e.g., 'framework/nextjs' -> 'framework')
 * Special case: 'integrations/xyz' -> 'integration' (singular to match integration.json)
 */
function extractCategoryFromId(moduleId: string): string {
  const parts = moduleId.split('/');
  const category = parts[0] || 'unknown';
  
  // Normalize integrations (plural) to integration (singular) to match integration.json
  if (category === 'integrations') {
    return 'integration';
  }
  
  return category;
}

/**
 * Validate recipe structure
 */
function validateRecipe(recipe: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!recipe) {
    errors.push('Recipe is null or undefined');
    return { valid: false, errors };
  }
  
  if (!recipe.project) {
    errors.push('Recipe must have a project section');
  } else {
    if (!recipe.project.name) {
      errors.push('Project must have a name');
    }
    if (!recipe.project.path) {
      errors.push('Project must have a path');
    }
  }
  
  if (!recipe.modules || !Array.isArray(recipe.modules)) {
    errors.push('Recipe must have a modules array');
  } else {
    recipe.modules.forEach((module: any, index: number) => {
      if (!module.id) {
        errors.push(`Module ${index} must have an id`);
      }
      if (!module.category) {
        errors.push(`Module ${index} must have a category`);
      }
      if (!module.version) {
        errors.push(`Module ${index} must have a version`);
      }
      if (!module.parameters) {
        errors.push(`Module ${index} must have parameters`);
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
function showDryRunPreview(genome: Genome, logger: Logger): void {
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
  } else {
    logger.info(`📦 Dependencies: Will be installed automatically`);
  }
}

/**
 * Show list of available genomes
 */
async function showGenomeList(logger: Logger): Promise<void> {
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
async function promptForGenome(logger: Logger): Promise<string> {
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
