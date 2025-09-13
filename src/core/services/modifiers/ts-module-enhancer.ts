/**
 * TypeScript Module Enhancer Modifier
 * 
 * Pure modifier that adds imports, statements, and declarations to TypeScript files.
 * Completely agnostic to what it's adding - all business logic comes from blueprint parameters.
 */

import { BasePureModifier } from './pure-modifier.js';
import { Project, SourceFile, ImportDeclaration, SyntaxKind } from 'ts-morph';

export interface TSModuleEnhancerParams {
  importsToAdd: Array<{
    name: string | string[];  // Import name(s)
    from: string;             // Import path
    type: 'import' | 'import type' | 'import * as';
  }>;
  statementsToAppend: Array<{
    type: 'interface' | 'type' | 'const' | 'function' | 'class' | 'enum' | 'raw';
    content: string;          // Raw TypeScript code
  }>;
  exportsToAdd: Array<{
    name: string;
    content: string;
  }>;
}

export class TSModuleEnhancer extends BasePureModifier {
  getName(): string {
    return 'ts-module-enhancer';
  }
  
  getDescription(): string {
    return 'Adds imports, statements, and declarations to TypeScript files';
  }
  
  validateParams(params: any): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }
    
    const { importsToAdd, statementsToAppend, exportsToAdd } = params;
    
    // Validate importsToAdd
    if (importsToAdd !== undefined) {
      if (!Array.isArray(importsToAdd)) {
        return false;
      }
      
      for (const importItem of importsToAdd) {
        if (!importItem || typeof importItem !== 'object') {
          return false;
        }
        
        if (typeof importItem.from !== 'string' || !importItem.from.trim()) {
          return false;
        }
        
        if (!['import', 'import type', 'import * as'].includes(importItem.type)) {
          return false;
        }
        
        if (importItem.type === 'import * as') {
          if (typeof importItem.name !== 'string' || !importItem.name.trim()) {
            return false;
          }
        } else {
          if (!importItem.name || (typeof importItem.name !== 'string' && !Array.isArray(importItem.name))) {
            return false;
          }
        }
      }
    }
    
    // Validate statementsToAppend
    if (statementsToAppend !== undefined) {
      if (!Array.isArray(statementsToAppend)) {
        return false;
      }
      
      for (const statement of statementsToAppend) {
        if (!statement || typeof statement !== 'object') {
          return false;
        }
        
        if (!['interface', 'type', 'const', 'function', 'class', 'enum', 'raw'].includes(statement.type)) {
          return false;
        }
        
        if (typeof statement.content !== 'string' || !statement.content.trim()) {
          return false;
        }
      }
    }
    
    // Validate exportsToAdd
    if (exportsToAdd !== undefined) {
      if (!Array.isArray(exportsToAdd)) {
        return false;
      }
      
      for (const exportItem of exportsToAdd) {
        if (!exportItem || typeof exportItem !== 'object') {
          return false;
        }
        
        if (typeof exportItem.name !== 'string' || !exportItem.name.trim()) {
          return false;
        }
        
        if (typeof exportItem.content !== 'string' || !exportItem.content.trim()) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  async transform(filePath: string, params: TSModuleEnhancerParams): Promise<void> {
    try {
      await this.validateFile(filePath);
      
      const content = await this.readFile(filePath);
      const project = new Project();
      const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });
      
      // Add imports
      if (params.importsToAdd && params.importsToAdd.length > 0) {
        this.addImports(sourceFile, params.importsToAdd);
      }
      
      // Add statements
      if (params.statementsToAppend && params.statementsToAppend.length > 0) {
        this.addStatements(sourceFile, params.statementsToAppend);
      }
      
      // Add exports
      if (params.exportsToAdd && params.exportsToAdd.length > 0) {
        this.addExports(sourceFile, params.exportsToAdd);
      }
      
      // Write the modified content back
      const modifiedContent = sourceFile.getFullText();
      await this.writeFile(filePath, modifiedContent);
      
    } catch (error) {
      this.handleError(error as Error, filePath, this.getName());
    }
  }
  
  private addImports(sourceFile: SourceFile, importsToAdd: TSModuleEnhancerParams['importsToAdd']): void {
    for (const importItem of importsToAdd) {
      // Check if import already exists
      const existingImports = sourceFile.getImportDeclarations();
      const existingImport = existingImports.find(imp => 
        imp.getModuleSpecifierValue() === importItem.from
      );
      
      if (existingImport) {
        // Add to existing import
        this.addToExistingImport(existingImport, importItem);
      } else {
        // Create new import
        this.createNewImport(sourceFile, importItem);
      }
    }
  }
  
  private addToExistingImport(existingImport: ImportDeclaration, importItem: TSModuleEnhancerParams['importsToAdd'][0]): void {
    if (importItem.type === 'import * as') {
      // Check if namespace import already exists
      const namespaceImport = existingImport.getNamespaceImport();
      const hasNamespace = namespaceImport?.getText() === importItem.name;
      
      if (!hasNamespace) {
        existingImport.setNamespaceImport(importItem.name as string);
      }
    } else {
      // Check if named imports already exist
      const namedImports = existingImport.getNamedImports();
      const names = Array.isArray(importItem.name) ? importItem.name : [importItem.name];
      
      for (const name of names) {
        const hasImport = namedImports.some(imp => imp.getName() === name);
        if (!hasImport) {
          existingImport.addNamedImport(name);
        }
      }
    }
  }
  
  private createNewImport(sourceFile: SourceFile, importItem: TSModuleEnhancerParams['importsToAdd'][0]): void {
    if (importItem.type === 'import * as') {
      sourceFile.addImportDeclaration({
        namespaceImport: importItem.name as string,
        moduleSpecifier: importItem.from
      });
    } else {
      const names = Array.isArray(importItem.name) ? importItem.name : [importItem.name];
      sourceFile.addImportDeclaration({
        namedImports: names,
        moduleSpecifier: importItem.from
      });
    }
  }
  
  private addStatements(sourceFile: SourceFile, statementsToAppend: TSModuleEnhancerParams['statementsToAppend']): void {
    for (const statement of statementsToAppend) {
      if (statement.type === 'raw') {
        // Add raw TypeScript code
        sourceFile.addStatements(statement.content);
      } else {
        // Add structured statement
        this.addStructuredStatement(sourceFile, statement);
      }
    }
  }
  
  private addStructuredStatement(sourceFile: SourceFile, statement: TSModuleEnhancerParams['statementsToAppend'][0]): void {
    // For now, just add the raw content as statements
    // The complex parsing can be improved later
    sourceFile.addStatements(statement.content);
  }
  
  private addExports(sourceFile: SourceFile, exportsToAdd: TSModuleEnhancerParams['exportsToAdd']): void {
    for (const exportItem of exportsToAdd) {
      // Add the export statement
      sourceFile.addStatements(`export ${exportItem.content};`);
    }
  }
  
  // Helper methods for parsing TypeScript content
  private extractNameFromContent(content: string): string {
    // Simple regex to extract name from TypeScript declarations
    const nameMatch = content.match(/(?:interface|type|const|function|class|enum)\s+(\w+)/);
    return nameMatch?.[1] || 'Unknown';
  }
  
  private extractTypeFromContent(content: string): string {
    // Extract type definition from type alias
    const typeMatch = content.match(/type\s+\w+\s*=\s*(.+)/);
    return typeMatch?.[1]?.trim() || 'any';
  }
  
  private extractInitializerFromContent(content: string): string {
    // Extract initializer from const declaration
    const initMatch = content.match(/const\s+\w+\s*=\s*(.+)/);
    return initMatch?.[1]?.trim() || 'undefined';
  }
  
  private extractReturnTypeFromContent(content: string): string {
    // Extract return type from function
    const returnMatch = content.match(/function\s+\w+[^:]*:\s*([^{]+)/);
    return returnMatch?.[1]?.trim() || 'void';
  }
  
  private extractFunctionBody(content: string): string {
    // Extract function body
    const bodyMatch = content.match(/function\s+\w+[^{]*\{([\s\S]*)\}/);
    return bodyMatch?.[1]?.trim() || '{}';
  }
  
  private parseInterfaceProperties(content: string): any[] {
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    return [];
  }
  
  private parseFunctionParameters(content: string): any[] {
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    return [];
  }
  
  private parseClassProperties(content: string): any[] {
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    return [];
  }
  
  private parseClassMethods(content: string): any[] {
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    return [];
  }
  
  private parseEnumMembers(content: string): any[] {
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    return [];
  }
}
