/**
 * JSON Object Merger Modifier
 * 
 * Merges JSON objects and configuration files
 * using JSON parsing and object merging.
 */

import { ModifierDefinition, ProjectContext } from '@thearchitech.xyz/types';

export class JSONObjectMergerModifier {
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

      // Parse existing JSON content
      let existingObject: any = {};
      if (content.trim()) {
        try {
          existingObject = JSON.parse(content);
        } catch (error) {
          // If parsing fails, treat as empty object
          existingObject = {};
        }
      }

      // Merge with new properties
      if (params.merge) {
        existingObject = this.deepMerge(existingObject, params.merge);
      }

      // Add specific properties
      if (params.properties) {
        for (const [key, value] of Object.entries(params.properties)) {
          existingObject[key] = value;
        }
      }

      // Add arrays
      if (params.arrays) {
        for (const [key, value] of Object.entries(params.arrays)) {
          if (Array.isArray(existingObject[key])) {
            existingObject[key] = [...existingObject[key], ...(value as any[])];
          } else {
            existingObject[key] = value;
          }
        }
      }

      // Add nested objects
      if (params.nested) {
        for (const [key, value] of Object.entries(params.nested)) {
          if (typeof existingObject[key] === 'object' && existingObject[key] !== null) {
            existingObject[key] = this.deepMerge(existingObject[key], value);
          } else {
            existingObject[key] = value;
          }
        }
      }

      // Convert back to JSON string
      enhancedContent = JSON.stringify(existingObject, null, 2);

      return {
        success: true,
        content: enhancedContent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to merge JSON object: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Deep merge two objects
   */
  private static deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

// Export the modifier definition
export const jsonObjectMergerModifier: ModifierDefinition = {
  description: 'Merges JSON objects and configuration files',
  handler: JSONObjectMergerModifier.handler,
  paramsSchema: {},
  supportedFileTypes: ['json', 'jsonc']
};
