/**
 * Custom Source Resolution Strategy
 * 
 * Resolves genomes from user-defined custom sources.
 * Sources can be:
 * - Local directories (company genomes, personal collections)
 * - Git repositories (future)
 * - HTTP(S) URLs (future)
 * 
 * Configured via architech.config.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { IResolutionStrategy, ResolvedGenome, GenomeSourceConfig } from '../types.js';
import { GenomeResolver } from '../genome-resolver.js';

export class CustomSourceStrategy implements IResolutionStrategy {
  readonly name: string;
  
  constructor(
    private resolver: GenomeResolver,
    private sourceConfig: GenomeSourceConfig
  ) {
    this.name = `custom-${sourceConfig.type}-${sourceConfig.name}`;
  }

  /**
   * Can handle any non-path input
   */
  canHandle(input: string): boolean {
    // Only try if this source is enabled
    if (this.sourceConfig.enabled === false) {
      return false;
    }
    
    return !this.resolver.looksLikeFilePath(input);
  }

  /**
   * Resolve from custom source
   */
  async resolve(input: string): Promise<ResolvedGenome | null> {
    if (!this.canHandle(input)) {
      return null;
    }

    switch (this.sourceConfig.type) {
      case 'local':
        return await this.resolveFromLocal(input);
      
      case 'git':
        // Future: Clone or fetch from git repository
        return await this.resolveFromGit(input);
      
      case 'npm':
        // Future: Resolve from custom NPM registry
        return await this.resolveFromNpm(input);
      
      case 'url':
        // Future: Download from HTTP(S) URL
        return await this.resolveFromUrl(input);
      
      default:
        return null;
    }
  }

  /**
   * Resolve from local directory
   */
  private async resolveFromLocal(input: string): Promise<ResolvedGenome | null> {
    try {
      // Normalize genome name
      const normalized = this.resolver.normalizeGenomeName(input);
      
      // Resolve source path
      const sourcePath = path.resolve(this.sourceConfig.path);
      
      // Try direct match
      const genomePath = path.join(sourcePath, `${normalized}.genome.ts`);
      
      try {
        await fs.access(genomePath);
        
        const metadata = await this.resolver.extractMetadata(genomePath);
        
        return {
          name: input,
          path: genomePath,
          source: 'custom-local',
          metadata
        };
      } catch {
        // Try with original input (no normalization)
        const altGenomePath = path.join(sourcePath, `${input}.genome.ts`);
        
        try {
          await fs.access(altGenomePath);
          
          const metadata = await this.resolver.extractMetadata(altGenomePath);
          
          return {
            name: input,
            path: altGenomePath,
            source: 'custom-local',
            metadata
          };
        } catch {
          return null;
        }
      }
    } catch {
      return null;
    }
  }

  /**
   * Resolve from Git repository (Future Feature)
   */
  private async resolveFromGit(input: string): Promise<ResolvedGenome | null> {
    // TODO: Implement git resolution
    // 1. Clone/fetch repository to temp directory
    // 2. Look for genome file
    // 3. Cache locally
    return null;
  }

  /**
   * Resolve from custom NPM registry (Future Feature)
   */
  private async resolveFromNpm(input: string): Promise<ResolvedGenome | null> {
    // TODO: Implement custom NPM registry
    // Similar to NpmPackageStrategy but with custom registry
    return null;
  }

  /**
   * Resolve from HTTP(S) URL (Future Feature)
   */
  private async resolveFromUrl(input: string): Promise<ResolvedGenome | null> {
    // TODO: Implement URL resolution
    // 1. Download genome file
    // 2. Validate it
    // 3. Cache locally
    // 4. Return cached path
    return null;
  }
}

