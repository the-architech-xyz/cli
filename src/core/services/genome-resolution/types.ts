/**
 * Genome Resolution Types
 * 
 * Type definitions for the genome resolution system that enables
 * user-friendly shorthand syntax (--genome saas-starter) while
 * maintaining support for direct file paths.
 */

/**
 * Resolved genome information
 */
export interface ResolvedGenome {
  /** User-friendly name (e.g., "hello-world") */
  name: string;
  
  /** Absolute path to the .genome.ts file */
  path: string;
  
  /** Resolution source identifier */
  source: ResolutionSource;
  
  /** Extracted metadata (optional, may require execution) */
  metadata?: GenomeMetadata;
}

/**
 * Genome metadata extracted from file
 */
export interface GenomeMetadata {
  /** Genome version */
  version: string;
  
  /** Human-readable description */
  description: string;
  
  /** Primary framework (nextjs, remix, etc.) */
  framework: string;
  
  /** Number of modules in genome */
  moduleCount: number;
  
  /** Complexity level */
  complexity: 'simple' | 'intermediate' | 'advanced';
  
  /** Categorization tags */
  tags: string[];
  
  /** Estimated generation time */
  estimatedTime?: string;
}

/**
 * Resolution source types
 */
export type ResolutionSource = 
  | 'file-path'              // Direct file path provided by user
  | 'local-marketplace'      // ../marketplace/genomes/official/
  | 'npm-package'            // node_modules/@architech/marketplace
  | 'custom-local'           // Custom local directory
  | 'custom-git'             // Git repository
  | 'custom-url';            // HTTP(S) URL

/**
 * Resolution strategy interface
 */
export interface IResolutionStrategy {
  /** Strategy name for logging */
  readonly name: string;
  
  /** Try to resolve genome from this source */
  resolve(input: string): Promise<ResolvedGenome | null>;
  
  /** Check if this strategy can handle the input */
  canHandle(input: string): boolean;
}

/**
 * Genome source configuration
 */
export interface GenomeSourceConfig {
  /** Source name for identification */
  name: string;
  
  /** Source type */
  type: 'local' | 'git' | 'npm' | 'url';
  
  /** Source path/URL */
  path: string;
  
  /** Resolution priority (lower = higher priority) */
  priority: number;
  
  /** Whether this source is enabled */
  enabled?: boolean;
}

/**
 * Architech configuration for genome resolution
 */
export interface ArchitechConfig {
  /** Configuration version */
  version: string;
  
  /** Default marketplace package */
  defaultMarketplace?: string;
  
  /** Custom genome sources */
  genomeSources?: GenomeSourceConfig[];
  
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttl?: number; // Time to live in seconds
  };
  
  /** Genome aliases (custom name → file name mappings) */
  genomeAliases?: Record<string, string>;
}

/**
 * Resolution options
 */
export interface ResolutionOptions {
  /** Skip cache and force fresh resolution */
  skipCache?: boolean;
  
  /** Verbose logging */
  verbose?: boolean;
  
  /** Custom sources to try */
  customSources?: GenomeSourceConfig[];
}

/**
 * Genome not found error details
 */
export interface GenomeNotFoundDetails {
  /** Input that couldn't be resolved */
  input: string;
  
  /** Sources that were checked */
  sourcesChecked: string[];
  
  /** Similar genome suggestions */
  suggestions: string[];
  
  /** All available genomes */
  availableGenomes?: string[];
}

