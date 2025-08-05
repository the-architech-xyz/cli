/**
 * Scale Command - Transform Single App to Monorepo
 * 
 * Transforms a single app project to a scalable monorepo structure.
 * This is the "killer feature" that allows users to scale their projects seamlessly.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { structureService } from '../core/project/structure-service.js';
import { ContextFactory } from '../core/project/context-factory.js';
import { Logger } from '../types/agents.js';

interface ScaleOptions {
  packageManager?: string;
  yes?: boolean;
}

export async function scaleCommand(options: ScaleOptions = {}): Promise<void> {
  const logger: Logger = {
    info: (message: string) => console.log(`ℹ️  ${message}`),
    success: (message: string) => console.log(`✅ ${message}`),
    warn: (message: string) => console.log(`⚠️  ${message}`),
    error: (message: string, error?: Error) => {
      console.error(`❌ ${message}`);
      if (error) {
        console.error(error);
      }
    },
    debug: (message: string) => {
      if (options.yes) {
        console.log(`🔍 ${message}`);
      }
    },
    log: (level: any, message: string, context?: any) => {
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
    }
  };

  try {
    const projectPath = process.cwd();
    
    logger.info('🔍 Analyzing current project structure...');
    
    // Detect current structure
    const currentStructure = await structureService.detectStructure(projectPath);
    
    if (currentStructure.isMonorepo) {
      logger.error('This project is already a monorepo. No transformation needed.');
      return;
    }
    
    logger.info(`Current structure: ${structureService.getStructureDescription(currentStructure)}`);
    
    // Confirm transformation
    if (!options.yes) {
      console.log(chalk.yellow('\n🚀 Ready to scale your project?'));
      console.log(chalk.gray('This will transform your single app into a scalable monorepo structure.'));
      console.log(chalk.gray('Your existing code will be preserved and reorganized.'));
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with transformation?',
          default: true
        }
      ]);
      
      if (!confirm) {
        logger.info('Transformation cancelled.');
        return;
      }
    }
    
    logger.info('🔄 Starting transformation to monorepo structure...');
    
    // Transform the project
    await structureService.transformToMonorepo(projectPath);
    
    logger.success('🎉 Project successfully transformed to monorepo structure!');
    
    // Display next steps
    console.log(chalk.blue('\n📋 Next Steps:'));
    console.log(chalk.gray('1. Review the new structure in apps/web/ and packages/'));
    console.log(chalk.gray('2. Update any import paths that may have changed'));
    console.log(chalk.gray('3. Run "npm install" to install dependencies'));
    console.log(chalk.gray('4. Run "npm run dev" to start development'));
    
    console.log(chalk.blue('\n🏗️  New Structure:'));
    console.log(chalk.gray('apps/web/     - Your main Next.js application'));
    console.log(chalk.gray('packages/ui/  - Shared UI components'));
    console.log(chalk.gray('packages/db/  - Database schemas and utilities'));
    console.log(chalk.gray('packages/auth/ - Authentication logic'));
    
    logger.success('Your project is now ready for scale! 🚀');
    
  } catch (error) {
    logger.error('Failed to scale project', error as Error);
    process.exit(1);
  }
} 