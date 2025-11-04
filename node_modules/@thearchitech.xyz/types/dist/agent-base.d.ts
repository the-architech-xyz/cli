/**
 * Agent Base Types
 *
 * Defines base types for the agent system.
 */
import { Module } from './recipe.js';
import { ProjectContext } from './agent.js';
import { BlueprintContext } from './blueprint-context.js';
import { AgentResult } from './agent.js';
/**
 * Base interface for all agents
 */
export interface BaseAgent {
    /**
     * Execute a module with the given context
     */
    execute(module: Module, context: ProjectContext, blueprintContext?: BlueprintContext): Promise<AgentResult>;
    /**
     * Get the agent's category (optional)
     */
    getCategory?(): string;
    /**
     * Check if the agent supports a specific module (optional)
     */
    supports?(module: Module): boolean;
}
/**
 * Agent registry type
 */
export type AgentRegistry = Map<string, BaseAgent>;
