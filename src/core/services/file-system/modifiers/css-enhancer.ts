/**
 * CSS Enhancer Modifier
 * 
 * Enhances CSS files by adding styles, variables, and other modifications
 */

import { ModifierDefinition, ProjectContext } from '@thearchitech.xyz/types';

export class CSSEnhancerModifier {
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

      // Add CSS variables if specified
      if (params.variables) {
        const variables = Object.entries(params.variables)
          .map(([key, value]) => `  --${key}: ${value};`)
          .join('\n');
        
        // Add variables at the beginning of the file
        enhancedContent = `:root {\n${variables}\n}\n\n${enhancedContent}`;
      }

      // Add styles if specified
      if (params.styles) {
        enhancedContent += '\n\n' + params.styles;
      }

      // Add imports if specified
      if (params.imports) {
        const imports = params.imports
          .map((importPath: string) => `@import "${importPath}";`)
          .join('\n');
        
        enhancedContent = imports + '\n\n' + enhancedContent;
      }

      // Add utility classes if specified
      if (params.utilities) {
        const utilities = Object.entries(params.utilities)
          .map(([className, styles]) => `.${className} {\n  ${styles}\n}`)
          .join('\n\n');
        
        enhancedContent += '\n\n' + utilities;
      }

      return {
        success: true,
        content: enhancedContent
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const cssEnhancerModifier: ModifierDefinition = {
  description: 'Enhances CSS files by adding variables, styles, and utilities',
  handler: CSSEnhancerModifier.handler,
  supportedFileTypes: ['.css', '.scss', '.sass'],
  paramsSchema: {
    type: 'object',
    properties: {
      variables: {
        type: 'object',
        description: 'CSS custom properties to add'
      },
      styles: {
        type: 'string',
        description: 'Additional CSS styles to append'
      },
      imports: {
        type: 'array',
        items: { type: 'string' },
        description: 'CSS imports to add at the top'
      },
      utilities: {
        type: 'object',
        description: 'Utility classes to add'
      }
    }
  }
};
