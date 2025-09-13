/**
 * Agent Types - V1 Simplified
 * 
 * Simple agent structure for sequential execution
 */

import { BlueprintContext } from './blueprint-context.js';

export interface Agent {
  category: string;
  execute(module: Module, context: ProjectContext, blueprintContext?: BlueprintContext): Promise<AgentResult>;
}

export interface Module {
  id: string;
  category: string;
  version: string;
  parameters: Record<string, any>;
  externalFiles?: string[];
}

export interface ProjectContext {
  project: {
    name: string;
    path: string;
    framework: string;
    description?: string;
    author?: string;
    version?: string;
    license?: string;
  };
  module: Module;
  pathHandler?: any; // DecentralizedPathHandler - will be properly typed later
  adapter?: any; // AdapterConfig - will be properly typed later
  framework: string; // Framework being used (e.g., 'nextjs', 'react', 'vue')
  cliArgs?: Record<string, any>;
  projectRoot?: string;
  // Cross-module access for template processing
  modules?: Record<string, Module>;
  databaseModule?: Module;
  paymentModule?: Module;
  authModule?: Module;
  emailModule?: Module;
  observabilityModule?: Module;
  stateModule?: Module;
  uiModule?: Module;
  testingModule?: Module;
  deploymentModule?: Module;
  contentModule?: Module;
  blockchainModule?: Module;
}

export interface AgentResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
}
