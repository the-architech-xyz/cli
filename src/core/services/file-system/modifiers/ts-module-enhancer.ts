/**
 * TypeScript Module Enhancer Modifier
 * 
 * Enhances TypeScript modules by:
 * - Adding imports (named, default, namespace, type imports)
 * - Appending top-level statements (functions, constants, interfaces, types)
 * 
 * This is essential for integration modules that need to extend existing TypeScript files
 * with new functionality without replacing the entire file.
 */

import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/types';
import { Project, SourceFile, SyntaxKind, StructureKind } from 'ts-morph';

interface ImportToAdd {
  name: string;
  from: string;
  type?: 'import' | 'type';
  isDefault?: boolean;
  isNamespace?: boolean;
}

interface StatementToAppend {
  type: 'raw' | 'function' | 'const' | 'interface' | 'type';
  content: string;
}

export class TsModuleEnhancerModifier extends BaseModifier {
  getDescription(): string {
    return 'Enhances TypeScript modules by adding imports and top-level statements';
  }

  getSupportedFileTypes(): string[] {
    return ['ts', 'tsx'];
  }

  getParamsSchema(): any {
    return {
      type: 'object',
      properties: {
        importsToAdd: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              from: { type: 'string' },
              type: { type: 'string', enum: ['import', 'type'] },
              isDefault: { type: 'boolean' },
              isNamespace: { type: 'boolean' }
            },
            required: ['name', 'from']
          },
          description: 'Array of imports to add to the module'
        },
        statementsToAppend: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['raw', 'function', 'const', 'interface', 'type'] },
              content: { type: 'string' }
            },
            required: ['type', 'content']
          },
          description: 'Array of statements to append to the module'
        },
        preserveExisting: {
          type: 'boolean',
          default: true,
          description: 'Whether to preserve existing imports and statements'
        }
      }
    };
  }

  async execute(
    filePath: string,
    params: ModifierParams,
    context: ProjectContext
  ): Promise<ModifierResult> {
    try {
      // Validate parameters
      const validation = this.validateParams(params);
      if (!validation.valid) {
        return {
          success: false,
          error: `Parameter validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Check if file exists
      const fileExists = this.engine.fileExists(filePath);
      if (!fileExists) {
        return {
          success: false,
          error: `Target file ${filePath} does not exist`
        };
      }

      // Read the existing TypeScript file
      const existingContent = await this.readFile(filePath);
      
      // Create a ts-morph project for AST manipulation
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          target: 99, // ESNext
          module: 99, // ESNext
        }
      });

      // Add the source file to the project
      const sourceFile = project.createSourceFile(filePath, existingContent, { overwrite: true });

      // Extract parameters
      const importsToAdd: ImportToAdd[] = params.importsToAdd || [];
      const statementsToAppend: StatementToAppend[] = params.statementsToAppend || [];
      const preserveExisting = params.preserveExisting !== false;

      // Add imports
      if (importsToAdd.length > 0) {
        this.addImports(sourceFile, importsToAdd);
      }

      // Append statements
      if (statementsToAppend.length > 0) {
        this.appendStatements(sourceFile, statementsToAppend);
      }

      // Get the modified content
      const modifiedContent = sourceFile.getFullText();

      // Write the modified content back
      await this.writeFile(filePath, modifiedContent);

      return {
        success: true,
        message: `TypeScript module enhanced: ${filePath} (added ${importsToAdd.length} imports, ${statementsToAppend.length} statements)`
      };
    } catch (error) {
      return {
        success: false,
        error: `TypeScript module enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add imports to the source file
   */
  private addImports(sourceFile: SourceFile, imports: ImportToAdd[]): void {
    for (const importDef of imports) {
      // Check if import already exists
      const existingImport = sourceFile.getImportDeclaration(
        (imp) => imp.getModuleSpecifierValue() === importDef.from
      );

      if (existingImport) {
        // Import from this module already exists, check if we need to add the named import
        if (importDef.isDefault) {
          if (!existingImport.getDefaultImport()) {
            existingImport.setDefaultImport(importDef.name);
          }
        } else if (importDef.isNamespace) {
          if (!existingImport.getNamespaceImport()) {
            existingImport.setNamespaceImport(importDef.name);
          }
        } else {
          // Named import
          const namedImports = existingImport.getNamedImports();
          const importExists = namedImports.some(
            (namedImport) => namedImport.getName() === importDef.name
          );
          
          if (!importExists) {
            existingImport.addNamedImport(importDef.name);
          }
        }
      } else {
        // Create new import declaration
        if (importDef.isDefault) {
          sourceFile.addImportDeclaration({
            moduleSpecifier: importDef.from,
            defaultImport: importDef.name
          });
        } else if (importDef.isNamespace) {
          sourceFile.addImportDeclaration({
            moduleSpecifier: importDef.from,
            namespaceImport: importDef.name
          });
        } else if (importDef.type === 'type') {
          sourceFile.addImportDeclaration({
            moduleSpecifier: importDef.from,
            namedImports: [{ name: importDef.name, isTypeOnly: true }],
            isTypeOnly: true
          });
        } else {
          sourceFile.addImportDeclaration({
            moduleSpecifier: importDef.from,
            namedImports: [importDef.name]
          });
        }
      }
    }
  }

  /**
   * Append statements to the source file
   */
  private appendStatements(sourceFile: SourceFile, statements: StatementToAppend[]): void {
    for (const statement of statements) {
      // Add the statement as raw text at the end of the file
      // ts-morph will handle formatting
      sourceFile.addStatements(statement.content);
    }
  }
}
