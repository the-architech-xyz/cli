/**
 * JSON Merger Modifier
 *
 * Performs deep merge on any JSON file (package.json, tsconfig.json, etc.)
 * This is a generic version that works with any JSON structure.
 *
 * Use Cases:
 * - Merging package.json (dependencies, scripts)
 * - Merging tsconfig.json (paths, compilerOptions)
 * - Merging any JSON configuration file
 */
import { BaseModifier } from './base-modifier.js';
export class JsonMergerModifier extends BaseModifier {
    getDescription() {
        return 'Performs deep merge on JSON files';
    }
    getSupportedFileTypes() {
        return ['json'];
    }
    getParamsSchema() {
        return {
            type: 'object',
            properties: {
                merge: {
                    type: 'object',
                    description: 'Object to merge into the target JSON file'
                },
                strategy: {
                    type: 'string',
                    enum: ['deep', 'shallow'],
                    default: 'deep',
                    description: 'Merge strategy: deep or shallow'
                },
                arrayMergeStrategy: {
                    type: 'string',
                    enum: ['concat', 'replace', 'unique'],
                    default: 'concat',
                    description: 'How to merge arrays: concat, replace, or unique'
                }
            },
            required: ['merge']
        };
    }
    async execute(filePath, params, context) {
        try {
            // Validate parameters
            const validation = this.validateParams(params);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Parameter validation failed: ${validation.errors.join(', ')}`
                };
            }
            if (!params.merge) {
                return {
                    success: false,
                    error: 'Missing required parameter: merge'
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
            // Read existing JSON
            const existingContent = await this.readFile(filePath);
            let existingJson;
            try {
                existingJson = JSON.parse(existingContent);
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse JSON file ${filePath}: ${error instanceof Error ? error.message : 'Invalid JSON'}`
                };
            }
            // Perform merge
            const strategy = params.strategy || 'deep';
            const arrayStrategy = params.arrayMergeStrategy || 'concat';
            const mergedJson = strategy === 'deep'
                ? this.deepMerge(existingJson, params.merge, arrayStrategy)
                : { ...existingJson, ...params.merge };
            // Write back to file
            const formattedJson = JSON.stringify(mergedJson, null, 2);
            await this.writeFile(filePath, formattedJson);
            return {
                success: true,
                message: `Successfully merged JSON file: ${filePath}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Deep merge two objects
     */
    deepMerge(target, source, arrayStrategy) {
        if (!this.isObject(target) || !this.isObject(source)) {
            return source;
        }
        const result = { ...target };
        for (const key in source) {
            if (!source.hasOwnProperty(key))
                continue;
            const targetValue = result[key];
            const sourceValue = source[key];
            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                // Handle array merging
                if (arrayStrategy === 'replace') {
                    result[key] = sourceValue;
                }
                else if (arrayStrategy === 'unique') {
                    result[key] = [...new Set([...targetValue, ...sourceValue])];
                }
                else {
                    // concat (default)
                    result[key] = [...targetValue, ...sourceValue];
                }
            }
            else if (this.isObject(targetValue) && this.isObject(sourceValue)) {
                // Recursively merge objects
                result[key] = this.deepMerge(targetValue, sourceValue, arrayStrategy);
            }
            else {
                // Primitive value or null - replace
                result[key] = sourceValue;
            }
        }
        return result;
    }
    /**
     * Check if value is a plain object
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }
}
//# sourceMappingURL=json-merger.js.map