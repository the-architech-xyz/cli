/**
 * Artifact Types
 *
 * Types for auto-discovered module artifacts from blueprint analysis
 */
export interface FileArtifact {
    /** The file path (may contain template variables) */
    path: string;
    /** Optional condition for conditional file creation */
    condition?: string;
    /** Template file path for CREATE_FILE actions */
    template?: string;
    /** Modifier used for ENHANCE_FILE actions */
    modifier?: string;
    /** Whether this file is required */
    required: boolean;
    /** Description of what this file does */
    description?: string;
    /** Owner module for ENHANCE_FILE actions */
    owner?: string;
}
export interface PackageArtifact {
    /** List of packages to install */
    packages: string[];
    /** Whether these are dev dependencies */
    isDev: boolean;
}
export interface EnvVarArtifact {
    /** Environment variable key */
    key: string;
    /** Default value */
    value: string;
    /** Description of the environment variable */
    description?: string;
}
export interface ModuleArtifacts {
    /** Files created by this module */
    creates: FileArtifact[];
    /** Files enhanced by this module */
    enhances: FileArtifact[];
    /** Packages installed by this module */
    installs: PackageArtifact[];
    /** Environment variables added by this module */
    envVars: EnvVarArtifact[];
}
export interface BlueprintAnalysisResult {
    /** Module ID */
    moduleId: string;
    /** Module type (adapter/connector/feature) */
    moduleType: 'adapter' | 'connector' | 'feature';
    /** Extracted artifacts */
    artifacts: ModuleArtifacts;
    /** Analysis metadata */
    metadata: {
        /** Timestamp of analysis */
        analyzedAt: string;
        /** Blueprint file path */
        blueprintPath: string;
        /** Whether analysis was successful */
        success: boolean;
        /** Any errors during analysis */
        errors?: string[];
    };
}
export interface ValidationWarning {
    type: 'MISSING_ARTIFACTS' | 'DEPRECATED_ACTION' | 'UNUSED_TEMPLATE';
    module: string;
    message: string;
    details: {
        file?: string;
        suggestion?: string;
    };
}
export interface ModuleArtifactsRegistry {
    [moduleId: string]: () => Promise<ModuleArtifacts>;
}
