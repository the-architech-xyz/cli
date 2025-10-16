/**
 * Genome Resolver Factory
 *
 * Creates and configures GenomeResolver with all resolution strategies
 * in the correct priority order.
 */
import { GenomeResolver } from './genome-resolver.js';
import { ArchitechConfig } from './types.js';
export declare class GenomeResolverFactory {
    /**
     * Create a fully configured GenomeResolver with all strategies
     */
    static create(config?: ArchitechConfig): GenomeResolver;
    /**
     * Create resolver with default configuration
     */
    static createDefault(): GenomeResolver;
    /**
     * Create resolver from config file
     */
    static createFromConfigFile(configPath?: string): Promise<GenomeResolver>;
    /**
     * Load configuration from file using ArchitechConfigLoader
     */
    private static loadConfig;
}
