/**
 * TypeScript Module Enhancer Modifier
 * 
 * Enhances TypeScript modules by adding imports, exports, and other modifications
 * using ts-morph for AST manipulation.
 */

import { Project, SourceFile, ImportDeclaration, ExportDeclaration } from 'ts-morph';
import { ModifierDefinition, ProjectContext } from '@thearchitech.xyz/types';

export class TSModuleEnhancerModifier {
  /**
   * Handler function for the modifier
   */
  static async handler(
    content: string, 
    params: any, 
    context: ProjectContext
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      // Create a temporary project
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          target: 99, // Latest
          module: 99, // Latest
          moduleResolution: 99, // Latest
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: false
        }
      });

      // Create a source file from the content
      const sourceFile = project.createSourceFile('temp.ts', content);

      // Apply enhancements based on parameters
      if (params.importsToAdd) {
        TSModuleEnhancerModifier.addImports(sourceFile, params.importsToAdd);
      }

      if (params.exportsToAdd) {
        TSModuleEnhancerModifier.addExports(sourceFile, params.exportsToAdd);
      }

      if (params.statementsToAppend) {
        TSModuleEnhancerModifier.appendStatements(sourceFile, params.statementsToAppend);
      }

      if (params.statementsToPrepend) {
        TSModuleEnhancerModifier.prependStatements(sourceFile, params.statementsToPrepend);
      }

      if (params.functionsToAdd) {
        TSModuleEnhancerModifier.addFunctions(sourceFile, params.functionsToAdd);
      }

      if (params.classesToAdd) {
        TSModuleEnhancerModifier.addClasses(sourceFile, params.classesToAdd);
      }

      if (params.interfacesToAdd) {
        TSModuleEnhancerModifier.addInterfaces(sourceFile, params.interfacesToAdd);
      }

      if (params.typesToAdd) {
        TSModuleEnhancerModifier.addTypes(sourceFile, params.typesToAdd);
      }

      // Get the enhanced content
      const enhancedContent = sourceFile.getFullText();

      return {
        success: true,
        content: enhancedContent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to enhance TypeScript module: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add imports to the source file
   */
  private static addImports(sourceFile: SourceFile, imports: any[]): void {
    for (const importSpec of imports) {
      if (importSpec.type === 'import') {
        const importDeclaration = sourceFile.addImportDeclaration({
          moduleSpecifier: importSpec.from,
          namedImports: [{ name: importSpec.name }]
        });
      } else if (importSpec.type === 'defaultImport') {
        const importDeclaration = sourceFile.addImportDeclaration({
          moduleSpecifier: importSpec.from,
          defaultImport: importSpec.name
        });
      } else if (importSpec.type === 'namespaceImport') {
        const importDeclaration = sourceFile.addImportDeclaration({
          moduleSpecifier: importSpec.from,
          namespaceImport: importSpec.name
        });
      }
    }
  }

  /**
   * Add exports to the source file
   */
  private static addExports(sourceFile: SourceFile, exports: any[]): void {
    for (const exportSpec of exports) {
      if (exportSpec.type === 'namedExport') {
        sourceFile.addExportDeclaration({
          moduleSpecifier: exportSpec.from,
          namedExports: [{ name: exportSpec.name }]
        });
      } else if (exportSpec.type === 'defaultExport') {
        sourceFile.addExportDeclaration({
          moduleSpecifier: exportSpec.from
        });
      }
    }
  }

  /**
   * Append statements to the source file
   */
  private static appendStatements(sourceFile: SourceFile, statements: any[]): void {
    for (const statement of statements) {
      if (statement.type === 'function') {
        sourceFile.addFunction({
          name: statement.name,
          parameters: statement.parameters || [],
          returnType: statement.returnType,
          statements: statement.body || '{}',
          isExported: statement.exported || false
        });
      } else if (statement.type === 'const') {
        sourceFile.addVariableStatement({
          declarations: [{
            name: statement.name,
            initializer: statement.value
          }],
          isExported: statement.exported || false
        });
      } else if (statement.type === 'interface') {
        sourceFile.addInterface({
          name: statement.name,
          properties: statement.properties || [],
          isExported: statement.exported || false
        });
      } else if (statement.type === 'type') {
        sourceFile.addTypeAlias({
          name: statement.name,
          type: statement.type,
          isExported: statement.exported || false
        });
      } else if (statement.type === 'class') {
        sourceFile.addClass({
          name: statement.name,
          properties: statement.properties || [],
          methods: statement.methods || [],
          isExported: statement.exported || false
        });
      } else if (statement.type === 'raw') {
        // Add raw code
        sourceFile.addStatements(statement.code);
      }
    }
  }

  /**
   * Prepend statements to the source file
   */
  private static prependStatements(sourceFile: SourceFile, statements: any[]): void {
    for (const statement of statements) {
      if (statement.type === 'raw') {
        sourceFile.insertStatements(0, statement.code);
      }
    }
  }

  /**
   * Add functions to the source file
   */
  private static addFunctions(sourceFile: SourceFile, functions: any[]): void {
    for (const func of functions) {
      sourceFile.addFunction({
        name: func.name,
        parameters: func.parameters || [],
        returnType: func.returnType,
        statements: func.body || '{}',
        isExported: func.exported || false
      });
    }
  }

  /**
   * Add classes to the source file
   */
  private static addClasses(sourceFile: SourceFile, classes: any[]): void {
    for (const cls of classes) {
      sourceFile.addClass({
        name: cls.name,
        properties: cls.properties || [],
        methods: cls.methods || [],
        isExported: cls.exported || false
      });
    }
  }

  /**
   * Add interfaces to the source file
   */
  private static addInterfaces(sourceFile: SourceFile, interfaces: any[]): void {
    for (const iface of interfaces) {
      sourceFile.addInterface({
        name: iface.name,
        properties: iface.properties || [],
        isExported: iface.exported || false
      });
    }
  }

  /**
   * Add types to the source file
   */
  private static addTypes(sourceFile: SourceFile, types: any[]): void {
    for (const type of types) {
      sourceFile.addTypeAlias({
        name: type.name,
        type: type.type,
        isExported: type.exported || false
      });
    }
  }
}

// Export the modifier definition
export const tsModuleEnhancerModifier: ModifierDefinition = {
  description: 'Enhances TypeScript modules with imports, exports, and other modifications',
  handler: TSModuleEnhancerModifier.handler,
  paramsSchema: {},
  supportedFileTypes: ['ts', 'tsx']
};
