/**
 * Genome Resolver Service
 * 
 * Main service for resolving genome shorthands to actual file paths.
 * Supports multiple resolution strategies with fallback chain.
 * 
 * Resolution order:
 * 1. Check if input is already a file path → use directly
 * 2. Try local marketplace (../marketplace/genomes/official/)
 * 3. Try NPM package (@architech/marketplace)
 * 4. Try custom sources (from config)
 * 5. Throw helpful error with suggestions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ResolvedGenome, ResolutionOptions, IResolutionStrategy, ArchitechConfig } from './types.js';
import { FilePathStrategy, LocalMarketplaceStrategy } from './strategies/index.js';

export class GenomeResolver {
  private cache: Map<string, ResolvedGenome> = new Map();
  private strategies: IResolutionStrategy[] = [];
  
  constructor(private config?: ArchitechConfig) {
    // Strategies will be registered dynamically
  }

  /**
   * Register a resolution strategy
   */
  registerStrategy(strategy: IResolutionStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Main resolution method
   * Tries all strategies in order until one succeeds
   */
  async resolve(input: string, options?: ResolutionOptions): Promise<ResolvedGenome> {
    // Validate input
    if (!input || input.trim() === '') {
      throw new Error('Genome input cannot be empty');
    }

    const trimmedInput = input.trim();

    // Check cache first (unless skipCache is true)
    if (!options?.skipCache && this.cache.has(trimmedInput)) {
      return this.cache.get(trimmedInput)!;
    }

    // Try each strategy in order
    for (const strategy of this.strategies) {
      try {
        const resolved = await strategy.resolve(trimmedInput);
        
        if (resolved) {
          // Cache successful resolution
          this.cache.set(trimmedInput, resolved);
          
          return resolved;
        }
      } catch (error) {
        // Strategy failed, try next one
        continue;
      }
    }

    // No strategy succeeded - throw helpful error
    throw this.createNotFoundError(trimmedInput, options);
  }

  /**
   * Check if input looks like a file path
   */
  looksLikeFilePath(input: string): boolean {
    return input.includes('/') || 
           input.includes('\\') || 
           input.endsWith('.genome.ts') ||
           input.endsWith('.ts') ||
           input.startsWith('.') ||
           input.startsWith('~') ||
           path.isAbsolute(input);
  }

  private async createNotFoundError(input: string, _options?: ResolutionOptions): Promise<Error> {
    return new Error(
      `Genome not found: "${input}".\n` +
      `Specify a full path (architech new /path/to/genome.genome.ts) or use --list to view available genomes.`
    );
  }

  /**
   * Clear resolution cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create a GenomeResolver with the default strategy chain (file path, local marketplace, npm, custom sources).
 * Keeps genome alias resolution decoupled from template marketplace handling.
 */
export function createGenomeResolver(config?: ArchitechConfig): GenomeResolver {
  const resolver = new GenomeResolver(config);

  resolver.registerStrategy(new FilePathStrategy(resolver));
  resolver.registerStrategy(new LocalMarketplaceStrategy(resolver));

  return resolver;
}

/**
 * Create a GenomeResolver using configuration loaded from disk.
 */
export async function createGenomeResolverFromConfig(configPath?: string): Promise<GenomeResolver> {
  const config = await loadResolverConfig(configPath);
  return createGenomeResolver(config);
}

async function loadResolverConfig(configPath?: string): Promise<ArchitechConfig | undefined> {
  const { ArchitechConfigLoader } = await import('../config/index.js');

  try {
    return await ArchitechConfigLoader.load(configPath || process.cwd());
  } catch (error) {
    console.warn('Could not load architech config, using default genome resolver.');
    return undefined;
  }
}

