/**
 * Agent Types - V1 Simplified
 *
 * Simple agent structure for sequential execution
 */
import { BlueprintContext } from './blueprint-context.js';
import { Module } from './recipe.js';
import { ConstitutionalExecutionContext } from './constitutional-architecture.js';
export interface Agent {
    category: string;
    execute(module: Module, context: ProjectContext, blueprintContext?: BlueprintContext): Promise<AgentResult>;
}
export interface ProjectContext {
    project: {
        name: string;
        path?: string;
        framework: string;
        description?: string;
        author?: string;
        version?: string;
        license?: string;
    };
    module: Module;
    pathHandler?: any;
    adapter?: any;
    framework: string;
    cliArgs?: Record<string, any>;
    projectRoot?: string;
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
    constitutional?: ConstitutionalExecutionContext;
}
export interface AgentResult {
    success: boolean;
    files: string[];
    errors: string[];
    warnings: string[];
}
