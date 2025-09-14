/**
 * List Genomes Command
 * 
 * Lists all available project genome templates
 * Usage: architech list-genomes
 */

import { Command } from 'commander';
import { GenomeRegistry } from '../core/services/module-management/genome/genome-registry.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';

export function createListGenomesCommand(): Command {
  const command = new Command('list-genomes');
  
  command
    .description('List all available project genome templates')
    .option('-c, --category <category>', 'Filter by category')
    .option('-l, --complexity <complexity>', 'Filter by complexity (simple, intermediate, advanced)')
    .option('-s, --search <query>', 'Search genomes by name or description')
    .option('-v, --verbose', 'Show detailed information', false)
    .action(async (options: { category?: string; complexity?: string; search?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);
      
      try {
        logger.info('🧬 Available Project Genomes\n');
        
        const genomeRegistry = new GenomeRegistry();
        let genomes = genomeRegistry.getAllGenomes();
        
        // Apply filters
        if (options.category) {
          genomes = genomes.filter(genome => genome.category === options.category);
        }
        
        if (options.complexity) {
          genomes = genomes.filter(genome => genome.complexity === options.complexity);
        }
        
        if (options.search) {
          genomes = genomeRegistry.searchGenomes(options.search);
        }
        
        if (genomes.length === 0) {
          logger.info('No genomes found matching your criteria.');
          return;
        }
        
        // Group by category
        const groupedGenomes = genomes.reduce((acc, genome) => {
          if (!acc[genome.category]) {
            acc[genome.category] = [];
          }
          acc[genome.category]!.push(genome);
          return acc;
        }, {} as Record<string, typeof genomes>);
        
        // Display genomes
        Object.entries(groupedGenomes).forEach(([category, categoryGenomes]) => {
          logger.info(`📁 ${category.toUpperCase()}`);
          
          categoryGenomes.forEach(genome => {
            const complexityIcon = getComplexityIcon(genome.complexity);
            const modulesText = `${genome.modules} module${genome.modules !== 1 ? 's' : ''}`;
            
            logger.info(`  ${complexityIcon} ${genome.id}`);
            logger.info(`     ${genome.description}`);
            logger.info(`     Modules: ${modulesText} | Tags: ${genome.tags.join(', ')}`);
            
            if (options.verbose) {
              logger.info(`     File: ${genome.file}`);
            }
            
            logger.info('');
          });
        });
        
        // Show usage examples
        logger.info('💡 Usage Examples:');
        logger.info('  architech new --genome saas-boilerplate --name my-saas');
        logger.info('  architech new --genome blog-pro --name my-blog');
        logger.info('  architech new --genome marketplace --name my-marketplace');
        logger.info('  architech new --genome dapp --name my-dapp\n');
        
        // Show filter examples
        if (!options.category && !options.complexity && !options.search) {
          logger.info('🔍 Filter Examples:');
          logger.info('  architech list-genomes --category saas');
          logger.info('  architech list-genomes --complexity simple');
          logger.info('  architech list-genomes --search payment\n');
        }
        
      } catch (error) {
        logger.error('❌ Failed to list genomes:', error as Error);
        process.exit(1);
      }
    });
  
  return command;
}

/**
 * Get complexity icon
 */
function getComplexityIcon(complexity: string): string {
  switch (complexity) {
    case 'simple':
      return '🟢';
    case 'intermediate':
      return '🟡';
    case 'advanced':
      return '🔴';
    default:
      return '⚪';
  }
}
