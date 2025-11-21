/**
 * JSX Children Wrapper Modifier
 * 
 * Wraps {children} in React/Next.js components with provider components.
 * This is essential for adding global providers like AuthProvider, ThemeProvider, etc.
 * 
 * Example:
 * Before:
 *   <body>{children}</body>
 * 
 * After:
 *   <body>
 *     <ThemeProvider attribute="class">
 *       <AuthProvider>
 *         {children}
 *       </AuthProvider>
 *     </ThemeProvider>
 *   </body>
 */

import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Project, SyntaxKind, JsxElement, JsxSelfClosingElement } from 'ts-morph';

export interface ProviderSpec {
  component: string; // Component name (e.g., 'ThemeProvider')
  import: {
    name: string; // Name to import
    from: string; // Module path
    isDefault?: boolean;
  };
  props?: Record<string, string | boolean | number>; // Props for the provider
}

export interface JsxChildrenWrapperParams extends ModifierParams {
  providers: ProviderSpec[]; // Array of providers to wrap (innermost first)
  targetElement?: string; // Element containing children (default: 'body')
}

export class JsxChildrenWrapperModifier extends BaseModifier {
  getDescription(): string {
    return 'Wraps {children} in JSX components with provider components';
  }

  getSupportedFileTypes(): string[] {
    return ['tsx', 'jsx'];
  }

  getParamsSchema(): any {
    return {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              import: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  from: { type: 'string' },
                  isDefault: { type: 'boolean', default: false }
                },
                required: ['name', 'from']
              },
              props: { type: 'object' }
            },
            required: ['component', 'import']
          }
        },
        targetElement: {
          type: 'string',
          default: 'body',
          description: 'HTML element that contains {children}'
        }
      },
      required: ['providers']
    };
  }

  async execute(
    filePath: string,
    params: JsxChildrenWrapperParams,
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

      if (!params.providers || params.providers.length === 0) {
        return {
          success: false,
          error: 'No providers specified'
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

      // Create ts-morph project with JSX support
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          jsx: 4, // React JSX
          target: 99, // ESNext
          module: 99, // ESNext
        }
      });

      const sourceFile = project.createSourceFile(filePath, existingContent, { overwrite: true });

      // 1. Add imports for all providers
      params.providers.forEach(provider => {
        this.addProviderImport(sourceFile, provider.import);
      });

      // 2. Find and wrap children
      const targetElement = params.targetElement || 'body';
      const wrapped = this.wrapChildren(sourceFile, targetElement, params.providers);

      if (!wrapped) {
        return {
          success: false,
          error: `Could not find <${targetElement}>{children}</${targetElement}> pattern in ${filePath}`
        };
      }

      // Get the modified content
      const modifiedContent = sourceFile.getFullText();

      // Write back to file
      await this.writeFile(filePath, modifiedContent);

      return {
        success: true,
        message: `Successfully wrapped {children} with ${params.providers.length} provider(s) in ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add import for a provider
   */
  private addProviderImport(sourceFile: any, importSpec: ProviderSpec['import']): void {
    const { name, from, isDefault } = importSpec;

    // Check if import already exists
    const existingImport = sourceFile.getImportDeclaration((imp: any) =>
      imp.getModuleSpecifierValue() === from
    );

    if (existingImport) {
      // Check if this specific import is already there
      if (isDefault) {
        if (existingImport.getDefaultImport()?.getText() === name) return;
      } else {
        const namedImport = existingImport.getNamedImports()
          .find((ni: any) => ni.getName() === name);
        if (namedImport) return;
      }
    }

    // Add new import
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

  /**
   * Wrap children with providers
   */
  private wrapChildren(
    sourceFile: any,
    targetElement: string,
    providers: ProviderSpec[]
  ): boolean {
    let found = false;

    // Find all JSX elements with the target tag name
    const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);

    // If file is empty or has no JSX elements, create default structure
    if (jsxElements.length === 0 && targetElement === 'body') {
      return this.createDefaultNextJsLayout(sourceFile, providers);
    }

    for (const element of jsxElements) {
      const openingElement = element.getOpeningElement();
      const tagName = openingElement.getTagNameNode().getText();

      if (tagName === targetElement) {
        // Helper to recursively find {children} expression
        const findChildrenExpression = (node: any): any => {
          if (!node) return null;
          
          if (node.getKind() === SyntaxKind.JsxExpression) {
            const expr = node.getExpression();
            if (expr && expr.getText() === 'children') {
              return node;
            }
          }
          
          // Check nested JSX elements
          if (node.getKind() === SyntaxKind.JsxElement) {
            const nestedChildren = node.getJsxChildren();
            for (const nestedChild of nestedChildren) {
              const found = findChildrenExpression(nestedChild);
              if (found) return found;
            }
          }
          
          return null;
        };

        // Search through all children of the body element
        const children = element.getJsxChildren();
        let childrenExpression: any = null;
        
        for (const child of children) {
          childrenExpression = findChildrenExpression(child);
          if (childrenExpression) break;
        }
        
        if (childrenExpression) {
          // Build the wrapped structure
          const wrappedJsx = this.buildWrappedStructure(providers);
          
          // Replace {children} with wrapped structure
          childrenExpression.replaceWithText(wrappedJsx);
          found = true;
          break;
        }
      }
    }

    return found;
  }

  /**
   * Create default Next.js layout structure when file is empty
   */
  private createDefaultNextJsLayout(
    sourceFile: any,
    providers: ProviderSpec[]
  ): boolean {
    try {
      // Build wrapped children structure
      const wrappedChildren = this.buildWrappedStructure(providers);

      // Create default Next.js App Router layout structure
      const defaultLayout = `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
${wrappedChildren.split('\n').map((line: string) => `        ${line}`).join('\n')}
      </body>
    </html>
  );
}
`;

      // Replace entire file content
      sourceFile.replaceWithText(defaultLayout);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build the wrapped JSX structure
   */
  private buildWrappedStructure(providers: ProviderSpec[]): string {
    let result = '{children}';

    // Wrap from innermost to outermost (reverse order)
    for (let i = providers.length - 1; i >= 0; i--) {
      const provider = providers[i];
      if (!provider) continue; // TypeScript null check
      
      const propsStr = this.buildPropsString(provider.props || {});
      
      result = `
        <${provider.component}${propsStr}>
          ${result}
        </${provider.component}>`;
    }

    return result.trim();
  }

  /**
   * Build props string for JSX
   */
  private buildPropsString(props: Record<string, any>): string {
    const propEntries = Object.entries(props);
    if (propEntries.length === 0) return '';

    const propStrings = propEntries.map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : '';
      } else if (typeof value === 'number') {
        return `${key}={${value}}`;
      } else {
        return `${key}={${JSON.stringify(value)}}`;
      }
    }).filter(Boolean);

    return propStrings.length > 0 ? ' ' + propStrings.join(' ') : '';
  }
}
