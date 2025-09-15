/**
 * JavaScript Config Merger Modifier
 * 
 * Merges JavaScript configuration files (like next.config.js, tailwind.config.js)
 * using simple string manipulation and object merging.
 */

import { ModifierDefinition, ProjectContext } from '@thearchitech.xyz/types';

export class JSConfigMergerModifier {
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

      // If the file is empty or doesn't exist, create a basic config
      if (!content.trim()) {
        enhancedContent = `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nmodule.exports = nextConfig;`;
      }

      // Add imports if specified
      if (params.imports) {
        let importStatements = '';
        for (const importSpec of params.imports) {
          if (importSpec.type === 'default') {
            importStatements += `const ${importSpec.name} = require('${importSpec.from}');\n`;
          } else if (importSpec.type === 'named') {
            importStatements += `const { ${importSpec.name} } = require('${importSpec.from}');\n`;
          } else if (importSpec.type === 'all') {
            importStatements += `const ${importSpec.name} = require('${importSpec.from}');\n`;
          }
        }
        enhancedContent = importStatements + enhancedContent;
      }

      // Add configuration properties if specified
      if (params.config) {
        // Find the config object and add properties
        const configMatch = enhancedContent.match(/(const\s+\w+Config\s*=\s*{)([\s\S]*?)(};)/);
        if (configMatch) {
          const configStart = configMatch[1];
          const configContent = configMatch[2];
          const configEnd = configMatch[3];
          
          let newConfigContent = configContent;
          
          // Add new properties
          for (const [key, value] of Object.entries(params.config)) {
            const valueStr = typeof value === 'string' ? `'${value}'` : JSON.stringify(value, null, 2);
            newConfigContent += `\n  ${key}: ${valueStr},`;
          }
          
          enhancedContent = enhancedContent.replace(configMatch[0], `${configStart}${newConfigContent}\n${configEnd}`);
        } else {
          // Create a new config object
          const configName = params.configName || 'nextConfig';
          let configContent = `const ${configName} = {\n`;
          for (const [key, value] of Object.entries(params.config)) {
            const valueStr = typeof value === 'string' ? `'${value}'` : JSON.stringify(value, null, 2);
            configContent += `  ${key}: ${valueStr},\n`;
          }
          configContent += `};\n\nmodule.exports = ${configName};`;
          enhancedContent = configContent;
        }
      }

      // Add plugins if specified
      if (params.plugins) {
        const configMatch = enhancedContent.match(/(const\s+\w+Config\s*=\s*{)([\s\S]*?)(};)/);
        if (configMatch) {
          const configStart = configMatch[1];
          const configContent = configMatch[2];
          const configEnd = configMatch[3];
          
          let newConfigContent = configContent || '';
          
          // Add plugins array
          if (newConfigContent.includes('plugins:')) {
            // Update existing plugins
            const pluginsMatch = newConfigContent.match(/plugins:\s*\[([\s\S]*?)\]/);
            newConfigContent = newConfigContent.replace(
              /plugins:\s*\[([\s\S]*?)\]/,
              `plugins: [\n${pluginsMatch?.[1] || ''}\n    ...${JSON.stringify(params.plugins, null, 6)}\n  ]`
            );
          } else {
            // Add new plugins array
            newConfigContent += `\n  plugins: ${JSON.stringify(params.plugins, null, 2)},`;
          }
          
          enhancedContent = enhancedContent.replace(configMatch[0], `${configStart}${newConfigContent}\n${configEnd}`);
        }
      }

      // Add custom code if specified
      if (params.customCode) {
        enhancedContent += `\n\n${params.customCode}`;
      }

      return {
        success: true,
        content: enhancedContent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to merge JavaScript config: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export the modifier definition
export const jsConfigMergerModifier: ModifierDefinition = {
  description: 'Merges JavaScript configuration files with new properties and plugins',
  handler: JSConfigMergerModifier.handler,
  paramsSchema: {},
  supportedFileTypes: ['js', 'mjs']
};
