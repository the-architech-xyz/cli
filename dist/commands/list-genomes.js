/**
 * List Genomes Command
 *
 * Lists all available project genome templates
 * Usage: architech list-genomes
 */
import { Command } from 'commander';
import { AgentLogger as Logger } from '../core/cli/logger.js';
import { GenomeResolverFactory } from '../core/services/genome-resolution/index.js';
import { MarketplaceRegistry } from '../core/services/marketplace/marketplace-registry.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export function createListGenomesCommand() {
    const command = new Command('list-genomes');
    command
        .description('List all available project genome templates')
        .option('-c, --category <category>', 'Filter by category')
        .option('-l, --complexity <complexity>', 'Filter by complexity (simple, intermediate, advanced)')
        .option('-s, --search <query>', 'Search genomes by name or description')
        .option('-v, --verbose', 'Show detailed information', false)
        .action(async (options) => {
        const logger = new Logger(options.verbose);
        try {
            logger.info('🧬 Available Project Genomes\n');
            // Use new resolver to list TypeScript genomes
            const resolver = GenomeResolverFactory.createDefault();
            // Try to list from local marketplace
            let genomes = await listLocalMarketplaceGenomes(logger, options.verbose || false);
            // Apply filters
            if (options.category) {
                genomes = genomes.filter(genome => genome.category === options.category);
            }
            if (options.complexity) {
                genomes = genomes.filter(genome => genome.complexity === options.complexity);
            }
            if (options.search) {
                const searchLower = options.search.toLowerCase();
                genomes = genomes.filter((g) => g.id.toLowerCase().includes(searchLower) ||
                    g.description.toLowerCase().includes(searchLower) ||
                    g.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
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
                acc[genome.category].push(genome);
                return acc;
            }, {});
            // Display genomes
            Object.entries(groupedGenomes).forEach(([category, categoryGenomes]) => {
                logger.info(`📁 ${category.toUpperCase()}`);
                categoryGenomes.forEach((genome) => {
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
        }
        catch (error) {
            logger.error('❌ Failed to list genomes:', error);
            process.exit(1);
        }
    });
    return command;
}
/**
 * Get complexity icon
 */
function getComplexityIcon(complexity) {
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
/**
 * List genomes from local marketplace (TypeScript .genome.ts files)
 */
async function listLocalMarketplaceGenomes(logger, verbose) {
    try {
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
        const genomesDir = path.join(marketplaceRoot, 'genomes', 'official');
        const files = await fs.readdir(genomesDir);
        const genomeFiles = files.filter(f => f.endsWith('.genome.ts'));
        const genomes = [];
        for (const file of genomeFiles) {
            const genomePath = path.join(genomesDir, file);
            const content = await fs.readFile(genomePath, 'utf-8');
            // Extract metadata from file
            const id = file.replace('.genome.ts', '').replace(/^\d+-/, '');
            const descMatch = content.match(/\* \n \* (.+)/);
            const useCaseMatch = content.match(/\* Use Case: (.+)/);
            const stackMatch = content.match(/\* Stack: (.+)/);
            // Count modules
            const moduleMatches = content.match(/\{\s*\n?\s*id:/g);
            const moduleCount = moduleMatches?.length || 0;
            // Determine complexity
            let complexity = 'simple';
            if (moduleCount > 8)
                complexity = 'advanced';
            else if (moduleCount > 3)
                complexity = 'intermediate';
            // Determine category from use case
            let category = 'web';
            if (useCaseMatch?.[1]?.includes('SaaS'))
                category = 'saas';
            if (useCaseMatch?.[1]?.includes('blog'))
                category = 'content';
            if (useCaseMatch?.[1]?.includes('AI'))
                category = 'ai';
            if (useCaseMatch?.[1]?.includes('Web3') || useCaseMatch?.[1]?.includes('blockchain'))
                category = 'blockchain';
            genomes.push({
                id,
                file,
                description: descMatch?.[1] || 'No description',
                category,
                tags: [category],
                modules: moduleCount,
                complexity,
                stack: stackMatch?.[1] || ''
            });
        }
        return genomes;
    }
    catch (error) {
        logger.warn(`Could not load local marketplace genomes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return [];
    }
}
/**
 * Parse feature specification (future use)
 */
function parseFeatureSpec(featureArg) {
    // For future add command
    return null;
}
//# sourceMappingURL=list-genomes.js.map