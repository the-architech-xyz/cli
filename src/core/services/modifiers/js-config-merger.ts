/**
 * JavaScript Configuration Merger Modifier
 * 
 * Pure modifier that deep-merges properties into exported configuration objects.
 * Completely agnostic to what it's merging - all business logic comes from blueprint parameters.
 */

import { BasePureModifier } from './pure-modifier.js';
import { Project, SourceFile, VariableDeclaration, ObjectLiteralExpression } from 'ts-morph';
import merge from 'deepmerge';

export interface JSConfigMergerParams {
  exportName: string;           // Which export to merge into
  propertiesToMerge: Record<string, any>; // Properties to deep-merge
  mergeStrategy: 'deep' | 'shallow' | 'replace';
}

export class JSConfigMerger extends BasePureModifier {
  getName(): string {
    return 'js-config-merger';
  }
  
  getDescription(): string {
    return 'Deep-merges properties into exported configuration objects';
  }
  
  validateParams(params: any): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }
    
    const { exportName, propertiesToMerge, mergeStrategy } = params;
    
    // Validate exportName
    if (typeof exportName !== 'string' || !exportName.trim()) {
      return false;
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
  
  async transform(filePath: string, params: JSConfigMergerParams): Promise<void> {
    try {
      await this.validateFile(filePath);
      
      const content = await this.readFile(filePath);
      const project = new Project();
      const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });
      
      // Find the target export
      const targetExport = this.findTargetExport(sourceFile, params.exportName);
      
      if (!targetExport) {
        throw new Error(`Export '${params.exportName}' not found`);
      }
      
      // Merge the properties
      this.mergeProperties(targetExport, params);
      
      // Write the modified content back
      const modifiedContent = sourceFile.getFullText();
      await this.writeFile(filePath, modifiedContent);
      
    } catch (error) {
      this.handleError(error as Error, filePath, this.getName());
    }
  }
  
  private findTargetExport(sourceFile: SourceFile, exportName: string): any {
    const statements = sourceFile.getStatements();
    
    if (exportName === 'default') {
      // Look for default export
      const defaultExport = statements.find(s => s.getKind() === 278); // ExportAssignment
      if (defaultExport) {
        return { statement: defaultExport, type: 'default' };
      }
    } else {
      // Look for named exports using text-based parsing
      const exportStatement = statements.find(s => {
        if (s.getKind() === 244) { // VariableStatement
          const text = s.getText();
          // Check if this statement contains the export name
          return text.includes(`export const ${exportName}`) || 
                 text.includes(`export let ${exportName}`) || 
                 text.includes(`export var ${exportName}`);
        }
        return false;
      });
      
      if (exportStatement) {
        return { statement: exportStatement, type: 'named', name: exportName };
      }
    }
    
    return null;
  }
  
  private mergeProperties(targetExport: any, params: JSConfigMergerParams): void {
    const { propertiesToMerge, mergeStrategy } = params;
    
    // Get current properties from structure
    const currentProperties = this.extractCurrentPropertiesFromStructure(targetExport);
    
    // Merge properties based on strategy
    let mergedProperties: Record<string, any>;
    
    switch (mergeStrategy) {
      case 'deep':
        mergedProperties = merge(currentProperties, propertiesToMerge);
        break;
        
      case 'shallow':
        mergedProperties = { ...currentProperties, ...propertiesToMerge };
        break;
        
      case 'replace':
        mergedProperties = propertiesToMerge;
        break;
        
      default:
        throw new Error(`Unknown merge strategy: ${mergeStrategy}`);
    }
    
    // Update the statement with merged properties
    this.updateStatementWithMergedProperties(targetExport, mergedProperties);
  }
  
  private extractCurrentPropertiesFromStructure(targetExport: any): Record<string, any> {
    const properties: Record<string, any> = {};
    
    if (targetExport.type === 'default') {
      const structure = targetExport.statement.getStructure();
      if (structure.expression && typeof structure.expression === 'string') {
        try {
          const parsed = JSON.parse(structure.expression);
          return parsed;
        } catch (error) {
          // If not valid JSON, return empty object
          return {};
        }
      }
    } else if (targetExport.type === 'named') {
      const structure = targetExport.statement.getStructure();
      const declaration = structure.declarations?.find((d: any) => d.name === targetExport.name);
      
      if (declaration && declaration.initializer && typeof declaration.initializer === 'string') {
        try {
          const parsed = JSON.parse(declaration.initializer);
          return parsed;
        } catch (error) {
          // If not valid JSON, return empty object
          return {};
        }
      }
    }
    
    return properties;
  }
  
  private updateStatementWithMergedProperties(targetExport: any, properties: Record<string, any>): void {
    const mergedExpression = JSON.stringify(properties, null, 2);
    
    if (targetExport.type === 'default') {
      // Update default export
      const structure = targetExport.statement.getStructure();
      structure.expression = mergedExpression;
      targetExport.statement.set(structure);
    } else if (targetExport.type === 'named') {
      // Update named export
      const structure = targetExport.statement.getStructure();
      const declaration = structure.declarations?.find((d: any) => d.name === targetExport.name);
      
      if (declaration) {
        declaration.initializer = mergedExpression;
        targetExport.statement.set(structure);
      }
    }
  }
}
