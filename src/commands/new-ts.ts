/**
 * New TypeScript Command
 * 
 * Creates a new project from a TypeScript genome file
 * Usage: architech new-ts <genome-file.ts>
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import { Recipe } from '@thearchitech.xyz/types';
import { OrchestratorAgent } from '../agents/orchestrator-agent.js';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';
import { GenomeValidator } from '../core/services/validation/genome-validator.js';
import { ModuleService } from '../core/services/module-management/module-service.js';
import { CacheManagerService } from '../core/services/infrastructure/cache/cache-manager.js';
import { ErrorHandler } from '../core/services/infrastructure/error/index.js';

export function createNewTsCommand(): Command {
  const command = new Command('new-ts');
  
  command
    .description('Create a new project from a TypeScript genome file')
    .argument('<genome-file>', 'Path to .genome.ts file')
    .option('-d, --dry-run', 'Show what would be created without executing', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-q, --quiet', 'Suppress all output except errors', false)
    .action(async (genomeFile: string, options: { dryRun?: boolean; verbose?: boolean; quiet?: boolean }) => {
      const logger = new Logger(options.verbose);
      
      try {
        logger.info(`🚀 Creating new project from TypeScript genome: ${genomeFile}`);
        
        // Resolve the genome file path
        const genomePath = resolve(process.cwd(), genomeFile);
        
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
        
        // Convert Genome to Recipe format
        const recipe = convertGenomeToRecipe(genome);
        
        // Validate recipe structure
        const validation = validateRecipe(recipe);
        if (!validation.valid) {
          logger.error('❌ Invalid genome structure:');
          validation.errors.forEach(error => logger.error(`  - ${error}`));
          process.exit(1);
        }

        // PHASE 1: Pre-execution genome validation
        logger.info('🔍 Validating genome before execution...');
        const moduleService = new ModuleService(new CacheManagerService());
        const genomeValidator = new GenomeValidator(moduleService);
        
        const genomeValidation = await genomeValidator.validateGenome(genome);
        if (!genomeValidation.valid) {
          logger.error('❌ Genome validation failed:');
          genomeValidation.errors.forEach(error => logger.error(`  - ${error}`));
          process.exit(1);
        }
        
        if (genomeValidation.warnings.length > 0) {
          logger.warn('⚠️ Genome validation warnings:');
          genomeValidation.warnings.forEach(warning => logger.warn(`  - ${warning}`));
        }
        
        logger.info(`✅ Genome validation completed successfully`);
        logger.info(`  📋 Validated modules: ${genomeValidation.validatedModules.length}`);
        logger.info(`  🔄 Execution order: ${genomeValidation.executionOrder.map(m => m.id).join(' → ')}`);
        
        logger.info(`📋 Genome: ${recipe.project.name}`);
        logger.info(`📁 Project path: ${recipe.project.path}`);
        logger.info(`🔧 Modules: ${recipe.modules.length}`);
        
        if (options.dryRun) {
          logger.info('🔍 Dry run mode - showing what would be created:');
          showDryRunPreview(recipe, logger);
          return;
        }
        
        // Initialize project manager and orchestrator
        const projectManager = new ProjectManager(recipe.project);
        const orchestrator = new OrchestratorAgent(projectManager);
        
        // Execute the recipe
        logger.info('🎯 Starting project creation...');
        const result = await orchestrator.executeRecipe(recipe, options.verbose);
        
        if (result.success) {
          logger.success(`🎉 Project created successfully!`);
          logger.info(`✅ ${result.modulesExecuted} modules executed`);
          
          if (result.warnings && result.warnings.length > 0) {
            logger.warn('⚠️ Warnings:');
            result.warnings.forEach(warning => logger.warn(`  - ${warning}`));
          }
        } else {
          logger.error('💥 Project creation failed:');
          if (result.errors) {
            result.errors.forEach(error => logger.error(`  - ${error}`));
          }
          process.exit(1);
        }
        
      } catch (error) {
        const criticalErrorResult = ErrorHandler.handleCriticalError(
          error,
          'new-ts-command',
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
    const result = execSync(`tsx -e "${wrapperCode}"`, {
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
function convertGenomeToRecipe(genome: any): Recipe {
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
function showDryRunPreview(recipe: Recipe, logger: Logger): void {
  logger.info(`📋 Project: ${recipe.project.name}`);
  logger.info(`📁 Path: ${recipe.project.path}`);
  logger.info(`🔧 Modules to be executed:`);
  
  recipe.modules.forEach((module, index) => {
    logger.info(`  ${index + 1}. ${module.id} (${module.category}) - v${module.version}`);
    if (module.parameters && Object.keys(module.parameters).length > 0) {
      logger.info(`     Parameters: ${JSON.stringify(module.parameters)}`);
    }
  });
  
  if (recipe.options?.skipInstall) {
    logger.info(`📦 Dependencies: Will be skipped (skipInstall: true)`);
  } else {
    logger.info(`📦 Dependencies: Will be installed automatically`);
  }
}
