/**
 * JSX Wrapper Modifier
 * 
 * Wraps JSX files with React imports and other JSX-specific modifications
 * using simple string manipulation for JSX files.
 */

import { ModifierDefinition, ProjectContext } from '@thearchitech.xyz/types';

export class JSXWrapperModifier {
  /**
   * Handler function for the modifier
   */
  static async handler(
    content: string, 
    params: any, 
    context: ProjectContext
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      let enhancedContent = content;

      // Add React import if not already present
      if (params.addReactImport !== false && !content.includes('import React')) {
        enhancedContent = `import React from 'react';\n${enhancedContent}`;
      }

      // Add additional imports if specified
      if (params.imports) {
        let importStatements = '';
        for (const importSpec of params.imports) {
          if (importSpec.type === 'default') {
            importStatements += `import ${importSpec.name} from '${importSpec.from}';\n`;
          } else if (importSpec.type === 'named') {
            importStatements += `import { ${importSpec.name} } from '${importSpec.from}';\n`;
          } else if (importSpec.type === 'all') {
            importStatements += `import * as ${importSpec.name} from '${importSpec.from}';\n`;
          }
        }
        enhancedContent = importStatements + enhancedContent;
      }

      // Add wrapper component if specified
      if (params.wrapper) {
        const wrapperName = params.wrapper.name || 'Wrapper';
        const wrapperProps = params.wrapper.props || '';
        const wrapperContent = params.wrapper.content || content;
        
        enhancedContent = `const ${wrapperName} = (${wrapperProps}) => {\n  return (\n    ${wrapperContent}\n  );\n};\n\nexport default ${wrapperName};`;
      }

      // Add exports if specified
      if (params.exports) {
        for (const exportSpec of params.exports) {
          if (exportSpec.type === 'default') {
            enhancedContent += `\n\nexport default ${exportSpec.value};`;
          } else if (exportSpec.type === 'named') {
            enhancedContent += `\n\nexport { ${exportSpec.value} };`;
          }
        }
      }

      // Add TypeScript types if specified
      if (params.types) {
        let typeStatements = '';
        for (const typeSpec of params.types) {
          if (typeSpec.type === 'interface') {
            typeStatements += `interface ${typeSpec.name} {\n${typeSpec.properties || ''}\n}\n\n`;
          } else if (typeSpec.type === 'type') {
            typeStatements += `type ${typeSpec.name} = ${typeSpec.value};\n\n`;
          }
        }
        enhancedContent = typeStatements + enhancedContent;
      }

      return {
        success: true,
        content: enhancedContent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to wrap JSX: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export the modifier definition
export const jsxWrapperModifier: ModifierDefinition = {
  description: 'Wraps JSX files with React imports and other JSX-specific modifications',
  handler: JSXWrapperModifier.handler,
  paramsSchema: {},
  supportedFileTypes: ['jsx', 'tsx']
};
