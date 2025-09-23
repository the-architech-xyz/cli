/**
 * New Command
 * 
 * Creates a new project from a TypeScript genome file
 * Usage: architech new <genome-file.ts>
 */

import { Command } from 'commander';
import { join } from 'path';
import { Recipe } from '@thearchitech.xyz/types';
import { OrchestratorAgent } from '../agents/orchestrator-agent.js';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { PathService } from '../core/services/path/path-service.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';

export function createNewCommand(): Command {
  const command = new Command('new');
  
  command
    .description('Create a new project from a genome template or custom genome file')
    .argument('<template-or-file>', 'Template name (e.g., saas-app) or path to genome file (.ts)')
    .option('-d, --dry-run', 'Show what would be created without executing', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-q, --quiet', 'Suppress all output except errors', false)
    .action(async (templateOrFile: string, options: { dryRun?: boolean; verbose?: boolean; quiet?: boolean }) => {
      const logger = new Logger(options.verbose);
      
      try {
        let recipe: Recipe | null = null;
        let projectName = '';

        // Check if it's a template name or file path
        const fileExtension = templateOrFile.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'ts' || fileExtension === 'js') {
          // It's a file path
          logger.info(`🚀 Creating new project from genome file: ${templateOrFile}`);
          
          const genomePath = join(process.cwd(), templateOrFile);
          recipe = await loadTypeScriptGenome(genomePath);
          projectName = recipe?.project.name || 'my-project';
        } else {
          // It's a template name - load from marketplace
          logger.info(`🚀 Creating new project from template: ${templateOrFile}`);
          
          try {
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            const templatePath = require.resolve(`@thearchitech.xyz/marketplace/genomes/${templateOrFile}.genome.ts`);
            recipe = await loadTypeScriptGenome(templatePath);
            projectName = recipe?.project.name || templateOrFile;
          } catch (error) {
            logger.error(`❌ Template '${templateOrFile}' not found`);
            logger.info('💡 Available templates: architech list');
            logger.info('💡 Or use a custom genome file: architech new ./my-genome.ts');
            process.exit(1);
          }
        }
        
        if (!recipe) {
          logger.error('❌ Failed to load genome template or file');
          logger.info('💡 Make sure your genome file exports a valid Genome object');
          process.exit(1);
        }
        
        // Validate recipe structure
        const validation = validateRecipe(recipe);
        if (!validation.valid) {
          logger.error('❌ Invalid recipe structure:');
          validation.errors.forEach(error => logger.error(`  - ${error}`));
          process.exit(1);
        }
        
        logger.info(`📋 Recipe: ${recipe.project.name}`);
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
        
        // Initialize orchestrator (this will clone marketplace and load integrations)
        await orchestrator.initialize();
        
        // Execute the recipe
        logger.info('🎯 Starting project creation...');
        const result = await orchestrator.executeRecipe(recipe);
        
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`💥 Failed to create project: ${errorMessage}`);
        process.exit(1);
      }
    });
  
  return command;
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

/**
 * Load a TypeScript genome file and execute it to get the Recipe
 */
export async function loadTypeScriptGenome(filePath: string): Promise<Recipe | null> {
  try {
    const { execSync } = await import('child_process');
    
    // Use tsx to execute the TypeScript file and capture the output
    const result = execSync(`npx tsx -e "
      const genome = require('${filePath.replace(/\\/g, '\\\\')}');
      console.log(JSON.stringify(genome.default || genome, null, 2));
    "`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    // Parse the JSON output
    const genome = JSON.parse(result.trim());
    
    // Transform Genome to Recipe format
    const recipe: Recipe = {
      version: genome.version,
      project: genome.project,
      modules: genome.modules.map((module: any) => ({
        id: module.id,
        category: module.id.split('/')[0], // Extract category from id
        version: '1.0.0', // Default version for now
        parameters: module.parameters || {},
        features: module.features || {}
      }))
    };
    
    return recipe;
  } catch (error) {
    console.error('Failed to load TypeScript genome:', error);
    return null;
  }
} 
