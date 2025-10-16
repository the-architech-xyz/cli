/**
 * TypeScript Blueprint Parser
 *
 * Parses TypeScript blueprint files and extracts Blueprint objects
 * using proper AST parsing instead of regex
 */
import { parse } from '@typescript-eslint/typescript-estree';
export class TypeScriptBlueprintParser {
    /**
     * Parse a TypeScript blueprint file and extract the Blueprint object
     */
    static parseBlueprint(typescriptContent) {
        try {
            // Parse the TypeScript content into an AST
            const ast = parse(typescriptContent, {
                loc: true,
                range: true,
                tokens: true,
                comment: true,
                ecmaVersion: 2020,
                sourceType: 'module',
                jsx: false
            });
            // Find the exported blueprint constant
            const blueprintExport = this.findBlueprintExport(ast);
            if (!blueprintExport) {
                console.warn('No blueprint export found in TypeScript file');
                return null;
            }
            // Convert the AST node to a Blueprint object
            return this.astNodeToBlueprint(blueprintExport);
        }
        catch (error) {
            console.error('Failed to parse TypeScript blueprint:', error);
            return null;
        }
    }
    /**
     * Find the exported blueprint constant in the AST
     */
    static findBlueprintExport(ast) {
        for (const node of ast.body) {
            if (node.type === 'ExportDefaultDeclaration') {
                // Handle export default
                if (node.declaration && node.declaration.type === 'Identifier') {
                    // Find the variable declaration
                    for (const bodyNode of ast.body) {
                        if (bodyNode.type === 'VariableDeclaration') {
                            for (const declarator of bodyNode.declarations) {
                                if (declarator.id.type === 'Identifier' &&
                                    declarator.id.name === node.declaration.name &&
                                    declarator.id.name.endsWith('Blueprint')) {
                                    return declarator.init;
                                }
                            }
                        }
                    }
                }
                else if (node.declaration && node.declaration.type === 'ObjectExpression') {
                    // Direct object export
                    return node.declaration;
                }
            }
            else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                const declaration = node.declaration;
                if (declaration.type === 'VariableDeclaration') {
                    for (const declarator of declaration.declarations) {
                        if (declarator.id.type === 'Identifier' &&
                            declarator.id.name.endsWith('Blueprint') &&
                            declarator.init) {
                            return declarator.init;
                        }
                    }
                }
            }
        }
        return null;
    }
    /**
     * Convert an AST node to a Blueprint object
     */
    static astNodeToBlueprint(node) {
        if (node.type !== 'ObjectExpression') {
            throw new Error('Expected object expression for blueprint');
        }
        const blueprint = {};
        for (const property of node.properties) {
            if (property.type === 'Property' && property.key.type === 'Identifier') {
                const key = property.key.name;
                const value = this.astValueToJavaScript(property.value);
                blueprint[key] = value;
            }
        }
        return blueprint;
    }
    /**
     * Convert an AST value node to JavaScript value
     */
    static astValueToJavaScript(node) {
        switch (node.type) {
            case 'Literal':
                return node.value;
            case 'Identifier':
                return node.name;
            case 'ArrayExpression':
                return node.elements.map((element) => element ? this.astValueToJavaScript(element) : null).filter((item) => item !== null);
            case 'ObjectExpression':
                const obj = {};
                for (const property of node.properties) {
                    if (property.type === 'Property' && property.key.type === 'Identifier') {
                        const key = property.key.name;
                        const value = this.astValueToJavaScript(property.value);
                        obj[key] = value;
                    }
                }
                return obj;
            case 'TemplateLiteral':
                // Handle template literals by concatenating parts
                let result = '';
                for (let i = 0; i < node.quasis.length; i++) {
                    result += node.quasis[i].value.raw;
                    if (i < node.expressions.length) {
                        // For template expressions, we'll just add a placeholder
                        // In a real implementation, you'd want to handle these properly
                        result += `{{expression_${i}}}`;
                    }
                }
                return result;
            case 'BinaryExpression':
                // Handle simple binary expressions
                if (node.operator === '+') {
                    const left = this.astValueToJavaScript(node.left);
                    const right = this.astValueToJavaScript(node.right);
                    return left + right;
                }
                break;
            case 'ConditionalExpression':
                // Handle ternary expressions
                const test = this.astValueToJavaScript(node.test);
                const consequent = this.astValueToJavaScript(node.consequent);
                const alternate = this.astValueToJavaScript(node.alternate);
                return test ? consequent : alternate;
            case 'MemberExpression':
                // Handle member expressions like BlueprintActionType.CREATE_FILE
                const object = this.astValueToJavaScript(node.object);
                const property = this.astValueToJavaScript(node.property);
                // Map enum values to their string equivalents
                if (object === 'BlueprintActionType') {
                    switch (property) {
                        case 'CREATE_FILE': return 'CREATE_FILE';
                        case 'ENHANCE_FILE': return 'ENHANCE_FILE';
                        case 'INSTALL_PACKAGES': return 'INSTALL_PACKAGES';
                        case 'ADD_SCRIPT': return 'ADD_SCRIPT';
                        case 'ADD_ENV_VAR': return 'ADD_ENV_VAR';
                        case 'RUN_COMMAND': return 'RUN_COMMAND';
                        case 'APPEND_TO_FILE': return 'APPEND_TO_FILE';
                        case 'PREPEND_TO_FILE': return 'PREPEND_TO_FILE';
                        case 'MERGE_JSON': return 'MERGE_JSON';
                        case 'MERGE_CONFIG': return 'MERGE_CONFIG';
                        case 'ADD_TS_IMPORT': return 'ADD_TS_IMPORT';
                        case 'EXTEND_SCHEMA': return 'EXTEND_SCHEMA';
                        case 'WRAP_CONFIG': return 'WRAP_CONFIG';
                        case 'ADD_DEPENDENCY': return 'ADD_DEPENDENCY';
                        case 'ADD_DEV_DEPENDENCY': return 'ADD_DEV_DEPENDENCY';
                        default: return `${object}.${property}`;
                    }
                }
                return `${object}.${property}`;
            default:
                console.warn(`Unhandled AST node type: ${node.type}`);
                return null;
        }
        return null;
    }
}
//# sourceMappingURL=typescript-blueprint-parser.js.map