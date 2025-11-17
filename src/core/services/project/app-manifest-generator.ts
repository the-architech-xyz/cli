/**
 * App Manifest Generator
 * 
 * Generates a manifest.json file that describes the generated application,
 * including all installed modules, features, and configuration.
 */

import { Genome, ResolvedGenome } from '@thearchitech.xyz/types';
import { getProjectFramework } from '../../utils/genome-helpers.js';
import { PathService } from '../path/path-service.js';
import { Logger } from '../infrastructure/logging/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AppManifest {
  version: string;
  generatedAt: string;
  generator: {
    name: string;
    version: string;
  };
  project: {
    name: string;
    description?: string;
    framework: string;
  };
  modules: {
    id: string;
    category: string;
    parameters?: Record<string, any>;
  }[];
  features: string[];
}

export class AppManifestGenerator {
  /**
   * Generate and save application manifest
   */
  async generateAndSaveManifest(
    genome: ResolvedGenome,
    projectPath: string
  ): Promise<void> {
    try {
      const manifest = this.generateManifest(genome);
      const manifestPath = path.join(projectPath, '.architech', 'manifest.json');
      
      // Ensure .architech directory exists
      await fs.mkdir(path.dirname(manifestPath), { recursive: true });
      
      // Write manifest
      await fs.writeFile(
        manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );
      
      Logger.info(`✅ Generated app manifest: ${manifestPath}`, {
        operation: 'manifest_generation',
        moduleCount: manifest.modules.length,
        featureCount: manifest.features.length
      });
    } catch (error) {
      Logger.error(`❌ Failed to generate manifest: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        operation: 'manifest_generation'
      });
      // Non-critical: don't fail the entire operation
    }
  }

  /**
   * Generate manifest object
   */
  private generateManifest(genome: ResolvedGenome): AppManifest {
    const modules = genome.modules.map(module => ({
      id: module.id,
      category: this.getCategoryFromId(module.id),
      parameters: module.parameters
    }));

    const features = modules
      .filter(m => m.category === 'feature')
      .map(m => m.id);

    return {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      generator: {
        name: '@thearchitech.xyz/cli',
        version: genome.version || '1.0.0'
      },
      project: {
        name: genome.project.name,
        description: genome.project.description,
        framework: getProjectFramework(genome) || 'unknown'
      },
      modules,
      features
    };
  }

  /**
   * Extract category from module ID
   */
  private getCategoryFromId(moduleId: string): string {
    const parts = moduleId.split('/');
    return parts[0] || 'unknown';
  }
}

