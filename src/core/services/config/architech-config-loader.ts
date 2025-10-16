/**
 * Architech Configuration Loader
 * 
 * Loads and validates Architech configuration from:
 * 1. Project-level: ./architech.config.json
 * 2. User-level: ~/.architechrc
 * 3. Default: Built-in defaults
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ArchitechConfig } from '../genome-resolution/types.js';

export class ArchitechConfigLoader {
  private static DEFAULT_CONFIG: ArchitechConfig = {
    version: '1.0.0',
    defaultMarketplace: '@architech/marketplace',
    cache: {
      enabled: true,
      ttl: 3600 // 1 hour
    }
  };

  /**
   * Load configuration with priority: project > user > defaults
   */
  static async load(projectRoot?: string): Promise<ArchitechConfig> {
    // Try project-level config first
    if (projectRoot) {
      const projectConfig = await this.loadProjectConfig(projectRoot);
      if (projectConfig) {
        return this.mergeWithDefaults(projectConfig);
      }
    }

    // Try user-level config
    const userConfig = await this.loadUserConfig();
    if (userConfig) {
      return this.mergeWithDefaults(userConfig);
    }

    // Return defaults
    return this.DEFAULT_CONFIG;
  }

  /**
   * Load project-level configuration
   */
  private static async loadProjectConfig(projectRoot: string): Promise<ArchitechConfig | null> {
    const configPaths = [
      path.join(projectRoot, 'architech.config.json'),
      path.join(projectRoot, '.architechrc'),
      path.join(projectRoot, '.architech', 'config.json')
    ];

    for (const configPath of configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content) as ArchitechConfig;
        
        // Validate
        this.validateConfig(config);
        
        return config;
      } catch {
        // Try next path
        continue;
      }
    }

    return null;
  }

  /**
   * Load user-level configuration
   */
  private static async loadUserConfig(): Promise<ArchitechConfig | null> {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    const configPaths = [
      path.join(homeDir, '.architechrc'),
      path.join(homeDir, '.architech', 'config.json'),
      path.join(homeDir, '.config', 'architech', 'config.json')
    ];

    for (const configPath of configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content) as ArchitechConfig;
        
        // Validate
        this.validateConfig(config);
        
        return config;
      } catch {
        // Try next path
        continue;
      }
    }

    return null;
  }

  /**
   * Merge user config with defaults
   */
  private static mergeWithDefaults(config: Partial<ArchitechConfig>): ArchitechConfig {
    return {
      ...this.DEFAULT_CONFIG,
      ...config,
      cache: {
        enabled: config.cache?.enabled ?? this.DEFAULT_CONFIG.cache!.enabled,
        ttl: config.cache?.ttl ?? this.DEFAULT_CONFIG.cache!.ttl
      },
      genomeSources: config.genomeSources || [],
      genomeAliases: {
        ...config.genomeAliases
      }
    };
  }

  /**
   * Validate configuration structure
   */
  private static validateConfig(config: any): void {
    if (!config.version) {
      throw new Error('Configuration must have a version field');
    }

    // Warn if version mismatch
    if (config.version !== '1.0.0') {
      console.warn(`⚠️  Configuration version ${config.version} may not be compatible with CLI version 1.0.0`);
    }

    // Validate genome sources
    if (config.genomeSources) {
      if (!Array.isArray(config.genomeSources)) {
        throw new Error('genomeSources must be an array');
      }

      config.genomeSources.forEach((source: any, index: number) => {
        if (!source.name) {
          throw new Error(`Genome source ${index} must have a name`);
        }
        if (!source.type) {
          throw new Error(`Genome source ${index} must have a type`);
        }
        if (!source.path && !source.url && !source.package) {
          throw new Error(`Genome source ${index} must have path, url, or package`);
        }
        if (typeof source.priority !== 'number') {
          throw new Error(`Genome source ${index} must have a numeric priority`);
        }
      });
    }
  }

  /**
   * Save configuration
   */
  static async save(config: ArchitechConfig, scope: 'project' | 'user' = 'project', projectRoot?: string): Promise<void> {
    const configPath = scope === 'project'
      ? path.join(projectRoot || process.cwd(), 'architech.config.json')
      : path.join(process.env.HOME || '~', '.architechrc');

    // Ensure directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    // Write config with pretty formatting
    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
  }

  /**
   * Create default config file
   */
  static async createDefault(scope: 'project' | 'user' = 'project', projectRoot?: string): Promise<void> {
    const config: ArchitechConfig = {
      version: '1.0.0',
      defaultMarketplace: '@architech/marketplace',
      genomeSources: [
        {
          name: 'local-development',
          type: 'local',
          path: '../marketplace',
          priority: 1,
          enabled: true
        }
      ],
      genomeAliases: {},
      cache: {
        enabled: true,
        ttl: 3600
      }
    };

    await this.save(config, scope, projectRoot);
  }
}

