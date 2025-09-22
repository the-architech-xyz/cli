/**
 * Blueprint Analyzer Service
 * 
 * Analyzes blueprints to determine all files that need to be pre-loaded into VFS
 * before execution. This is the critical component that enables the "Contextual, 
 * Isolated VFS" architecture.
 */

import { Blueprint, BlueprintAction } from '@thearchitech.xyz/types';

export interface BlueprintAnalysis {
  filesToRead: string[];
  filesToCreate: string[];
  contextualFiles: string[];
  allRequiredFiles: string[];
}

export class BlueprintAnalyzer {
  /**
   * Analyze a blueprint to determine all files that need to be pre-loaded
   */
  analyzeBlueprint(blueprint: Blueprint): BlueprintAnalysis {
    console.log(`🔍 Analyzing blueprint: ${blueprint.name}`);
    
    const filesToRead: string[] = [];
    const filesToCreate: string[] = [];
    const contextualFiles: string[] = [];
    
    // 1. Extract contextualFiles from blueprint definition
    if (blueprint.contextualFiles && Array.isArray(blueprint.contextualFiles)) {
      contextualFiles.push(...blueprint.contextualFiles);
      console.log(`📋 Found ${contextualFiles.length} contextual files:`, contextualFiles);
    }
    
    // 2. Analyze all actions to determine file dependencies
    for (const action of blueprint.actions) {
      if (!action) continue;
      
      switch (action.type) {
        case 'CREATE_FILE':
          if (action.path) {
            filesToCreate.push(action.path);
            console.log(`📝 Will create: ${action.path}`);
          }
          break;
          
        case 'ENHANCE_FILE':
          if (action.path) {
            // If ENHANCE_FILE has fallback: 'create', treat it as a CREATE_FILE
            if (action.fallback === 'create') {
              filesToCreate.push(action.path);
              console.log(`📝 Will create (enhance with fallback): ${action.path}`);
            } else {
              filesToRead.push(action.path);
              console.log(`🔧 Will enhance: ${action.path}`);
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
          console.warn(`⚠️ Unknown action type: ${action.type}`);
      }
    }
    
    // 3. Combine all required files (remove duplicates)
    const allRequiredFiles = Array.from(new Set([
      ...filesToRead,
      ...contextualFiles
    ]));
    
    const analysis: BlueprintAnalysis = {
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
    
    return analysis;
  }
  
  /**
   * Pre-validate that all required files exist on disk
   * Excludes files that will be created by the blueprint itself
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
    
    // Only validate files that are NOT being created by this blueprint
    const filesToValidate = analysis.allRequiredFiles.filter(filePath => 
      !analysis.filesToCreate.includes(filePath)
    );
    
    for (const filePath of filesToValidate) {
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
}