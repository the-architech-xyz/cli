/**
 * Modifier Type Definitions
 *
 * This is the SINGLE SOURCE OF TRUTH for all available modifiers in The Architech.
 * Any modifier referenced in a blueprint MUST be listed here to ensure type safety.
 */
/**
 * Available Modifiers - Type-Safe Contract
 *
 * Each modifier is a pure function that transforms a file's AST or content.
 * Add new modifiers to this union type to enable them across the system.
 *
 * @deprecated Use ModifierType enum instead
 */
export type AvailableModifier = 'package-json-merger' | 'tsconfig-enhancer' | 'css-enhancer' | 'js-config-merger' | 'ts-module-enhancer' | 'json-merger' | 'js-export-wrapper' | 'jsx-children-wrapper' | 'yaml-merger' | 'dockerignore-merger' | 'dockerfile-merger' | 'env-merger' | 'readme-merger' | 'ts-interface-merger' | 'ts-import-merger' | 'css-class-merger' | 'html-attribute-merger';
export { ModifierType } from './modifier-types.js';
/**
 * Modifier parameter schemas for each modifier type.
 * This provides intellisense for modifier-specific parameters.
 */
export interface ModifierParams {
    [key: string]: any;
}
/**
 * Package JSON Merger Parameters
 */
export interface PackageJsonMergerParams extends ModifierParams {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    browserslist?: string[];
}
/**
 * TSConfig Enhancer Parameters
 */
export interface TsconfigEnhancerParams extends ModifierParams {
    compilerOptions?: Record<string, any>;
    paths?: Record<string, string[]>;
    include?: string[];
    exclude?: string[];
    extends?: string;
    mergeStrategy?: 'merge' | 'replace';
}
/**
 * CSS Enhancer Parameters
 */
export interface CssEnhancerParams extends ModifierParams {
    content?: string;
    styles?: string;
}
/**
 * JS Config Merger Parameters
 */
export interface JsConfigMergerParams extends ModifierParams {
    content?: string;
    exportName?: 'default' | 'module.exports' | 'named';
    namedExport?: string;
    mergeStrategy?: 'merge' | 'replace' | 'append';
    targetProperties?: Record<string, any>;
    preserveComments?: boolean;
}
/**
 * TypeScript Module Enhancer Parameters
 */
export interface TsModuleEnhancerParams extends ModifierParams {
    importsToAdd?: Array<{
        name: string;
        from: string;
        type?: 'import' | 'type';
        isDefault?: boolean;
        isNamespace?: boolean;
    }>;
    statementsToAppend?: Array<{
        type: 'raw' | 'function' | 'const' | 'interface' | 'type';
        content: string;
    }>;
    preserveExisting?: boolean;
}
/**
 * JSON Merger Parameters
 */
export interface JsonMergerParams extends ModifierParams {
    merge: Record<string, any>;
    strategy?: 'deep' | 'shallow';
    arrayMergeStrategy?: 'concat' | 'replace' | 'unique';
}
/**
 * JS Export Wrapper Parameters
 */
export interface JsExportWrapperParams extends ModifierParams {
    wrapperFunction: string;
    wrapperImport: {
        name: string;
        from: string;
        isDefault?: boolean;
    };
    wrapperOptions?: Record<string, any>;
}
/**
 * JSX Children Wrapper Parameters
 */
export interface JsxChildrenWrapperParams extends ModifierParams {
    providers: Array<{
        component: string;
        import: {
            name: string;
            from: string;
            isDefault?: boolean;
        };
        props?: Record<string, string | boolean | number>;
    }>;
    targetElement?: string;
}
/**
 * Type guard to check if a string is a valid modifier name
 */
export declare function isValidModifier(value: string): value is AvailableModifier;
