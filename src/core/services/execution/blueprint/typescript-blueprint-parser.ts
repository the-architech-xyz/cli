/**
 * TypeScript Blueprint Parser
 * 
 * Parses TypeScript blueprint files and extracts Blueprint objects
 * using proper AST parsing instead of regex
 */

import { parse } from '@typescript-eslint/typescript-estree';
import { Blueprint, BlueprintActionType } from '@thearchitech.xyz/types';

export class TypeScriptBlueprintParser {
  /**
   * Parse a TypeScript blueprint file and extract the Blueprint object
   */
  static parseBlueprint(typescriptContent: string): Blueprint | null {
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
    } catch (error) {
      console.error('Failed to parse TypeScript blueprint:', error);
      return null;
    }
  }

  /**
   * Find the exported blueprint constant in the AST
   */
  private static findBlueprintExport(ast: any): any {
    for (const node of ast.body) {
      if (node.type === 'ExportNamedDeclaration' && node.declaration) {
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
  private static astNodeToBlueprint(node: any): Blueprint {
    if (node.type !== 'ObjectExpression') {
      throw new Error('Expected object expression for blueprint');
    }

    const blueprint: any = {};

    for (const property of node.properties) {
      if (property.type === 'Property' && property.key.type === 'Identifier') {
        const key = property.key.name;
        const value = this.astValueToJavaScript(property.value);
        blueprint[key] = value;
      }
    }

    return blueprint as Blueprint;
  }

  /**
   * Convert an AST value node to JavaScript value
   */
  private static astValueToJavaScript(node: any): any {
    switch (node.type) {
      case 'Literal':
        return node.value;
      
      case 'ArrayExpression':
        return node.elements.map((element: any) => 
          element ? this.astValueToJavaScript(element) : null
        ).filter((item: any) => item !== null);
      
      case 'ObjectExpression':
        const obj: any = {};
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
      
      default:
        console.warn(`Unhandled AST node type: ${node.type}`);
        return null;
    }
    
    return null;
  }
}
