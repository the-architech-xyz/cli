/**
 * Dynamic Connector Resolver
 *
 * Automatically detects and resolves connectors based on their configuration files.
 * Replaces the hardcoded connector detection with a truly dynamic system.
 */
import { Module } from '@thearchitech.xyz/types';
export interface ConnectorConfig {
    id: string;
    requires?: string[];
    prerequisites?: {
        modules?: string[];
    };
    connects?: string[];
}
export interface ConnectorMatch {
    connectorId: string;
    confidence: number;
    evidence: string[];
    parameters: Record<string, any>;
}
export declare class DynamicConnectorResolver {
    /**
     * Find all matching connectors for the given modules
     */
    findMatchingConnectors(currentModules: Module[]): Promise<ConnectorMatch[]>;
    /**
     * Scan all connectors in the marketplace
     */
    private scanAllConnectors;
    /**
     * Evaluate if a connector matches the current modules
     */
    private evaluateConnectorMatch;
    /**
     * Check if directory exists
     */
    private directoryExists;
    /**
     * Check if path is a directory
     */
    private isDirectory;
}
