/**
 * JavaScript Export Wrapper Modifier
 * 
 * Wraps JavaScript files with export statements and other modifications
 * using simple string manipulation for JavaScript files.
 */

import { ModifierDefinition, ProjectContext } from '@thearchitech.xyz/types';

export class JSExportWrapperModifier {
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

      // Add exports if specified
      if (params.exports) {
        for (const exportSpec of params.exports) {
          if (exportSpec.type === 'default') {
            enhancedContent += `\n\nexport default ${exportSpec.value};`;
          } else if (exportSpec.type === 'named') {
            enhancedContent += `\n\nexport { ${exportSpec.value} };`;
          } else if (exportSpec.type === 'all') {
            enhancedContent += `\n\nexport * from '${exportSpec.from}';`;
          }
        }
      }

      // Add imports if specified
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

      // Add wrapper function if specified
      if (params.wrapper) {
        const wrapperFunction = params.wrapper.function || 'wrapper';
        const wrapperContent = params.wrapper.content || content;
        
        enhancedContent = `function ${wrapperFunction}() {\n${wrapperContent}\n}\n\nexport default ${wrapperFunction};`;
      }

      // Add module.exports if specified
      if (params.moduleExports) {
        for (const exportSpec of params.moduleExports) {
          if (exportSpec.type === 'default') {
            enhancedContent += `\n\nmodule.exports = ${exportSpec.value};`;
          } else if (exportSpec.type === 'named') {
            enhancedContent += `\n\nmodule.exports.${exportSpec.name} = ${exportSpec.value};`;
          }
        }
      }

      // Add CommonJS exports if specified
      if (params.commonjs) {
        for (const exportSpec of params.commonjs) {
          if (exportSpec.type === 'default') {
            enhancedContent += `\n\nexports.default = ${exportSpec.value};`;
          } else if (exportSpec.type === 'named') {
            enhancedContent += `\n\nexports.${exportSpec.name} = ${exportSpec.value};`;
          }
        }
      }

      return {
        success: true,
        content: enhancedContent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to wrap JavaScript exports: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export the modifier definition
export const jsExportWrapperModifier: ModifierDefinition = {
  description: 'Wraps JavaScript files with export statements and other modifications',
  handler: JSExportWrapperModifier.handler,
  paramsSchema: {},
  supportedFileTypes: ['js', 'jsx']
};
