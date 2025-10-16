/**
 * TypeScript Blueprint Parser
 *
 * Parses TypeScript blueprint files and extracts Blueprint objects
 * using proper AST parsing instead of regex
 */
import { Blueprint } from '@thearchitech.xyz/types';
export declare class TypeScriptBlueprintParser {
    /**
     * Parse a TypeScript blueprint file and extract the Blueprint object
     */
    static parseBlueprint(typescriptContent: string): Blueprint | null;
    /**
     * Find the exported blueprint constant in the AST
     */
    private static findBlueprintExport;
    /**
     * Convert an AST node to a Blueprint object
     */
    private static astNodeToBlueprint;
    /**
     * Convert an AST value node to JavaScript value
     */
    private static astValueToJavaScript;
}
