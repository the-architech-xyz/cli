/**
 * Recipe Types - V1 YAML Schema
 * 
 * The architech.yaml file schema for declarative project generation
 */

export interface IntegrationConfig {
  name: string;
  features?: {
    [key: string]: boolean | string | string[];
  };
}

export interface Recipe {
  version: string;
  project: ProjectConfig;
  modules: Module[];
  integrations?: IntegrationConfig[]; // Integration adapters with sub-features
  options?: ExecutionOptions;
}

export interface ProjectConfig {
  name: string;
  framework: string;
  path: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
}

export interface Module {
  id: string;
  category: string;
  version: string;
  parameters: Record<string, any>;
  features?: string[]; // V2: Activated features for this module
  externalFiles?: string[]; // Files to pre-load into VFS
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
