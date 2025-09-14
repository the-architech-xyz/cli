/**
 * Modifier Service
 * 
 * Centralized service for all file modification operations.
 * Handles package.json merging, tsconfig enhancement, and other file modifications.
 */

import { ProjectContext } from '@thearchitech.xyz/types';
import { FileModificationEngine } from '../file-engine/file-modification-engine.js';
// import { ModifierDefinition } from '@thearchitech.xyz/types'; // Not available in current types
import * as fs from 'fs/promises';
import * as path from 'path';
import merge from 'deepmerge';

export interface ModifierParams {
  [key: string]: any;
}

export interface ModifierResult {
  success: boolean;
  message?: string;
  error?: string;
}

export abstract class BaseModifier {
  protected engine: FileModificationEngine;

  constructor(engine: FileModificationEngine) {
    this.engine = engine;
  }

  /**
   * Execute the modifier on the specified file
   */
  abstract execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
}

/**
 * Package.json Merger Modifier
 */
export class PackageJsonMerger extends BaseModifier {
  async execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult> {
    try {
      const { dependencies, devDependencies, scripts } = params;
      
      // Read existing package.json
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existing = JSON.parse(existingContent);
      
      // Merge dependencies
      if (dependencies) {
        existing.dependencies = { ...existing.dependencies, ...dependencies };
      }
      
      if (devDependencies) {
        existing.devDependencies = { ...existing.devDependencies, ...devDependencies };
      }
      
      if (scripts) {
        existing.scripts = { ...existing.scripts, ...scripts };
      }
      
      // Write back
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
      
      return { success: true, message: 'Package.json merged successfully' };
    } catch (error) {
      return { success: false, error: `Failed to merge package.json: ${error}` };
    }
  }
}

/**
 * TSConfig Enhancer Modifier
 */
export class TSConfigEnhancer extends BaseModifier {
  async execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult> {
    try {
      const { compilerOptions, include, exclude } = params;
      
      // Read existing tsconfig.json
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existing = JSON.parse(existingContent);
      
      // Merge compiler options
      if (compilerOptions) {
        existing.compilerOptions = merge(existing.compilerOptions || {}, compilerOptions);
      }
      
      if (include) {
        existing.include = [...(existing.include || []), ...include];
      }
      
      if (exclude) {
        existing.exclude = [...(existing.exclude || []), ...exclude];
      }
      
      // Write back
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
      
      return { success: true, message: 'TSConfig enhanced successfully' };
    } catch (error) {
      return { success: false, error: `Failed to enhance tsconfig.json: ${error}` };
    }
  }
}

/**
 * Modifier Registry
 */
export class ModifierRegistry {
  private instances: Map<string, BaseModifier> = new Map();

  constructor(private engine: FileModificationEngine) {}

  /**
   * Register a modifier
   */
  register(id: string, modifier: BaseModifier): void {
    this.instances.set(id, modifier);
  }

  /**
   * Get modifier by ID
   */
  getModifier(id: string): BaseModifier | undefined {
    return this.instances.get(id);
  }

  /**
   * Execute a modifier
   */
  async executeModifier(
    id: string, 
    filePath: string, 
    params: ModifierParams, 
    context: ProjectContext
  ): Promise<ModifierResult> {
    const modifier = this.getModifier(id);
    if (!modifier) {
      return { success: false, error: `Modifier '${id}' not found` };
    }
    
    return await modifier.execute(filePath, params, context);
  }
}
