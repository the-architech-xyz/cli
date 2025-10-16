/**
 * Add Command - V2 Feature Addition
 *
 * Adds features to existing projects
 * Usage: architech add <adapter>:<feature> [options]
 */
import { Command } from 'commander';
import { PathService } from '../core/services/path/path-service.js';
// import { FeatureManager } from '../core/services/feature/feature-manager.js'; // V2 feature removed
import { ModuleService } from '../core/services/module-management/module-service.js';
import { CacheManagerService } from '../core/services/infrastructure/cache/cache-manager.js';
import { AgentLogger } from '../core/cli/logger.js';
const logger = new AgentLogger();
export function createAddCommand() {
    const command = new Command('add');
    command
        .description('Add features to an existing project')
        .argument('<feature>', 'Feature to add (format: adapter:feature or feature-id)')
        .option('-p, --path <path>', 'Project path (default: current directory)')
        .option('--dry-run', 'Show what would be added without making changes')
        .option('--force', 'Force add even if conflicts are detected')
        .action(async (featureArg, options) => {
        try {
            logger.info(`🔧 Adding feature: ${featureArg}`);
            // Parse feature argument
            const featureSpec = parseFeatureSpec(featureArg);
            if (!featureSpec) {
                logger.error('❌ Invalid feature specification. Use format: adapter:feature or feature-id');
                process.exit(1);
            }
            // Initialize path handler
            const projectPath = options.path || process.cwd();
            const pathHandler = new PathService(projectPath, '');
            // Check if project has architech.json
            const fs = await import('fs/promises');
            const configPath = pathHandler.getProjectRoot() + '/architech.json';
            let hasArchitechConfig = false;
            try {
                await fs.access(configPath);
                hasArchitechConfig = true;
            }
            catch {
                hasArchitechConfig = false;
            }
            if (!hasArchitechConfig) {
                logger.error('❌ No architech.json found. This command requires an existing Architech project.');
                logger.info('💡 Tip: Use "architech new" to create a new project first.');
                process.exit(1);
            }
            // Initialize module service
            const cacheManager = new CacheManagerService();
            const moduleService = new ModuleService(cacheManager);
            await moduleService.initialize();
            // Initialize feature manager
            // const featureManager = new FeatureManager(pathHandler, moduleFetcher); // V2 feature removed
            if (options.dryRun) {
                logger.info('🔍 Dry run mode - showing what would be added:');
                // await featureManager.dryRunAddFeature(featureSpec); // V2 feature removed
                logger.warn('V2 feature addition not yet implemented');
            }
            else {
                // Add the feature
                // const result = await featureManager.addFeature(featureSpec, {
                //   force: options.force
                // }); // V2 feature removed
                logger.warn('V2 feature addition not yet implemented');
                const result = { success: false, filesCreated: [], filesModified: [] };
                if (result.success) {
                    logger.success(`✅ Feature "${featureArg}" added successfully!`);
                    logger.info(`📁 Files created: ${result.filesCreated.length}`);
                    logger.info(`📝 Files modified: ${result.filesModified.length}`);
                }
                else {
                    logger.error(`❌ Failed to add feature: V2 feature addition not yet implemented`);
                    process.exit(1);
                }
            }
        }
        catch (error) {
            logger.error(`❌ Error adding feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    });
    return command;
}
function parseFeatureSpec(featureArg) {
    // Check if it's an adapter:feature format
    if (featureArg.includes(':')) {
        const [adapterId, featureId] = featureArg.split(':');
        if (!adapterId || !featureId) {
            return null;
        }
        return {
            type: 'adapter-feature',
            adapterId,
            featureId,
            fullSpec: featureArg
        };
    }
    // Check if it's a cross-adapter feature
    return {
        type: 'cross-adapter-feature',
        featureId: featureArg,
        fullSpec: featureArg
    };
}
//# sourceMappingURL=add.js.map