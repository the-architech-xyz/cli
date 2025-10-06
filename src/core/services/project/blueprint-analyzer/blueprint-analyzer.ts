/**
 * Blueprint Analyzer Service
 * 
 * Analyzes blueprints to determine all files that need to be pre-loaded into VFS
 * before execution. This is the critical component that enables the "Contextual, 
 * Isolated VFS" architecture.
 */

import { Blueprint, BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';

export interface BlueprintAnalysis {
  needVFS: boolean;  // ← NEW: The key VFS decision
  filesToRead: string[];
  filesToCreate: string[];
  contextualFiles: string[];
  allRequiredFiles: string[];
}

export class BlueprintAnalyzer {
  /**
   * Analyze a blueprint to determine VFS need and file dependencies
   */
  analyzeBlueprint(blueprint: Blueprint, context: ProjectContext): BlueprintAnalysis {
    console.log(`🔍 Analyzing blueprint: ${blueprint.name}`);
    // Debug logging removed - use Logger.debug() instead
    
    const filesToRead: string[] = [];
    const filesToCreate: string[] = [];
    const contextualFiles: string[] = [];
    
    // 1. Extract contextualFiles from blueprint definition
    if (blueprint.contextualFiles && Array.isArray(blueprint.contextualFiles)) {
      contextualFiles.push(...blueprint.contextualFiles);
      console.log(`📋 Found ${contextualFiles.length} contextual files:`, contextualFiles);
    }
    
    // 2. Analyze all actions to determine file dependencies and VFS need
    const analysis = this.analyzeActions(blueprint.actions, context);
    
    // 3. Determine if VFS is needed based on action types
    const needVFS = this.determineVFSNeed(blueprint.actions);
    
    
    return {
      needVFS,
      filesToRead: analysis.filesToRead,
      filesToCreate: analysis.filesToCreate,
      contextualFiles: analysis.contextualFiles,
      allRequiredFiles: analysis.filesToRead
    };
  }

  /**
   * Determine if VFS is needed based on action types
   */
  private determineVFSNeed(actions: BlueprintAction[]): boolean {
    // VFS is required for actions that need to modify existing files
    const vfsRequiredActions = [
      'ENHANCE_FILE',      // Modifies existing files using modifiers
      'INSTALL_PACKAGES',  // Modifies package.json
      'ADD_SCRIPT',        // Modifies package.json
      'ADD_DEPENDENCY',    // Modifies package.json
      'ADD_DEV_DEPENDENCY' // Modifies package.json
    ];
    
    const needsVFS = actions.some(action => vfsRequiredActions.includes(action.type));
    

    
    return needsVFS;
  }

  /**
   * Analyze a list of actions to determine file dependencies
   */
  private analyzeActions(actions: BlueprintAction[], context: ProjectContext): {
    filesToRead: string[];
    filesToCreate: string[];
    contextualFiles: string[];
  } {
    const filesToRead: string[] = [];
    const filesToCreate: string[] = [];
    const contextualFiles: string[] = [];

    for (const action of actions) {
      if (!action) continue;
      
      // Handle forEach actions by expanding them
      if ((action as any).forEach) {
        console.log(`🔄 Found forEach action: ${(action as any).forEach}`);
        const expandedActions = this.expandForEachAction(action, context);
        console.log(`🔄 Expanded into ${expandedActions.length} actions`);
        const analysis = this.analyzeActions(expandedActions, context);
        filesToRead.push(...analysis.filesToRead);
        filesToCreate.push(...analysis.filesToCreate);
        contextualFiles.push(...analysis.contextualFiles);
        continue;
      }
      
      switch ((action as any).type) {
        case 'CREATE_FILE':
          if ((action as any).path) {
            filesToCreate.push((action as any).path);
          }
          break;
          
        case 'ENHANCE_FILE':
          if ((action as any).path) {
            // Only add to filesToRead if there's no fallback create option
            if (!(action as any).fallback || (action as any).fallback !== 'create') {
              filesToRead.push((action as any).path);
            }
          }
          break;
          
        case 'MERGE_JSON':
        case 'MERGE_CONFIG':
          if ((action as any).path) {
            filesToRead.push((action as any).path);
          }
          break;
          
        case 'APPEND_TO_FILE':
        case 'PREPEND_TO_FILE':
          if ((action as any).path) {
            filesToRead.push((action as any).path);
          }
          break;
          
        case 'ADD_TS_IMPORT':
          if ((action as any).path) {
            filesToRead.push((action as any).path);
          }
          break;
          
        case 'EXTEND_SCHEMA':
          if ((action as any).path) {
            filesToRead.push((action as any).path);
          }
          break;
          
        case 'WRAP_CONFIG':
          if ((action as any).path) {
            filesToRead.push((action as any).path);
          }
          break;
          
        // Actions that require package.json access
        case 'INSTALL_PACKAGES':
        case 'ADD_SCRIPT':
          filesToRead.push('package.json');
          break;
          
        // Actions that don't require file access
        case 'ADD_ENV_VAR':
        case 'RUN_COMMAND':
          break;
          
        default:
          // Handle additional package.json actions (using string comparison to avoid TypeScript issues)
          if ((action as any).type === 'ADD_DEPENDENCY' || (action as any).type === 'ADD_DEV_DEPENDENCY') {
            filesToRead.push('package.json');
          }
      }
    }
    
    // 3. Combine all required files (remove duplicates)
    const allRequiredFiles = Array.from(new Set([
      ...filesToRead,
      ...contextualFiles
    ]));
    
    const analysis: BlueprintAnalysis = {
      needVFS: false, // This will be overridden by the main analyzeBlueprint method
      filesToRead,
      filesToCreate,
      contextualFiles,
      allRequiredFiles
    };
    
   
    
    // DEBUG: Show specific files for Drizzle blueprint
    // Note: blueprint.id is not available in this scope, so we'll check in the main analyzeBlueprint method
    
    return analysis;
  }
  
  /**
   * Pre-validate that all required files exist on disk
   */
  async validateRequiredFiles(analysis: BlueprintAnalysis, projectRoot: string): Promise<{
    valid: boolean;
    missingFiles: string[];
    existingFiles: string[];
  }> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const missingFiles: string[] = [];
    const existingFiles: string[] = [];
    
    for (const filePath of analysis.allRequiredFiles) {
      const fullPath = path.join(projectRoot, filePath);
      try {
        await fs.access(fullPath);
        existingFiles.push(filePath);
      } catch {
        missingFiles.push(filePath);
      }
    }
    
    const valid = missingFiles.length === 0;
    
 
    
    return {
      valid,
      missingFiles,
      existingFiles
    };
  }

  /**
   * Expand forEach actions into multiple individual actions
   */
  private expandForEachAction(action: BlueprintAction, context: ProjectContext): BlueprintAction[] {
    if (!(action as any).forEach) return [action];
    
    
    // Get the array to iterate over from context
    const forEachPath = (action as any).forEach.split('.');
    let forEachArray: any[] = [];
    
    // Navigate to the array in the context
    let current: any = context;
    for (const key of forEachPath) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return [action];
      }
    }
    
    if (!Array.isArray(current)) {
      return [action];
    }
    
    forEachArray = current;
    
    // Create individual actions for each item
    const expandedActions: BlueprintAction[] = [];
    
    for (let i = 0; i < forEachArray.length; i++) {
      const item = forEachArray[i];
      const expandedAction: BlueprintAction = {
        type: (action as any).type,
        ...((action as any).command && { command: (action as any).command.replace(/\{\{item\}\}/g, item) }),
        ...((action as any).path && { path: (action as any).path.replace(/\{\{item\}\}/g, item) }),
        ...((action as any).content && { content: (action as any).content.replace(/\{\{item\}\}/g, item) }),
        ...((action as any).template && { template: (action as any).template.replace(/\{\{item\}\}/g, item) }),
        ...((action as any).packages && { packages: (action as any).packages }),
        ...((action as any).workingDir && { workingDir: (action as any).workingDir }),
        ...((action as any).condition && { condition: (action as any).condition }),
        ...((action as any).params && { params: (action as any).params }),
        ...((action as any).fallback && { fallback: (action as any).fallback })
      };
      
      expandedActions.push(expandedAction);
    }
    
    return expandedActions;
  }
}