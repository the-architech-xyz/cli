import { Command } from 'commander';
import { join } from 'path';
// Define Genome type locally for now
interface Genome {
  project: {
    name: string;
    description?: string;
    version?: string;
    author?: string;
    license?: string;
  };
  modules: Array<{
    id: string;
    params?: any;
  }>;
}
import { loadTypeScriptGenome } from './new.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';

interface AnalysisResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  moduleCount: number;
  adapterCount: number;
  integrationCount: number;
  featureCount: number;
  missingTemplates: string[];
  unusedFeatures: string[];
}

export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description('Analyze a genome file for structure, completeness, and best practices')
    .argument('<genome-file>', 'Path to TypeScript genome file (.ts)')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-j, --json', 'Output results as JSON', false)
    .action(async (genomeFile: string, options: { verbose?: boolean; json?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info(`🔍 Analyzing genome file: ${genomeFile}`);

        // Load the genome
        const genomePath = join(process.cwd(), genomeFile);
        const genome = await loadTypeScriptGenome(genomePath);

        if (!genome) {
          logger.error('❌ Failed to load genome file');
          process.exit(1);
        }

        // Perform analysis
        const analysis = await analyzeGenome(genome, logger);

        // Output results
        if (options.json) {
          console.log(JSON.stringify(analysis, null, 2));
        } else {
          displayAnalysisResults(analysis, logger);
        }

        // Exit with appropriate code
        process.exit(analysis.isValid ? 0 : 1);

      } catch (error) {
        logger.error('❌ Analysis failed:', error as Error);
        process.exit(1);
      }
    });

  return command;
}

async function analyzeGenome(genome: Genome, logger: Logger): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    moduleCount: genome.modules.length,
    adapterCount: 0,
    integrationCount: 0,
    featureCount: 0,
    missingTemplates: [],
    unusedFeatures: []
  };

  // Basic structure validation
  if (!genome.project?.name) {
    result.errors.push('Project name is required');
    result.isValid = false;
  }

  if (!genome.modules || genome.modules.length === 0) {
    result.errors.push('At least one module is required');
    result.isValid = false;
  }

  // Analyze modules
  const moduleIds = new Set<string>();
  const adapterIds = new Set<string>();
  const integrationIds = new Set<string>();

  for (const module of genome.modules) {
    // Check for duplicate modules
    if (moduleIds.has(module.id)) {
      result.errors.push(`Duplicate module ID: ${module.id}`);
      result.isValid = false;
    }
    moduleIds.add(module.id);

    // Categorize modules
    if (module.id.includes('integration')) {
      result.integrationCount++;
      integrationIds.add(module.id);
    } else {
      result.adapterCount++;
      adapterIds.add(module.id);
    }

    // Analyze features
    if (module.params?.features) {
      const featureCount = Object.keys(module.params.features).length;
      result.featureCount += featureCount;

      // Check for unused features (basic heuristic)
      if (featureCount === 0) {
        result.warnings.push(`Module ${module.id} has no features enabled`);
      }
    }

    // Validate module parameters
    if (!module.params) {
      result.warnings.push(`Module ${module.id} has no parameters`);
    }
  }

  // Check for common patterns
  const hasFramework = genome.modules.some((m: any) => 
    ['nextjs', 'react', 'vue', 'svelte'].includes(m.id)
  );
  if (!hasFramework) {
    result.warnings.push('No framework module detected');
  }

  const hasDatabase = genome.modules.some((m: any) => 
    ['drizzle', 'prisma', 'typeorm', 'sequelize'].includes(m.id)
  );
  if (!hasDatabase) {
    result.warnings.push('No database module detected');
  }

  const hasUI = genome.modules.some((m: any) => 
    ['shadcn-ui', 'tailwind', 'chakra-ui', 'mui'].includes(m.id)
  );
  if (!hasUI) {
    result.warnings.push('No UI framework module detected');
  }

  // Check for integration consistency
  const hasAuth = genome.modules.some((m: any) => 
    ['better-auth', 'next-auth', 'auth0'].includes(m.id)
  );
  const hasAuthIntegration = genome.modules.some((m: any) => 
    m.id.includes('auth') && m.id.includes('integration')
  );
  if (hasAuth && !hasAuthIntegration) {
    result.suggestions.push('Consider adding an auth integration for better database integration');
  }

  const hasDatabaseIntegration = genome.modules.some((m: any) => 
    m.id.includes('drizzle') && m.id.includes('integration')
  );
  if (hasDatabase && !hasDatabaseIntegration) {
    result.suggestions.push('Consider adding a database integration for better framework integration');
  }

  // Performance suggestions
  if (result.moduleCount > 20) {
    result.warnings.push('Large number of modules may impact generation performance');
  }

  if (result.integrationCount > result.adapterCount) {
    result.warnings.push('More integrations than adapters - ensure all integrations have required adapters');
  }

  // Best practices suggestions
  if (!genome.modules.some((m: any) => m.id === 'vitest' || m.id.includes('test'))) {
    result.suggestions.push('Consider adding testing framework for better code quality');
  }

  if (!genome.modules.some((m: any) => m.id === 'sentry' || m.id.includes('sentry'))) {
    result.suggestions.push('Consider adding error monitoring for production readiness');
  }

  if (!genome.modules.some((m: any) => m.id === 'docker' || m.id.includes('docker'))) {
    result.suggestions.push('Consider adding containerization for deployment');
  }

  return result;
}

function displayAnalysisResults(analysis: AnalysisResult, logger: Logger): void {
  logger.info('\n📊 GENOME ANALYSIS RESULTS');
  logger.info('=' .repeat(50));

  // Summary
  logger.info(`\n📈 SUMMARY:`);
  logger.info(`  • Total Modules: ${analysis.moduleCount}`);
  logger.info(`  • Adapters: ${analysis.adapterCount}`);
  logger.info(`  • Integrations: ${analysis.integrationCount}`);
  logger.info(`  • Features: ${analysis.featureCount}`);

  // Errors
  if (analysis.errors.length > 0) {
    logger.error(`\n❌ ERRORS (${analysis.errors.length}):`);
    analysis.errors.forEach(error => logger.error(`  • ${error}`));
  }

  // Warnings
  if (analysis.warnings.length > 0) {
    logger.warn(`\n⚠️  WARNINGS (${analysis.warnings.length}):`);
    analysis.warnings.forEach(warning => logger.warn(`  • ${warning}`));
  }

  // Suggestions
  if (analysis.suggestions.length > 0) {
    logger.info(`\n💡 SUGGESTIONS (${analysis.suggestions.length}):`);
    analysis.suggestions.forEach(suggestion => logger.info(`  • ${suggestion}`));
  }

  // Overall status
  logger.info(`\n${analysis.isValid ? '✅' : '❌'} GENOME STATUS: ${analysis.isValid ? 'VALID' : 'INVALID'}`);

  if (analysis.isValid) {
    logger.info('\n🎉 Your genome is ready for generation!');
  } else {
    logger.info('\n🔧 Please fix the errors before generating your project.');
  }
}
