/**
 * JSON Object Merger Modifier
 * 
 * Pure modifier that merges properties into JSON files (package.json, tsconfig.json, etc.).
 * Completely agnostic to what it's merging - all business logic comes from blueprint parameters.
 */

import { BasePureModifier } from './pure-modifier.js';
import deepmerge from 'deepmerge';

export interface JSONObjectMergerParams {
  targetPath: string[];         // Path to merge into (e.g., ['scripts', 'build'])
  propertiesToMerge: Record<string, any>;
  mergeStrategy: 'deep' | 'shallow' | 'replace';
}

export class JSONObjectMerger extends BasePureModifier {
  getName(): string {
    return 'json-object-merger';
  }
  
  getDescription(): string {
    return 'Merges properties into JSON files (package.json, tsconfig.json, etc.)';
  }
  
  validateParams(params: any): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }
    
    const { targetPath, propertiesToMerge, mergeStrategy } = params;
    
    // Validate targetPath
    if (!Array.isArray(targetPath)) {
      return false;
    }
    
    if (targetPath.length === 0) {
      return false;
    }
    
    for (const pathSegment of targetPath) {
      if (typeof pathSegment !== 'string' || !pathSegment.trim()) {
        return false;
      }
    }
    
    // Validate propertiesToMerge
    if (propertiesToMerge === undefined || propertiesToMerge === null) {
      return false;
    }
    
    if (typeof propertiesToMerge !== 'object') {
      return false;
    }
    
    // Validate mergeStrategy
    if (!['deep', 'shallow', 'replace'].includes(mergeStrategy)) {
      return false;
    }
    
    return true;
  }
  
  async transform(filePath: string, params: JSONObjectMergerParams): Promise<void> {
    try {
      await this.validateFile(filePath);
      
      const content = await this.readFile(filePath);
      const jsonData = this.parseJSON(content);
      
      // Navigate to the target path
      const targetObject = this.getTargetObject(jsonData, params.targetPath);
      
      // Merge the properties
      this.mergeProperties(targetObject, params);
      
      // Write the modified content back
      const modifiedContent = JSON.stringify(jsonData, null, 2);
      await this.writeFile(filePath, modifiedContent);
      
    } catch (error) {
      this.handleError(error as Error, filePath, this.getName());
    }
  }
  
  private parseJSON(content: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private getTargetObject(jsonData: any, targetPath: string[]): any {
    let current = jsonData;
    
    for (let i = 0; i < targetPath.length; i++) {
      const pathSegment = targetPath[i];
      
      if (current === null || current === undefined) {
        throw new Error(`Cannot navigate to path '${targetPath.join('.')}': encountered null/undefined at '${targetPath.slice(0, i).join('.')}'`);
      }
      
      if (typeof current !== 'object') {
        throw new Error(`Cannot navigate to path '${targetPath.join('.')}': '${targetPath.slice(0, i).join('.')}' is not an object`);
      }
      
      if (pathSegment && !(pathSegment in current)) {
        // Create the path if it doesn't exist
        current[pathSegment] = {};
      }
      
      if (pathSegment) {
        current = current[pathSegment];
      }
    }
    
    return current;
  }
  
  private mergeProperties(targetObject: any, params: JSONObjectMergerParams): void {
    const { propertiesToMerge, mergeStrategy } = params;
    
    // Ensure target is an object
    if (typeof targetObject !== 'object' || targetObject === null) {
      throw new Error(`Target object is not a valid object for merging`);
    }
    
    // Merge properties based on strategy
    switch (mergeStrategy) {
      case 'deep':
        // Use deepmerge for deep merging
        Object.assign(targetObject, deepmerge(targetObject, propertiesToMerge));
        break;
        
      case 'shallow':
        // Shallow merge
        Object.assign(targetObject, propertiesToMerge);
        break;
        
      case 'replace':
        // Replace the entire object
        Object.keys(targetObject).forEach(key => delete targetObject[key]);
        Object.assign(targetObject, propertiesToMerge);
        break;
        
      default:
        throw new Error(`Unknown merge strategy: ${mergeStrategy}`);
    }
  }
}
