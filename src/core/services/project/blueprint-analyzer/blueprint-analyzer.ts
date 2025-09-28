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
    console.log(`🔍 DEBUG: Blueprint ID: ${blueprint.id}`);
    console.log(`🔍 DEBUG: Total actions: ${blueprint.actions.length}`);
    
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
    
    console.log(`🎯 VFS Decision: ${needVFS ? 'VFS Mode' : 'Direct Mode'} for ${blueprint.name}`);
    
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
    
    if (needsVFS) {
      console.log(`🔧 VFS required: Found ${actions.filter(a => vfsRequiredActions.includes(a.type)).length} VFS-requiring actions`);
    } else {
      console.log(`💾 Direct mode: No VFS-requiring actions found`);
    }
    
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
      if (action.forEach) {
        console.log(`🔄 Found forEach action: ${action.forEach}`);
        const expandedActions = this.expandForEachAction(action, context);
        console.log(`🔄 Expanded into ${expandedActions.length} actions`);
        const analysis = this.analyzeActions(expandedActions, context);
        filesToRead.push(...analysis.filesToRead);
        filesToCreate.push(...analysis.filesToCreate);
        contextualFiles.push(...analysis.contextualFiles);
        continue;
      }
      
      switch (action.type) {
        case 'CREATE_FILE':
          if (action.path) {
            filesToCreate.push(action.path);
            console.log(`📝 Will create: ${action.path}`);
          }
          break;
          
        case 'ENHANCE_FILE':
          if (action.path) {
            // Only add to filesToRead if there's no fallback create option
            if (!action.fallback || action.fallback !== 'create') {
              filesToRead.push(action.path);
              console.log(`🔧 Will enhance: ${action.path}`);
            } else {
              console.log(`🔧 Will enhance (with fallback create): ${action.path}`);
            }
          }
          break;
          
        case 'MERGE_JSON':
        case 'MERGE_CONFIG':
          if (action.path) {
            filesToRead.push(action.path);
            console.log(`🔄 Will merge: ${action.path}`);
          }
          break;
          
        case 'APPEND_TO_FILE':
        case 'PREPEND_TO_FILE':
          if (action.path) {
            filesToRead.push(action.path);
            console.log(`➕ Will append/prepend to: ${action.path}`);
          }
          break;
          
        case 'ADD_TS_IMPORT':
          if (action.path) {
            filesToRead.push(action.path);
            console.log(`📦 Will add imports to: ${action.path}`);
          }
          break;
          
        case 'EXTEND_SCHEMA':
          if (action.path) {
            filesToRead.push(action.path);
            console.log(`🗄️ Will extend schema: ${action.path}`);
          }
          break;
          
        case 'WRAP_CONFIG':
          if (action.path) {
            filesToRead.push(action.path);
            console.log(`📦 Will wrap config: ${action.path}`);
          }
          break;
          
        // Actions that require package.json access
        case 'INSTALL_PACKAGES':
        case 'ADD_SCRIPT':
          filesToRead.push('package.json');
          console.log(`📦 Action ${action.type} requires package.json access`);
          break;
          
        // Actions that don't require file access
        case 'ADD_ENV_VAR':
        case 'RUN_COMMAND':
          console.log(`⚡ Action ${action.type} doesn't require file access`);
          break;
          
        default:
          // Handle additional package.json actions (using string comparison to avoid TypeScript issues)
          if (action.type === 'ADD_DEPENDENCY' || action.type === 'ADD_DEV_DEPENDENCY') {
            filesToRead.push('package.json');
            console.log(`📦 Action ${action.type} requires package.json access`);
          } else {
            console.warn(`⚠️ Unknown action type: ${action.type}`);
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
    
    console.log(`✅ Blueprint analysis complete:`, {
      filesToRead: analysis.filesToRead.length,
      filesToCreate: analysis.filesToCreate.length,
      contextualFiles: analysis.contextualFiles.length,
      totalRequiredFiles: analysis.allRequiredFiles.length
    });
    
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
    
    if (!valid) {
      console.warn(`⚠️ Missing required files:`, missingFiles);
    } else {
      console.log(`✅ All required files exist on disk`);
    }
    
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
    if (!action.forEach) return [action];
    
    console.log(`🔍 Expanding forEach: ${action.forEach}`);
    
    // Get the array to iterate over from context
    const forEachPath = action.forEach.split('.');
    let forEachArray: any[] = [];
    
    // Navigate to the array in the context
    let current: any = context;
    for (const key of forEachPath) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`forEach path not found: ${action.forEach} at key: ${key}`);
        return [action];
      }
    }
    
    if (!Array.isArray(current)) {
      console.warn(`forEach target is not an array: ${action.forEach}`);
      return [action];
    }
    
    forEachArray = current;
    
    // Create individual actions for each item
    const expandedActions: BlueprintAction[] = [];
    
    for (let i = 0; i < forEachArray.length; i++) {
      const item = forEachArray[i];
      const expandedAction: BlueprintAction = {
        type: action.type,
        ...(action.command && { command: action.command.replace(/\{\{item\}\}/g, item) }),
        ...(action.path && { path: action.path.replace(/\{\{item\}\}/g, item) }),
        ...(action.content && { content: action.content.replace(/\{\{item\}\}/g, item) }),
        ...(action.template && { template: action.template.replace(/\{\{item\}\}/g, item) }),
        ...(action.packages && { packages: action.packages }),
        ...(action.workingDir && { workingDir: action.workingDir }),
        ...(action.condition && { condition: action.condition }),
        ...(action.params && { params: action.params }),
        ...(action.fallback && { fallback: action.fallback })
      };
      
      expandedActions.push(expandedAction);
    }
    
    console.log(`🔄 Expanded forEach action into ${expandedActions.length} individual actions`);
    return expandedActions;
  }
}