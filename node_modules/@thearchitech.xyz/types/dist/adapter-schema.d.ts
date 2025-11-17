/**
 * Centralized Adapter Schema System
 *
 * This file defines the standardized parameter names, dependency constraints,
 * and validation rules that all adapters must follow for V1.
 *
 * Adapters can extend these base schemas with custom parameters,
 * but they must use the standardized names for common parameters.
 */
/**
 * Standardized parameter names that all adapters must use
 * This ensures consistency across the entire system
 */
export declare const STANDARD_PARAMETERS: {
    readonly DATABASE_TYPE: "databaseType";
    readonly DATABASE_URL: "databaseUrl";
    readonly DATABASE_HOST: "databaseHost";
    readonly DATABASE_PORT: "databasePort";
    readonly DATABASE_NAME: "databaseName";
    readonly DATABASE_USER: "databaseUser";
    readonly DATABASE_PASSWORD: "databasePassword";
    readonly FRAMEWORK_TYPE: "frameworkType";
    readonly FRAMEWORK_VERSION: "frameworkVersion";
    readonly UI_LIBRARY: "uiLibrary";
    readonly UI_THEME: "uiTheme";
    readonly UI_COLOR_SCHEME: "colorScheme";
    readonly AUTH_PROVIDER: "authProvider";
    readonly AUTH_SECRET: "authSecret";
    readonly AUTH_REDIRECT_URL: "authRedirectUrl";
    readonly API_BASE_URL: "apiBaseUrl";
    readonly API_VERSION: "apiVersion";
    readonly DEPLOYMENT_PLATFORM: "deploymentPlatform";
    readonly DEPLOYMENT_REGION: "deploymentRegion";
    readonly ENABLE_FEATURES: "enableFeatures";
    readonly DISABLE_FEATURES: "disableFeatures";
};
/**
 * Standardized parameter types with validation
 */
export declare const STANDARD_PARAMETER_TYPES: {
    readonly databaseType: {
        readonly type: "string";
        readonly enum: readonly ["postgresql", "mysql", "sqlite", "mongodb"];
        readonly default: "postgresql";
        readonly description: "Type of database to use";
    };
    readonly databaseUrl: {
        readonly type: "string";
        readonly format: "uri";
        readonly description: "Full database connection URL";
    };
    readonly frameworkType: {
        readonly type: "string";
        readonly enum: readonly ["nextjs", "react", "vue", "svelte"];
        readonly default: "nextjs";
        readonly description: "Frontend framework to use";
    };
    readonly uiLibrary: {
        readonly type: "string";
        readonly enum: readonly ["shadcn", "tailwind", "chakra", "mui", "antd"];
        readonly default: "shadcn";
        readonly description: "UI component library to use";
    };
    readonly authProvider: {
        readonly type: "string";
        readonly enum: readonly ["better-auth", "auth0", "firebase", "supabase"];
        readonly default: "better-auth";
        readonly description: "Authentication provider to use";
    };
    readonly deploymentPlatform: {
        readonly type: "string";
        readonly enum: readonly ["vercel", "netlify", "aws", "docker"];
        readonly default: "vercel";
        readonly description: "Deployment platform to use";
    };
    readonly enableFeatures: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly default: readonly [];
        readonly description: "Features to enable";
    };
    readonly disableFeatures: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly default: readonly [];
        readonly description: "Features to disable";
    };
};
/**
 * Standardized dependency constraints that adapters can declare
 */
export interface AdapterDependencyConstraints {
    requiredFrameworks?: string[];
    incompatibleFrameworks?: string[];
    requiredUILibraries?: string[];
    incompatibleUILibraries?: string[];
    requiredDatabases?: string[];
    incompatibleDatabases?: string[];
    minNodeVersion?: string;
    maxNodeVersion?: string;
    requiredPackages?: string[];
    conflictingPackages?: string[];
    requiredEnvironment?: 'development' | 'production' | 'both';
    requiredPlatforms?: string[];
}
/**
 * Standardized constraint types
 */
export declare const STANDARD_CONSTRAINTS: {
    readonly FRAMEWORKS: {
        readonly NEXTJS: "nextjs";
        readonly REACT: "react";
        readonly VUE: "vue";
        readonly SVELTE: "svelte";
    };
    readonly UI_LIBRARIES: {
        readonly SHADCN: "shadcn";
        readonly TAILWIND: "tailwind";
        readonly CHAKRA: "chakra";
        readonly MUI: "mui";
        readonly ANTD: "antd";
    };
    readonly DATABASES: {
        readonly POSTGRESQL: "postgresql";
        readonly MYSQL: "mysql";
        readonly SQLITE: "sqlite";
        readonly MONGODB: "mongodb";
    };
    readonly PLATFORMS: {
        readonly VERCEL: "vercel";
        readonly NETLIFY: "netlify";
        readonly AWS: "aws";
        readonly DOCKER: "docker";
    };
};
/**
 * Standardized adapter schema interface
 * All adapters must implement this interface
 */
export interface AdapterSchema {
    name: string;
    version: string;
    description: string;
    category: 'framework' | 'ui' | 'database' | 'auth' | 'payment' | 'email' | 'observability' | 'testing' | 'state' | 'content' | 'deployment' | 'blockchain';
    parameters: {
        [key: string]: {
            type: 'string' | 'number' | 'boolean' | 'array' | 'object';
            enum?: string[];
            default?: any;
            description: string;
            required?: boolean;
            validation?: {
                min?: number;
                max?: number;
                pattern?: string;
                format?: string;
            };
        };
    };
    constraints?: AdapterDependencyConstraints;
    customParameters?: {
        [key: string]: {
            type: 'string' | 'number' | 'boolean' | 'array' | 'object';
            description: string;
            required?: boolean;
        };
    };
    features: string[];
    dependencies: {
        [packageName: string]: {
            version: string;
            type: 'dependency' | 'devDependency' | 'peerDependency';
            description?: string;
        };
    };
}
/**
 * Validates an adapter schema against the standard
 */
export declare class AdapterSchemaValidator {
    static validate(schema: AdapterSchema): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validates parameter values against the schema
     */
    static validateParameters(schema: AdapterSchema, parameters: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Gets the standardized parameter name for a given parameter
 */
export declare function getStandardParameterName(parameter: string): string | null;
/**
 * Checks if a parameter name is standardized
 */
export declare function isStandardParameter(parameter: string): boolean;
/**
 * Gets all available parameter types for a category
 */
export declare function getParameterTypesForCategory(category: string): string[];
