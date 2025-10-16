/**
 * YAML Merger Modifier
 *
 * Performs deep merge on YAML files (docker-compose.yml, etc.)
 * This is a generic version that works with any YAML structure.
 *
 * Use Cases:
 * - Merging docker-compose.yml files
 * - Merging any YAML configuration file
 * - Combining YAML configurations from templates
 */
import { BaseModifier } from './base-modifier.js';
import * as yaml from 'js-yaml';
import { MarketplaceService } from '../../marketplace/marketplace-service.js';
export class YamlMergerModifier extends BaseModifier {
    getDescription() {
        return 'Performs deep merge on YAML files';
    }
    getSupportedFileTypes() {
        return ['yml', 'yaml'];
    }
    getParamsSchema() {
        return {
            type: 'object',
            properties: {
                mergePath: {
                    type: 'string',
                    description: 'Path to the template file to merge into the target YAML file'
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
            required: ['mergePath']
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
            if (!params.mergePath) {
                return {
                    success: false,
                    error: 'Missing required parameter: mergePath'
                };
            }
            // Check if target file exists
            const fileExists = this.engine.fileExists(filePath);
            if (!fileExists) {
                return {
                    success: false,
                    error: `Target file ${filePath} does not exist`
                };
            }
            // Read existing YAML
            const existingContent = await this.readFile(filePath);
            let existingYaml;
            try {
                existingYaml = yaml.load(existingContent);
                if (!existingYaml || typeof existingYaml !== 'object') {
                    existingYaml = {};
                }
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse YAML file ${filePath}: ${error instanceof Error ? error.message : 'Invalid YAML'}`
                };
            }
            // Load template file from marketplace
            let templateContent;
            let templateYaml;
            try {
                templateContent = await MarketplaceService.loadTemplate(context.module.id, params.mergePath);
                // Process template variables before parsing as YAML
                const processedTemplateContent = this.processTemplate(templateContent, context);
                templateYaml = yaml.load(processedTemplateContent);
                if (!templateYaml || typeof templateYaml !== 'object') {
                    templateYaml = {};
                }
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to load template file ${params.mergePath}: ${error instanceof Error ? error.message : 'File not found or invalid YAML'}`
                };
            }
            // Perform merge
            const strategy = params.strategy || 'deep';
            const arrayStrategy = params.arrayMergeStrategy || 'concat';
            const mergedYaml = strategy === 'deep'
                ? this.deepMerge(existingYaml, templateYaml, arrayStrategy)
                : { ...existingYaml, ...templateYaml };
            // Write back to file
            const formattedYaml = yaml.dump(mergedYaml, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
            await this.writeFile(filePath, formattedYaml);
            return {
                success: true,
                message: `Successfully merged YAML file: ${filePath} with template: ${params.mergePath}`
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
    /**
     * Process template strings with context
     */
    processTemplate(template, context) {
        // Simple template processing - replace {{variable}} with context values
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = this.getContextValue(context, key.trim());
            return value !== undefined ? String(value) : match;
        });
    }
    /**
     * Get value from context by key path (e.g., 'project.name' -> context.project.name)
     */
    getContextValue(context, keyPath) {
        const keys = keyPath.split('.');
        let value = context;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
}
//# sourceMappingURL=yaml-merger.js.map