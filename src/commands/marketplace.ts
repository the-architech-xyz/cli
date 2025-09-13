/**
 * Marketplace Command - V2 Feature Discovery
 * 
 * Explore and manage the marketplace of features
 * Usage: architech marketplace [search|featured|categories|install|publish]
 */

import { Command } from 'commander';
import { MarketplaceManager } from '../core/services/marketplace/marketplace-manager.js';
import { AgentLogger } from '../core/cli/logger.js';

const logger = new AgentLogger();

export function createMarketplaceCommand(): Command {
  const command = new Command('marketplace');
  
  command
    .description('Explore and manage the marketplace of features')
    .alias('mp');

  // Search subcommand
  command
    .command('search <query>')
    .description('Search for features in the marketplace')
    .option('-c, --category <category>', 'Filter by category')
    .option('--limit <number>', 'Limit number of results', '10')
    .action(async (query: string, options: any) => {
      try {
        const marketplace = new MarketplaceManager();
        const results = await marketplace.searchFeatures(query, options.category);
        
        logger.info(`🔍 Found ${results.total} results for "${query}"`);
        
        results.items.slice(0, parseInt(options.limit)).forEach((item, index) => {
          logger.info(`\n${index + 1}. ${item.name}`);
          logger.info(`   📝 ${item.description}`);
          logger.info(`   👤 ${item.author} • ⭐ ${item.rating} • 📥 ${item.downloads} downloads`);
          logger.info(`   🏷️  ${item.tags.join(', ')}`);
          logger.info(`   💰 ${item.price === 'free' ? 'Free' : `$${item.price}`}`);
        });
        
      } catch (error) {
        logger.error(`❌ Error searching marketplace: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Featured subcommand
  command
    .command('featured')
    .description('Show featured marketplace items')
    .action(async () => {
      try {
        const marketplace = new MarketplaceManager();
        const featured = await marketplace.getFeaturedItems();
        
        logger.info('🌟 Featured Marketplace Items');
        
        featured.forEach((item, index) => {
          logger.info(`\n${index + 1}. ${item.name}`);
          logger.info(`   📝 ${item.description}`);
          logger.info(`   👤 ${item.author} • ⭐ ${item.rating} • 📥 ${item.downloads} downloads`);
          logger.info(`   🏷️  ${item.tags.join(', ')}`);
        });
        
      } catch (error) {
        logger.error(`❌ Error fetching featured items: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Categories subcommand
  command
    .command('categories')
    .description('List marketplace categories')
    .action(async () => {
      try {
        const marketplace = new MarketplaceManager();
        const categories = await marketplace.getCategories();
        
        logger.info('📂 Marketplace Categories');
        
        categories.forEach((category) => {
          logger.info(`\n${category.name}`);
          logger.info(`   📝 ${category.description}`);
          logger.info(`   📊 ${category.count} items`);
        });
        
      } catch (error) {
        logger.error(`❌ Error fetching categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Install subcommand
  command
    .command('install <featureId>')
    .description('Install a feature from the marketplace')
    .option('--version <version>', 'Specific version to install')
    .option('--force', 'Force installation even if conflicts exist')
    .action(async (featureId: string, options: any) => {
      try {
        const marketplace = new MarketplaceManager();
        const success = await marketplace.installFeature(featureId, {
          version: options.version,
          force: options.force
        });
        
        if (success) {
          logger.success(`✅ Feature ${featureId} installed successfully!`);
        } else {
          logger.error(`❌ Failed to install feature ${featureId}`);
          process.exit(1);
        }
        
      } catch (error) {
        logger.error(`❌ Error installing feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Publish subcommand
  command
    .command('publish <featurePath>')
    .description('Publish a feature to the marketplace')
    .option('--public', 'Make the feature publicly available')
    .option('-c, --category <category>', 'Feature category')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (featurePath: string, options: any) => {
      try {
        const marketplace = new MarketplaceManager();
        const success = await marketplace.publishFeature(featurePath, {
          public: options.public,
          category: options.category,
          tags: options.tags ? options.tags.split(',') : []
        });
        
        if (success) {
          logger.success(`✅ Feature published successfully!`);
        } else {
          logger.error(`❌ Failed to publish feature`);
          process.exit(1);
        }
        
      } catch (error) {
        logger.error(`❌ Error publishing feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return command;
}
