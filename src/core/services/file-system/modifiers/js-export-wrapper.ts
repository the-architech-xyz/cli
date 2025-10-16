/**
 * JavaScript Export Wrapper Modifier
 * 
 * Wraps module.exports or export default with a higher-order function.
 * This is essential for integrating services like Sentry, Bundle Analyzer, etc.
 * 
 * Example:
 * Before:
 *   const nextConfig = {...};
 *   module.exports = nextConfig;
 * 
 * After:
 *   const withSentryConfig = require('@sentry/nextjs');
 *   const nextConfig = {...};
 *   module.exports = withSentryConfig(nextConfig, options);
 */

import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Project, SyntaxKind, VariableDeclarationKind } from 'ts-morph';

export interface JsExportWrapperParams extends ModifierParams {
  wrapperFunction: string; // Name of the wrapper function (e.g., 'withSentryConfig')
  wrapperImport: {
    name: string; // Name to import (e.g., 'withSentryConfig')
    from: string; // Module to import from (e.g., '@sentry/nextjs')
    isDefault?: boolean; // Whether it's a default import
  };
  wrapperOptions?: Record<string, any>; // Options to pass as second argument
}

export class JsExportWrapperModifier extends BaseModifier {
  getDescription(): string {
    return 'Wraps module exports with higher-order functions';
  }

  getSupportedFileTypes(): string[] {
    return ['js', 'ts', 'mjs', 'cjs'];
  }

  getParamsSchema(): any {
    return {
      type: 'object',
      properties: {
        wrapperFunction: {
          type: 'string',
          description: 'Name of the wrapper function'
        },
        wrapperImport: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            from: { type: 'string' },
            isDefault: { type: 'boolean', default: false }
          },
          required: ['name', 'from']
        },
        wrapperOptions: {
          type: 'object',
          description: 'Options object to pass to wrapper function'
        }
      },
      required: ['wrapperFunction', 'wrapperImport']
    };
  }

  async execute(
    filePath: string,
    params: JsExportWrapperParams,
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

      // Read existing file
      const existingContent = await this.readFile(filePath);

      // Create ts-morph project
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          allowJs: true,
          module: 99, // ESNext
        }
      });

      const sourceFile = project.createSourceFile(filePath, existingContent, { overwrite: true });

      // 1. Add import at the top
      this.addImport(sourceFile, params.wrapperImport);

      // 2. Find and wrap the export
      const wrapped = this.wrapExport(sourceFile, params);

      if (!wrapped) {
        return {
          success: false,
          error: `Could not find export to wrap in ${filePath}`
        };
      }

      // Get the modified content
      const modifiedContent = sourceFile.getFullText();

      // Write back to file
      await this.writeFile(filePath, modifiedContent);

      return {
        success: true,
        message: `Successfully wrapped export in ${filePath} with ${params.wrapperFunction}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add import statement
   */
  private addImport(sourceFile: any, importSpec: JsExportWrapperParams['wrapperImport']): void {
    const { name, from, isDefault } = importSpec;

    // Check if import already exists
    const existingImport = sourceFile.getImportDeclaration((imp: any) => 
      imp.getModuleSpecifierValue() === from
    );

    if (existingImport) {
      return; // Import already exists
    }

    // Determine if we should use require or import
    const hasRequire = sourceFile.getText().includes('require(');
    const hasModuleExports = sourceFile.getText().includes('module.exports');

    if (hasRequire || hasModuleExports) {
      // Use CommonJS style
      const requireStatement = isDefault
        ? `const ${name} = require('${from}');`
        : `const { ${name} } = require('${from}');`;
      
      sourceFile.insertText(0, requireStatement + '\n');
    } else {
      // Use ES module style
      if (isDefault) {
        sourceFile.addImportDeclaration({
          defaultImport: name,
          moduleSpecifier: from
        });
      } else {
        sourceFile.addImportDeclaration({
          namedImports: [name],
          moduleSpecifier: from
        });
      }
    }
  }

  /**
   * Wrap the export statement
   */
  private wrapExport(sourceFile: any, params: JsExportWrapperParams): boolean {
    const { wrapperFunction, wrapperOptions } = params;

    // Try to find module.exports (CommonJS)
    const moduleExports = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)
      .find((exp: any) => {
        const left = exp.getLeft();
        return left.getText() === 'module.exports';
      });

    if (moduleExports) {
      const currentValue = moduleExports.getRight().getText();
      const optionsStr = wrapperOptions 
        ? `, ${JSON.stringify(wrapperOptions, null, 2)}`
        : '';
      const wrappedValue = `${wrapperFunction}(${currentValue}${optionsStr})`;
      moduleExports.getRight().replaceWithText(wrappedValue);
      return true;
    }

    // Try to find export default (ES modules)
    const exportDefault = sourceFile.getDefaultExportSymbol();
    if (exportDefault) {
      const exportAssignment = sourceFile.getStatements()
        .find((stmt: any) => stmt.getKind() === SyntaxKind.ExportAssignment);

      if (exportAssignment) {
        const currentExpr = exportAssignment.getExpression().getText();
        const optionsStr = wrapperOptions
          ? `, ${JSON.stringify(wrapperOptions, null, 2)}`
          : '';
        const wrappedExpr = `${wrapperFunction}(${currentExpr}${optionsStr})`;
        exportAssignment.getExpression().replaceWithText(wrappedExpr);
        return true;
      }
    }

    return false;
  }
}
