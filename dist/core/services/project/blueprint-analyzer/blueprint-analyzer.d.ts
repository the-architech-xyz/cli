/**
 * Blueprint Analyzer Service
 *
 * Analyzes blueprints to determine all files that need to be pre-loaded into VFS
 * before execution. This is the critical component that enables the "Contextual,
 * Isolated VFS" architecture.
 */
import { Blueprint } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export interface BlueprintAnalysis {
    needVFS: boolean;
    filesToRead: string[];
    filesToCreate: string[];
    contextualFiles: string[];
    allRequiredFiles: string[];
}
export declare class BlueprintAnalyzer {
    /**
     * Analyze a blueprint to determine VFS need and file dependencies
     */
    analyzeBlueprint(blueprint: Blueprint, context: ProjectContext): BlueprintAnalysis;
    /**
     * Determine if VFS is needed based on action types
     */
    private determineVFSNeed;
    /**
     * Analyze a list of actions to determine file dependencies
     */
    private analyzeActions;
    /**
     * Pre-validate that all required files exist on disk
     */
    validateRequiredFiles(analysis: BlueprintAnalysis, projectRoot: string): Promise<{
        valid: boolean;
        missingFiles: string[];
        existingFiles: string[];
    }>;
    /**
     * Expand forEach actions into multiple individual actions
     */
    private expandForEachAction;
}
