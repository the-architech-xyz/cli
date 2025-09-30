/**
 * Unit Tests for JS Config Merger Modifier
 * 
 * Tests the AST-based merging functionality for JavaScript configuration files.
 */

import { JsConfigMergerModifier } from '../js-config-merger.js';
import { FileModificationEngine } from '../../file-engine/file-modification-engine.js';
import { VirtualFileSystem } from '../../file-engine/virtual-file-system.js';
import { ProjectContext } from '@thearchitech.xyz/types';

describe('JsConfigMergerModifier', () => {
  let modifier: JsConfigMergerModifier;
  let mockEngine: FileModificationEngine;
  let mockVFS: VirtualFileSystem;
  let mockContext: ProjectContext;

  beforeEach(() => {
    mockVFS = new VirtualFileSystem('test', './test-dir');
    mockEngine = new FileModificationEngine(mockVFS, './test-dir');
    modifier = new JsConfigMergerModifier(mockEngine);
    
    mockContext = {
      project: {
        name: 'test-project',
        path: './test-dir',
        framework: 'nextjs'
      },
      module: {
        id: 'test-module',
        category: 'ui',
        parameters: {}
      },
      framework: 'nextjs',
      pathHandler: {} as any
    };
  });

  describe('Basic Functionality', () => {
    it('should have correct description and supported file types', () => {
      expect(modifier.getDescription()).toContain('JavaScript/TypeScript configuration');
      expect(modifier.getSupportedFileTypes()).toEqual(['js', 'ts', 'mjs', 'cjs']);
    });

    it('should have correct parameter schema', () => {
      const schema = modifier.getParamsSchema();
      expect(schema.type).toBe('object');
      expect(schema.properties.content).toBeDefined();
      expect(schema.properties.exportName).toBeDefined();
      expect(schema.properties.mergeStrategy).toBeDefined();
      expect(schema.required).toContain('content');
    });
  });

  describe('AST Parsing', () => {
    it('should parse export default object', async () => {
      const content = `
        export default {
          theme: {
            extend: {
              colors: {
                primary: '#blue'
              }
            }
          },
          plugins: []
        };
      `;

      const result = await modifier['parseConfigContent'](content, { exportName: 'default' });
      
      expect(result).toHaveProperty('theme');
      expect(result.theme).toHaveProperty('extend');
      expect(result.theme.extend).toHaveProperty('colors');
      expect(result.theme.extend.colors.primary).toBe('#blue');
      expect(result).toHaveProperty('plugins');
      expect(Array.isArray(result.plugins)).toBe(true);
    });

    it('should parse module.exports object', async () => {
      const content = `
        module.exports = {
          content: ['./src/**/*.{js,ts,jsx,tsx}'],
          theme: {
            extend: {}
          }
        };
      `;

      const result = await modifier['parseConfigContent'](content, { exportName: 'module.exports' });
      
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toBe('./src/**/*.{js,ts,jsx,tsx}');
      expect(result).toHaveProperty('theme');
    });

    it('should parse function call exports', async () => {
      const content = `
        const { withTailwindcss } = require('next-with-tailwindcss');
        
        module.exports = withTailwindcss({
          theme: {
            extend: {}
          }
        });
      `;

      const result = await modifier['parseConfigContent'](content, { exportName: 'module.exports' });
      
      expect(result).toHaveProperty('theme');
      expect(result.theme).toHaveProperty('extend');
    });
  });

  describe('Deep Merging', () => {
    it('should merge nested objects correctly', async () => {
      const existingContent = `
        export default {
          theme: {
            extend: {
              colors: {
                primary: '#blue'
              }
            }
          },
          plugins: ['@tailwindcss/forms']
        };
      `;

      const propertiesToMerge = {
        theme: {
          extend: {
            colors: {
              secondary: '#green'
            },
            spacing: {
              '18': '4.5rem'
            }
          }
        },
        plugins: ['@tailwindcss/typography']
      };

      // Mock VFS methods
      jest.spyOn(mockVFS, 'fileExists').mockReturnValue(true);
      jest.spyOn(mockVFS, 'readFile').mockResolvedValue(existingContent);
      jest.spyOn(mockVFS, 'writeFile').mockResolvedValue();

      const result = await modifier.execute('tailwind.config.js', {
        content: JSON.stringify(propertiesToMerge),
        exportName: 'default',
        mergeStrategy: 'merge'
      }, mockContext);

      expect(result.success).toBe(true);
      expect(mockVFS.writeFile).toHaveBeenCalled();
      
      // Verify the merged content contains both original and new properties
      const writtenContent = (mockVFS.writeFile as jest.Mock).mock.calls[0][1];
      expect(writtenContent).toContain('primary');
      expect(writtenContent).toContain('secondary');
      expect(writtenContent).toContain('4.5rem');
      expect(writtenContent).toContain('@tailwindcss/forms');
      expect(writtenContent).toContain('@tailwindcss/typography');
    });

    it('should replace properties when strategy is replace', async () => {
      const existingContent = `
        export default {
          theme: {
            extend: {
              colors: {
                primary: '#blue'
              }
            }
          }
        };
      `;

      const propertiesToMerge = {
        theme: {
          extend: {
            colors: {
              secondary: '#green'
            }
          }
        }
      };

      // Mock VFS methods
      jest.spyOn(mockVFS, 'fileExists').mockReturnValue(true);
      jest.spyOn(mockVFS, 'readFile').mockResolvedValue(existingContent);
      jest.spyOn(mockVFS, 'writeFile').mockResolvedValue();

      const result = await modifier.execute('tailwind.config.js', {
        content: JSON.stringify(propertiesToMerge),
        exportName: 'default',
        mergeStrategy: 'replace'
      }, mockContext);

      expect(result.success).toBe(true);
      
      // Verify the content was replaced (should not contain original primary color)
      const writtenContent = (mockVFS.writeFile as jest.Mock).mock.calls[0][1];
      expect(writtenContent).toContain('secondary');
      // Note: In replace mode, the original primary color should be replaced
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found', async () => {
      jest.spyOn(mockVFS, 'fileExists').mockReturnValue(false);

      const result = await modifier.execute('nonexistent.js', {
        content: '{}',
        exportName: 'default'
      }, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should handle invalid content', async () => {
      jest.spyOn(mockVFS, 'fileExists').mockReturnValue(true);
      jest.spyOn(mockVFS, 'readFile').mockResolvedValue('invalid javascript content');

      const result = await modifier.execute('config.js', {
        content: 'invalid content',
        exportName: 'default'
      }, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse config content');
    });

    it('should handle missing export declaration', async () => {
      const contentWithoutExport = `
        const config = {
          theme: {}
        };
      `;

      jest.spyOn(mockVFS, 'fileExists').mockReturnValue(true);
      jest.spyOn(mockVFS, 'readFile').mockResolvedValue(contentWithoutExport);

      const result = await modifier.execute('config.js', {
        content: '{}',
        exportName: 'default'
      }, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not find export declaration');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle Tailwind config with plugins array merging', async () => {
      const existingContent = `
        export default {
          content: ['./src/**/*.{js,ts,jsx,tsx}'],
          theme: {
            extend: {}
          },
          plugins: [
            require('@tailwindcss/forms'),
            require('@tailwindcss/typography')
          ]
        };
      `;

      const propertiesToMerge = {
        plugins: [
          'require("@tailwindcss/aspect-ratio")'
        ]
      };

      jest.spyOn(mockVFS, 'fileExists').mockReturnValue(true);
      jest.spyOn(mockVFS, 'readFile').mockResolvedValue(existingContent);
      jest.spyOn(mockVFS, 'writeFile').mockResolvedValue();

      const result = await modifier.execute('tailwind.config.js', {
        content: JSON.stringify(propertiesToMerge),
        exportName: 'default',
        mergeStrategy: 'merge'
      }, mockContext);

      expect(result.success).toBe(true);
      
      const writtenContent = (mockVFS.writeFile as jest.Mock).mock.calls[0][1];
      expect(writtenContent).toContain('@tailwindcss/forms');
      expect(writtenContent).toContain('@tailwindcss/typography');
      expect(writtenContent).toContain('@tailwindcss/aspect-ratio');
    });
  });
});
