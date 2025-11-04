/**
 * Blueprint Context
 *
 * Contains the VFS instance and context for a single blueprint execution.
 * Each blueprint gets its own isolated VFS instance.
 */
import { ConstitutionalExecutionContext } from './constitutional-architecture.js';
export interface BlueprintContext {
    vfs: any;
    projectRoot: string;
    externalFiles: string[];
    constitutional?: ConstitutionalExecutionContext;
}
export interface BlueprintContextOptions {
    projectRoot: string;
    externalFiles?: string[];
}
