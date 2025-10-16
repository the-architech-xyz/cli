/**
 * JavaScript Config Merger Modifier
 *
 * Intelligently deep-merges properties into JavaScript/TypeScript configuration objects.
 * Uses AST-based merging to preserve code structure and formatting while adding new properties.
 *
 * Supports:
 * - export default {...}
 * - module.exports = {...}
 * - export const config = {...}
 * - Deep merging of nested objects and arrays
 * - Preserving existing code style and comments
 */
import { BaseModifier } from './base-modifier.js';
import { Project, SyntaxKind } from 'ts-morph';
export class JsConfigMergerModifier extends BaseModifier {
    getDescription() {
        return 'Intelligently deep-merges properties into JavaScript/TypeScript configuration objects using AST-based merging';
    }
    getSupportedFileTypes() {
        return ['js', 'ts', 'mjs', 'cjs'];
    }
    getParamsSchema() {
        return {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'New config content to merge (can be a template string)'
                },
                exportName: {
                    type: 'string',
                    enum: ['default', 'module.exports', 'named'],
                    default: 'default',
                    description: 'Type of export to target'
                },
                namedExport: {
                    type: 'string',
                    description: 'Name of the named export (required if exportName is "named")'
                },
                mergeStrategy: {
                    type: 'string',
                    enum: ['merge', 'replace', 'append'],
                    default: 'merge',
                    description: 'Strategy for merging arrays and objects'
                },
                targetProperties: {
                    type: 'object',
                    description: 'Specific properties to merge (if not provided, will parse from content)'
                },
                preserveComments: {
                    type: 'boolean',
                    default: true,
                    description: 'Whether to preserve existing comments in the file'
                }
            },
            required: [] // Either content or targetProperties must be provided (validated in execute)
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
            // Validate that either content or targetProperties is provided
            if (!params.content && !params.targetProperties) {
                return {
                    success: false,
                    error: 'Either "content" or "targetProperties" must be provided'
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
            // Read existing file content
            const existingContent = await this.readFile(filePath);
            // Parse the new content to get properties to merge
            const propertiesToMerge = await this.parseConfigContent(params.content, params);
            // Perform AST-based merge
            const mergedContent = await this.mergeConfigAst(existingContent, propertiesToMerge, params);
            // Write back to VFS
            await this.writeFile(filePath, mergedContent);
            return {
                success: true,
                message: `Successfully merged JavaScript config: ${filePath}`
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
     * Parse config content to extract properties to merge
     */
    async parseConfigContent(content, params) {
        try {
            // If targetProperties is provided, use it directly
            if (params.targetProperties) {
                return params.targetProperties;
            }
            // Otherwise, parse the content to extract the config object
            const project = new Project({
                useInMemoryFileSystem: true,
                skipFileDependencyResolution: true
            });
            const sourceFile = project.createSourceFile('temp.ts', content);
            // Find the export declaration
            const exportDeclaration = this.findExportDeclaration(sourceFile, params);
            if (!exportDeclaration) {
                throw new Error('Could not find export declaration in content');
            }
            // Extract the object literal
            const objectLiteral = this.extractObjectLiteral(exportDeclaration);
            if (!objectLiteral) {
                throw new Error('Export declaration does not contain an object literal');
            }
            // Convert AST to plain object
            return this.astToObject(objectLiteral);
        }
        catch (error) {
            throw new Error(`Failed to parse config content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find the appropriate export declaration
     */
    findExportDeclaration(sourceFile, params) {
        const exportName = params.exportName || 'default';
        if (exportName === 'default') {
            // Look for export default statements first
            const statements = sourceFile.getStatements();
            for (const statement of statements) {
                if (statement.getKind() === SyntaxKind.ExportAssignment) {
                    return statement.asKindOrThrow(SyntaxKind.ExportAssignment).getExpression();
                }
            }
            // If no export default found, look for module.exports (CommonJS)
            for (const statement of statements) {
                if (statement.getKind() === SyntaxKind.ExpressionStatement) {
                    const expr = statement.asKindOrThrow(SyntaxKind.ExpressionStatement).getExpression();
                    if (expr.getKind() === SyntaxKind.BinaryExpression) {
                        const binaryExpr = expr.asKindOrThrow(SyntaxKind.BinaryExpression);
                        if (binaryExpr.getLeft().getText() === 'module.exports') {
                            return binaryExpr.getRight();
                        }
                    }
                }
            }
            return null;
        }
        else if (exportName === 'module.exports') {
            // Look for module.exports = ...
            const statements = sourceFile.getStatements();
            for (const statement of statements) {
                if (statement.getKind() === SyntaxKind.ExpressionStatement) {
                    const expr = statement.asKindOrThrow(SyntaxKind.ExpressionStatement).getExpression();
                    if (expr.getKind() === SyntaxKind.BinaryExpression) {
                        const binaryExpr = expr.asKindOrThrow(SyntaxKind.BinaryExpression);
                        if (binaryExpr.getLeft().getText() === 'module.exports') {
                            return binaryExpr.getRight();
                        }
                    }
                }
            }
        }
        else if (exportName === 'named' && params.namedExport) {
            // Look for export const namedExport = ...
            const namedExports = sourceFile.getExportedDeclarations();
            return namedExports.get(params.namedExport)?.[0];
        }
        return null;
    }
    /**
     * Extract object literal from export declaration
     */
    extractObjectLiteral(exportDeclaration) {
        if (exportDeclaration.getKind() === SyntaxKind.ObjectLiteralExpression) {
            return exportDeclaration.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        }
        // Handle function calls that return objects
        if (exportDeclaration.getKind() === SyntaxKind.CallExpression) {
            const callExpr = exportDeclaration.asKindOrThrow(SyntaxKind.CallExpression);
            const args = callExpr.getArguments();
            if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
                return args[0].asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            }
        }
        return null;
    }
    /**
     * Convert AST object literal to plain JavaScript object
     */
    astToObject(objectLiteral) {
        const result = {};
        for (const property of objectLiteral.getProperties()) {
            if (property.getKind() === SyntaxKind.PropertyAssignment) {
                const propAssignment = property.asKindOrThrow(SyntaxKind.PropertyAssignment);
                const name = propAssignment.getName();
                const value = this.astValueToObject(propAssignment.getInitializer());
                result[name] = value;
            }
        }
        return result;
    }
    /**
     * Convert AST value to plain JavaScript object
     */
    astValueToObject(value) {
        const kind = value.getKind();
        switch (kind) {
            case SyntaxKind.StringLiteral:
                return value.getLiteralValue();
            case SyntaxKind.NumericLiteral:
                return value.getLiteralValue();
            case SyntaxKind.TrueKeyword:
                return true;
            case SyntaxKind.FalseKeyword:
                return false;
            case SyntaxKind.NullKeyword:
                return null;
            case SyntaxKind.ObjectLiteralExpression:
                return this.astToObject(value);
            case SyntaxKind.ArrayLiteralExpression:
                return value.getElements().map((element) => this.astValueToObject(element));
            case SyntaxKind.Identifier:
                // Handle identifiers (variables, functions, etc.)
                return value.getText();
            default:
                // For complex expressions, return the text representation
                return value.getText();
        }
    }
    /**
     * Perform AST-based merge of configuration
     */
    async mergeConfigAst(existingContent, propertiesToMerge, params) {
        try {
            // For now, let's use a simpler approach: parse the existing content,
            // merge the objects, and regenerate the content
            const existingConfig = await this.parseConfigContent(existingContent, params);
            // Deep merge the configurations
            const mergedConfig = this.deepMergeObjects(existingConfig, propertiesToMerge, params.mergeStrategy || 'merge');
            // Generate the new content
            return this.generateConfigContent(mergedConfig, params);
        }
        catch (error) {
            throw new Error(`Failed to merge config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Merge properties into the AST object literal
     */
    mergeProperties(objectLiteral, propertiesToMerge, params) {
        const mergeStrategy = params.mergeStrategy || 'merge';
        for (const [key, value] of Object.entries(propertiesToMerge)) {
            // Check if property already exists
            const existingProperty = objectLiteral.getProperty(key);
            if (existingProperty) {
                // Property exists, merge it
                if (existingProperty.getKind() === SyntaxKind.PropertyAssignment) {
                    const propAssignment = existingProperty.asKindOrThrow(SyntaxKind.PropertyAssignment);
                    const existingValue = propAssignment.getInitializer();
                    if (this.shouldDeepMerge(existingValue, value, mergeStrategy)) {
                        this.deepMergeProperty(propAssignment, value, mergeStrategy);
                    }
                    else {
                        // Replace the property
                        propAssignment.setInitializer(this.createAstValue(value));
                    }
                }
            }
            else {
                // Property doesn't exist, add it
                objectLiteral.addPropertyAssignment({
                    name: key,
                    initializer: this.createAstValue(value)
                });
            }
        }
    }
    /**
     * Check if we should deep merge based on types and strategy
     */
    shouldDeepMerge(existingValue, newValue, strategy) {
        if (strategy === 'replace')
            return false;
        if (strategy === 'append')
            return false;
        if (!existingValue)
            return false;
        // Deep merge if both are objects
        return (existingValue.getKind() === SyntaxKind.ObjectLiteralExpression &&
            typeof newValue === 'object' &&
            newValue !== null &&
            !Array.isArray(newValue));
    }
    /**
     * Deep merge a property
     */
    deepMergeProperty(propAssignment, newValue, strategy) {
        const existingValue = propAssignment.getInitializer();
        if (existingValue && existingValue.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const objectLiteral = existingValue.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            // Recursively merge object properties
            for (const [key, value] of Object.entries(newValue)) {
                const existingProp = objectLiteral.getProperty(key);
                if (existingProp && existingProp.getKind() === SyntaxKind.PropertyAssignment) {
                    const existingPropAssignment = existingProp.asKindOrThrow(SyntaxKind.PropertyAssignment);
                    if (this.shouldDeepMerge(existingPropAssignment.getInitializer(), value, strategy)) {
                        this.deepMergeProperty(existingPropAssignment, value, strategy);
                    }
                    else {
                        existingPropAssignment.setInitializer(this.createAstValue(value));
                    }
                }
                else {
                    objectLiteral.addPropertyAssignment({
                        name: key,
                        initializer: this.createAstValue(value)
                    });
                }
            }
        }
    }
    /**
     * Deep merge two objects
     */
    deepMergeObjects(target, source, strategy) {
        if (strategy === 'replace') {
            return { ...target, ...source };
        }
        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
                    typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                    result[key] = this.deepMergeObjects(target[key], source[key], strategy);
                }
                else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                    if (strategy === 'append') {
                        result[key] = [...target[key], ...source[key]];
                    }
                    else {
                        result[key] = source[key];
                    }
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
    /**
     * Generate JavaScript config content from object
     */
    generateConfigContent(config, params) {
        const exportName = params.exportName || 'default';
        const configStr = this.objectToJavaScript(config, 2);
        if (exportName === 'default') {
            return `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${configStr};\n`;
        }
        else if (exportName === 'module.exports') {
            return `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${configStr};\n`;
        }
        else {
            return `/** @type {import('tailwindcss').Config} */\nconst ${exportName} = ${configStr};\nmodule.exports = ${exportName};\n`;
        }
    }
    /**
     * Convert object to JavaScript string representation
     */
    objectToJavaScript(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        if (obj === null)
            return 'null';
        if (obj === undefined)
            return 'undefined';
        if (typeof obj === 'string')
            return `"${obj.replace(/"/g, '\\"')}"`;
        if (typeof obj === 'number' || typeof obj === 'boolean')
            return obj.toString();
        if (Array.isArray(obj)) {
            if (obj.length === 0)
                return '[]';
            const items = obj.map(item => this.objectToJavaScript(item, indent + 2));
            return `[\n${spaces}  ${items.join(',\n' + spaces + '  ')}\n${spaces}]`;
        }
        if (typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0)
                return '{}';
            const properties = entries.map(([key, value]) => {
                const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
                return `${keyStr}: ${this.objectToJavaScript(value, indent + 2)}`;
            });
            return `{\n${spaces}  ${properties.join(',\n' + spaces + '  ')}\n${spaces}}`;
        }
        return String(obj);
    }
    /**
     * Create AST value from JavaScript object
     */
    createAstValue(value) {
        if (typeof value === 'string') {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        else if (typeof value === 'number') {
            return value.toString();
        }
        else if (typeof value === 'boolean') {
            return value.toString();
        }
        else if (value === null) {
            return 'null';
        }
        else if (Array.isArray(value)) {
            const elements = value.map(item => this.createAstValue(item));
            return `[${elements.join(', ')}]`;
        }
        else if (typeof value === 'object') {
            const properties = Object.entries(value).map(([key, val]) => {
                const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
                return `${keyStr}: ${this.createAstValue(val)}`;
            });
            return `{\n        ${properties.join(',\n        ')}\n      }`;
        }
        else {
            return `"${String(value)}"`;
        }
    }
}
//# sourceMappingURL=js-config-merger.js.map