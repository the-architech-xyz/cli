/**
 * Genome Resolver Factory
 * 
 * Creates and configures GenomeResolver with all resolution strategies
 * in the correct priority order.
 */

import { GenomeResolver } from './genome-resolver.js';
import { ArchitechConfig } from './types.js';
import {
  FilePathStrategy,
  LocalMarketplaceStrategy,
  NpmPackageStrategy,
  CustomSourceStrategy
} from './strategies/index.js';

export class GenomeResolverFactory {
  /**
   * Create a fully configured GenomeResolver with all strategies
   */
  static create(config?: ArchitechConfig): GenomeResolver {
    const resolver = new GenomeResolver(config);

    // Register strategies in priority order:
    // 1. File paths (highest priority - if user specifies a path, use it)
    resolver.registerStrategy(new FilePathStrategy(resolver));
    
    // 2. Local marketplace (official genomes in development)
    resolver.registerStrategy(new LocalMarketplaceStrategy(resolver));
    
    // 3. NPM package (published marketplace)
    resolver.registerStrategy(new NpmPackageStrategy(resolver));
    
    // 4. Custom sources (user-defined, sorted by priority)
    if (config?.genomeSources) {
      const sortedSources = [...config.genomeSources]
        .filter(source => source.enabled !== false)
        .sort((a, b) => a.priority - b.priority);
      
      for (const source of sortedSources) {
        resolver.registerStrategy(new CustomSourceStrategy(resolver, source));
      }
    }

    return resolver;
  }

  /**
   * Create resolver with default configuration
   */
  static createDefault(): GenomeResolver {
    return this.create();
  }

  /**
   * Create resolver from config file
   */
  static async createFromConfigFile(configPath?: string): Promise<GenomeResolver> {
    const config = await this.loadConfig(configPath);
    return this.create(config);
  }

  /**
   * Load configuration from file using ArchitechConfigLoader
   */
  private static async loadConfig(configPath?: string): Promise<ArchitechConfig | undefined> {
    const { ArchitechConfigLoader } = await import('../config/index.js');
    
    try {
      // Use the centralized config loader
      const config = await ArchitechConfigLoader.load(
        configPath || process.cwd()
      );
      
      return config;
    } catch (error) {
      // Config loading failed - use defaults
      console.warn('Could not load config, using defaults');
      return undefined;
    }
  }
}

