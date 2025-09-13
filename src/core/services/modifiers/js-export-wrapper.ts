/**
 * JS Export Wrapper Modifier
 * 
 * Pure modifier that wraps JavaScript/TypeScript exports with function calls.
 * Completely agnostic to what function it's wrapping - all business logic
 * comes from the blueprint parameters.
 */

import { BasePureModifier } from './pure-modifier.js';
import { Project, SourceFile } from 'ts-morph';

export interface JSExportWrapperParams {
  exportToWrap: 'default' | string; // Which export to wrap
  wrapperFunction: {
    name: string;        // Function name (e.g., 'withSentryConfig')
    importFrom: string;  // Import path (e.g., '@sentry/nextjs')
  };
  wrapperOptions: Record<string, any>; // Options to pass to wrapper
}

export class JSExportWrapper extends BasePureModifier {
  getName(): string {
    return 'js-export-wrapper';
  }
  
  getDescription(): string {
    return 'Wraps JavaScript/TypeScript exports with function calls';
  }
  
  validateParams(params: any): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }
    
    const { exportToWrap, wrapperFunction, wrapperOptions } = params;
    
    // Validate exportToWrap
    if (typeof exportToWrap !== 'string') {
      return false;
    }
    
    // Validate wrapperFunction
    if (!wrapperFunction || typeof wrapperFunction !== 'object') {
      return false;
    }
    
    if (typeof wrapperFunction.name !== 'string' || !wrapperFunction.name.trim()) {
      return false;
    }
    
    if (typeof wrapperFunction.importFrom !== 'string' || !wrapperFunction.importFrom.trim()) {
      return false;
    }
    
    // Validate wrapperOptions
    if (wrapperOptions !== undefined && typeof wrapperOptions !== 'object') {
      return false;
    }
    
    return true;
  }
  
  async transform(filePath: string, params: JSExportWrapperParams): Promise<void> {
    try {
      await this.validateFile(filePath);
      
      const content = await this.readFile(filePath);
      const project = new Project();
      const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });
      
      // Add the import for the wrapper function
      this.addWrapperImport(sourceFile, params.wrapperFunction);
      
      // Wrap the specified export
      this.wrapExport(sourceFile, params);
      
      // Write the modified content back
      const modifiedContent = sourceFile.getFullText();
      await this.writeFile(filePath, modifiedContent);
      
    } catch (error) {
      this.handleError(error as Error, filePath, this.getName());
    }
  }
  
  private addWrapperImport(sourceFile: SourceFile, wrapperFunction: { name: string; importFrom: string }): void {
    // Check if import already exists
    const existingImports = sourceFile.getImportDeclarations();
    const existingImport = existingImports.find(imp => 
      imp.getModuleSpecifierValue() === wrapperFunction.importFrom
    );
    
    if (existingImport) {
      // Add to existing import
      const namedImports = existingImport.getNamedImports();
      const hasFunction = namedImports.some(imp => imp.getName() === wrapperFunction.name);
      
      if (!hasFunction) {
        existingImport.addNamedImport(wrapperFunction.name);
      }
    } else {
      // Create new import
      sourceFile.addImportDeclaration({
        namedImports: [wrapperFunction.name],
        moduleSpecifier: wrapperFunction.importFrom
      });
    }
  }
  
  private wrapExport(sourceFile: SourceFile, params: JSExportWrapperParams): void {
    const { exportToWrap, wrapperFunction, wrapperOptions } = params;
    
    if (exportToWrap === 'default') {
      this.wrapDefaultExport(sourceFile, wrapperFunction, wrapperOptions);
    } else {
      this.wrapNamedExport(sourceFile, exportToWrap, wrapperFunction, wrapperOptions);
    }
  }
  
  private wrapDefaultExport(
    sourceFile: SourceFile, 
    wrapperFunction: { name: string; importFrom: string },
    wrapperOptions: Record<string, any>
  ): void {
    // Find default export using getStatements()
    const statements = sourceFile.getStatements();
    const defaultExport = statements.find(s => s.getKind() === 278); // ExportAssignment
    
    if (!defaultExport) {
      throw new Error('No default export found to wrap');
    }
    
    // Get the current default export expression as text
    const exportText = defaultExport.getText();
    const exportMatch = exportText.match(/export\s+default\s+([\s\S]+?);?$/);
    
    if (!exportMatch || !exportMatch[1]) {
      throw new Error('Default export has no expression to wrap');
    }
    
    const exportExpression = exportMatch[1].trim();
    
    // Create the wrapper function call
    const wrapperCall = this.createWrapperCall(
      wrapperFunction.name,
      exportExpression,
      wrapperOptions
    );
    
    // Replace the default export
    defaultExport.replaceWithText(`export default ${wrapperCall};`);
  }
  
  private wrapNamedExport(
    sourceFile: SourceFile,
    exportName: string,
    wrapperFunction: { name: string; importFrom: string },
    wrapperOptions: Record<string, any>
  ): void {
    // Find the named export using getStatements()
    const statements = sourceFile.getStatements();
    const exportStatement = statements.find(s => {
      if (s.getKind() === 244) { // VariableStatement
        const text = s.getText();
        return text.includes(`export const ${exportName}`) || text.includes(`export let ${exportName}`) || text.includes(`export var ${exportName}`);
      }
      return false;
    });
    
    if (!exportStatement) {
      throw new Error(`Named export '${exportName}' not found to wrap`);
    }
    
    // Get the current export expression as text
    const exportText = exportStatement.getText();
    const exportMatch = exportText.match(/export\s+(?:const|let|var)\s+\w+\s*=\s*(.+);?$/);
    
    if (!exportMatch || !exportMatch[1]) {
      throw new Error(`Named export '${exportName}' has no expression to wrap`);
    }
    
    const exportExpression = exportMatch[1].trim();
    
    // Create the wrapper function call
    const wrapperCall = this.createWrapperCall(
      wrapperFunction.name,
      exportExpression,
      wrapperOptions
    );
    
    // Replace the export
    exportStatement.replaceWithText(`export const ${exportName} = ${wrapperCall};`);
  }
  
  private createWrapperCall(
    functionName: string,
    expression: string,
    options: Record<string, any>
  ): string {
    const optionsString = this.serializeOptions(options);
    return `${functionName}(${expression}${optionsString ? `, ${optionsString}` : ''})`;
  }
  
  private serializeOptions(options: Record<string, any>): string {
    if (!options || Object.keys(options).length === 0) {
      return '';
    }
    
    // Simple serialization - in a real implementation, you might want more sophisticated handling
    return JSON.stringify(options, null, 2);
  }
}
