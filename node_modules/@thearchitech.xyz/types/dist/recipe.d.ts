/**
 * Core CLI Types
 *
 * Essential types for The Architech CLI orchestration
 */
export interface ProjectConfig {
    name: string;
    path?: string;
    description?: string;
    version?: string;
    author?: string;
    license?: string;
    structure?: 'monorepo' | 'single-app';
    monorepo?: MonorepoConfig;
    apps?: FrameworkApp[];
}
export interface MonorepoConfig {
    tool: 'turborepo' | 'nx' | 'pnpm' | 'yarn';
    packages?: {
        api?: string;
        web?: string;
        mobile?: string;
        shared?: string;
        ui?: string;
        [key: string]: string | undefined;
    };
}
export interface FrameworkApp {
    id: string;
    type: 'web' | 'mobile' | 'api' | 'desktop' | 'worker';
    framework: string;
    package?: string;
    router?: 'app' | 'pages';
    alias?: string;
    parameters?: Record<string, unknown>;
}
export type ModuleType = 'adapter' | 'connector' | 'feature';
export interface Module {
    id: string;
    category?: string;
    version?: string;
    parameters: Record<string, any>;
    features?: {
        [key: string]: boolean | string | string[];
    };
    externalFiles?: string[];
    config?: {
        id: string;
        name: string;
        description: string;
        version: string;
        category: string;
        capabilities?: Record<string, any>;
        prerequisites?: {
            modules?: string[];
            capabilities?: string[];
        };
        provides?: {
            capabilities?: string[];
            files?: string[];
            components?: string[];
            pages?: string[];
        };
        [key: string]: any;
    };
}
export interface ExecutionOptions {
    skipInstall?: boolean;
    skipGit?: boolean;
    verbose?: boolean;
}
export interface ExecutionResult {
    success: boolean;
    modulesExecuted: number;
    errors?: string[];
    warnings?: string[];
}
export interface Genome {
    version: string;
    project: ProjectConfig;
    modules: GenomeModule[];
    features?: string[];
    options?: ExecutionOptions;
}
export interface GenomeModule {
    id: string;
    parameters?: Record<string, any>;
    features?: Record<string, boolean | string | string[]>;
    externalFiles?: string[];
    config?: {
        id: string;
        name: string;
        description: string;
        version: string;
        category: string;
        capabilities?: Record<string, any>;
        prerequisites?: {
            modules?: string[];
            capabilities?: string[];
        };
        provides?: {
            capabilities?: string[];
            files?: string[];
            components?: string[];
            pages?: string[];
        };
        [key: string]: any;
    };
}
