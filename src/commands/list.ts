import { Command } from 'commander';
import { createRequire } from 'module';
import { AgentLogger as Logger } from '../core/cli/logger.js';

interface GenomeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  modules: number;
  file: string;
}

interface GenomeManifest {
  genomes: GenomeTemplate[];
  totalGenomes: number;
  lastUpdated: string;
}

export function createListCommand(): Command {
  const command = new Command('list');

  command
    .description('List available genome templates from the marketplace')
    .option('-c, --category <category>', 'Filter by category (saas, ecommerce, content, full-stack)')
    .option('-l, --complexity <level>', 'Filter by complexity (beginner, intermediate, advanced)')
    .option('-t, --tag <tag>', 'Filter by tag')
    .option('-v, --verbose', 'Show detailed information', false)
    .action(async (options: { category?: string; complexity?: string; tag?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info('🔍 Fetching available genome templates...');

        // Load genome manifest from marketplace
        const require = createRequire(import.meta.url);
        const manifestPath = require.resolve('@thearchitech.xyz/marketplace/genomes');
        const manifest: GenomeManifest = JSON.parse(require('fs').readFileSync(manifestPath, 'utf-8'));

        logger.info(`📦 Found ${manifest.totalGenomes} genome templates`);

        // Filter genomes based on options
        let filteredGenomes = manifest.genomes;

        if (options.category) {
          filteredGenomes = filteredGenomes.filter(genome => 
            genome.category.toLowerCase() === options.category!.toLowerCase()
          );
        }

        if (options.complexity) {
          filteredGenomes = filteredGenomes.filter(genome => 
            genome.complexity === options.complexity
          );
        }

        if (options.tag) {
          filteredGenomes = filteredGenomes.filter(genome => 
            genome.tags.some(tag => tag.toLowerCase().includes(options.tag!.toLowerCase()))
          );
        }

        if (filteredGenomes.length === 0) {
          logger.warn('⚠️ No genome templates found matching your criteria');
          return;
        }

        // Display results
        logger.info(`\n📋 Available Genome Templates (${filteredGenomes.length}):`);
        logger.info('');

        filteredGenomes.forEach((genome, index) => {
          const complexityEmoji = {
            beginner: '🟢',
            intermediate: '🟡', 
            advanced: '🔴'
          }[genome.complexity];

          logger.info(`${index + 1}. ${genome.name} ${complexityEmoji}`);
          logger.info(`   📝 ${genome.description}`);
          logger.info(`   🏷️  Category: ${genome.category} | Modules: ${genome.modules} | Tags: ${genome.tags.join(', ')}`);
          
          if (options.verbose) {
            logger.info(`   📁 File: ${genome.file}`);
            logger.info(`   🆔 ID: ${genome.id}`);
          }
          
          logger.info('');
        });

        logger.info('💡 Usage:');
        logger.info('   architech new <template-name>     # Create from template');
        logger.info('   architech new <custom.genome.ts>  # Create from custom genome');
        logger.info('   architech analyze <genome>        # Analyze genome structure');

      } catch (error) {
        logger.error('❌ Failed to fetch genome templates:', error as Error);
        logger.info('💡 Make sure @thearchitech.xyz/marketplace is installed');
        process.exit(1);
      }
    });

  return command;
}
