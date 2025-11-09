/**
 * Dynamic Connector Resolver
 *
 * Automatically detects and resolves connectors based on their configuration files.
 * Used by GenomeDetector for project analysis.
 */
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class DynamicConnectorResolver {
    /**
     * Find all matching connectors for the given modules
     */
    async findMatchingConnectors(currentModules) {
        Logger.info('🔍 Scanning for matching connectors', {
            operation: 'connector_resolution',
            moduleCount: currentModules.length
        });
        const matches = [];
        const currentModuleIds = currentModules.map(m => m.id);
        try {
            // Get all available connectors
            const availableConnectors = await this.scanAllConnectors();
            Logger.debug(`Found ${availableConnectors.length} connectors in marketplace`, {
                operation: 'connector_resolution',
                connectors: availableConnectors.map(c => c.id)
            });
            // Find matching connectors
            for (const connector of availableConnectors) {
                const match = this.evaluateConnectorMatch(connector, currentModuleIds);
                if (match) {
                    matches.push(match);
                    Logger.info(`✅ Found matching connector: ${connector.id}`, {
                        operation: 'connector_resolution',
                        evidence: match.evidence
                    });
                }
            }
            Logger.info(`🎯 Resolved ${matches.length} connectors`, {
                operation: 'connector_resolution',
                matches: matches.map(m => m.connectorId)
            });
            return matches;
        }
        catch (error) {
            Logger.error(`❌ Failed to resolve connectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }
    /**
     * Scan all connectors in the marketplace
     */
    async scanAllConnectors() {
        const connectors = [];
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
        const manifestPath = path.join(marketplaceRoot, 'manifest.json');
        try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            const entries = manifest?.modules?.connectors || [];
            for (const entry of entries) {
                try {
                    const module = this.createModuleFromManifestEntry(entry, marketplaceRoot);
                    const config = await MarketplaceService.loadModuleConfig(module);
                    connectors.push({
                        id: config.id,
                        requires: config.requires || [],
                        prerequisites: config.prerequisites || {},
                        connects: config.connects || []
                    });
                }
                catch (error) {
                    Logger.warn(`Failed to load connector metadata for ${entry?.id}`, {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    continue;
                }
            }
        }
        catch (error) {
            Logger.error('Unable to read marketplace manifest for connectors', {
                path: manifestPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        return connectors;
    }
    /**
     * Evaluate if a connector matches the current modules
     */
    evaluateConnectorMatch(connector, currentModuleIds) {
        // Get all required modules for this connector
        const requiredModules = [
            ...(connector.requires || []),
            ...(connector.prerequisites?.modules || [])
        ];
        if (requiredModules.length === 0) {
            return null; // No requirements, skip
        }
        // Check if all required modules are present
        const hasAllRequirements = requiredModules.every(required => currentModuleIds.includes(required));
        if (hasAllRequirements) {
            return {
                connectorId: connector.id,
                confidence: 100,
                evidence: requiredModules,
                parameters: {}
            };
        }
        return null;
    }
    createModuleFromManifestEntry(entry, marketplaceRoot) {
        if (!entry?.id || !entry?.manifest?.file || !entry?.blueprint?.file) {
            throw new Error(`Invalid manifest entry for module ${entry?.id ?? '<unknown>'}`);
        }
        const module = {
            id: entry.id,
            category: entry.category || entry.type || 'connector',
            parameters: {},
            parameterSchema: entry.parameters || {},
            features: {},
            externalFiles: [],
            config: undefined,
            source: entry.source,
            manifest: entry.manifest,
            blueprint: entry.blueprint,
            templates: entry.templates || [],
            marketplace: {
                name: entry.marketplace?.name || 'core',
                root: entry.marketplace?.root || marketplaceRoot
            },
            resolved: {
                root: path.join(marketplaceRoot, entry.source?.root || ''),
                manifest: path.join(marketplaceRoot, entry.manifest.file),
                blueprint: path.join(marketplaceRoot, entry.blueprint.file),
                templates: (entry.templates || []).map((template) => path.join(marketplaceRoot, template))
            }
        };
        return module;
    }
}
//# sourceMappingURL=dynamic-connector-resolver.js.map