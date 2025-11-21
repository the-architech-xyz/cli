/**
 * Create File Handler
 * 
 * Handles CREATE_FILE actions in both VFS and Direct modes.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, ConflictResolution, MergeInstructions, CreateFileAction, BlueprintActionType, ModifierType } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { TemplateService } from '../../../file-system/template/template-service.js';
import { MarketplaceService } from '../../../marketplace/marketplace-service.js';
import { Logger } from '../../../infrastructure/logging/index.js';
import * as path from 'path';

export class CreateFileHandler extends BaseActionHandler {
  private enhanceFileHandler: BaseActionHandler | null = null;

  constructor(enhanceFileHandler?: BaseActionHandler) {
    super();
    this.enhanceFileHandler = enhanceFileHandler || null;
  }

  getSupportedActionType(): string {
    return 'CREATE_FILE';
  }

  async handle(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs: VirtualFileSystem
  ): Promise<ActionResult> {
    // Type guard to narrow the action type
    const createAction = action as CreateFileAction & { context?: Record<string, any> };
    
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    if (!createAction.path) {
      return { success: false, error: 'CREATE_FILE action missing path' };
    }

    // Process template path using TemplateService for full path variable support
    // Paths are resolved as absolute (package-prefixed) in monorepo or relative in single-repo
    // VFS handles all paths as absolute from project root
    const filePath = TemplateService.processTemplate(createAction.path, context);

    // Validate that no unresolved path variables remain
    const unresolvedPathPattern = /\$\{paths\.([^}]+)\}/g;
    const unresolvedMatches = filePath.match(unresolvedPathPattern);
    if (unresolvedMatches && unresolvedMatches.length > 0) {
      const availablePaths = context.pathHandler?.getAvailablePaths() || [];
      return {
        success: false,
        error: `Unresolved path variables in file path: ${unresolvedMatches.join(', ')}. Available paths: ${availablePaths.join(', ')}. Original path: ${createAction.path}`
      };
    }

    // Handle both content and template properties first
    let content: string;
    if (createAction.template) {
      // Load and process template with action context
      try {
        content = await this.loadTemplate(createAction.template, projectRoot, context, createAction.context);
      } catch (error) {
        return { 
          success: false, 
          error: `Failed to load template ${createAction.template}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    } else if (createAction.content) {
      // Process inline content using TemplateService for full template support
      content = TemplateService.processTemplate(createAction.content, context);
    } else {
      return { success: false, error: 'CREATE_FILE action missing content or template' };
    }

    // Check if file already exists in VFS
    const fileExists = vfs.fileExists(filePath);
    
    if (fileExists) {
      console.log(`🔄 File already exists: ${filePath}, applying conflict resolution...`);
      
      // Apply conflict resolution strategy - default to 'replace' for CREATE_FILE actions
      const conflictResolution = createAction.conflictResolution || { strategy: 'replace', priority: 1 };
      
      switch (conflictResolution.strategy) {
        case 'skip':
          console.log(`  ⏭️ Skipping file creation: ${filePath}`);
          return { 
            success: true, 
            files: [filePath],
            message: `File skipped (already exists): ${filePath}`
          };
          
        case 'replace':
          console.log(`  🔄 Replacing existing file: ${filePath}`);
          // Use writeFile for replacement instead of createFile
          try {
            vfs.writeFile(filePath, content);
            return { 
              success: true, 
              files: [filePath],
              message: `File replaced: ${filePath}`
            };
          } catch (error) {
            return { 
              success: false, 
              error: `Failed to replace file: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
          }
          
        case 'merge':
          console.log(`  🔀 Merging with existing file: ${filePath}`);
          
          // Auto-detect merge strategy for JSON files if mergeInstructions not provided
          if (!createAction.mergeInstructions && filePath.endsWith('.json')) {
            // For package.json, use package-json-merger
            if (filePath === 'package.json' || filePath.endsWith('/package.json')) {
              createAction.mergeInstructions = {
                modifier: ModifierType.PACKAGE_JSON_MERGER,
                strategy: 'deep-merge',
                params: {}
              };
            } else {
              // For other JSON files, use json-merger
              createAction.mergeInstructions = {
                modifier: ModifierType.JSON_MERGER,
                strategy: 'deep-merge',
                params: {}
              };
            }
          }
          
          return await this.handleDelegationMerge(action, context, projectRoot, vfs, filePath, createAction);
          
        case 'error':
        default:
          return { 
            success: false, 
            error: `File already exists: ${filePath}` 
          };
      }
    }

    try {
      // Create file in VFS (unified VFS mode)
      vfs.createFile(filePath, content);

      const createdFiles = [filePath];
      let message = `File created: ${filePath}`;

      // Auto-generate wrappers if this is a shared route
      if (this.shouldAutoGenerateWrappers(filePath, createAction, context)) {
        try {
          const wrapperFiles = await this.generateWrappers(
            createAction,
            context,
            vfs,
            filePath
          );
          createdFiles.push(...wrapperFiles);
          message = `File created: ${filePath} with ${wrapperFiles.length} wrapper(s)`;
        } catch (wrapperError) {
          console.warn(`⚠️  Failed to generate wrappers: ${wrapperError instanceof Error ? wrapperError.message : 'Unknown error'}`);
          // Continue even if wrapper generation fails - main file was created
        }
      }

      return { 
        success: true, 
        files: createdFiles,
        message
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : String(error);
      
      Logger.error(
        `Failed to create file: ${errorMessage}`,
        {
          operation: 'create_file',
          filePath: createAction.path,
          errorStack,
        },
        error instanceof Error ? error : undefined
      );
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Handle Delegation Merge: Transform CREATE_FILE into ENHANCE_FILE
   * Uses the intelligent Modifier system for AST-based merging
   */
  private async handleDelegationMerge(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs: VirtualFileSystem,
    filePath: string,
    createAction: CreateFileAction
  ): Promise<ActionResult> {
    try {
      // Check if mergeInstructions is defined
      if (!createAction.mergeInstructions) {
        return {
          success: false,
          error: 'Smart merge requires mergeInstructions to be defined'
        };
      }

      // Get new content from template or content
      let newContent: string;
      if (createAction.template) {
        newContent = await this.loadTemplate(createAction.template, projectRoot, context, (createAction as any).context);
      } else if (createAction.content) {
        newContent = TemplateService.processTemplate(createAction.content, context);
      } else {
        return {
          success: false,
          error: 'Smart merge requires content or template'
        };
      }

      // For js-config-merger, we need to parse the content to extract properties
      let targetProperties: any = null;
      if (createAction.mergeInstructions.modifier === ModifierType.JS_CONFIG_MERGER) {
        try {
          // Parse the JavaScript content to extract the config object
          targetProperties = await this.parseJsConfigContent(newContent, createAction.mergeInstructions.params?.exportName || 'default');
        } catch (error) {
          return {
            success: false,
            error: `Failed to parse JavaScript config content: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      // For package-json-merger and json-merger, parse JSON content
      let mergeParams: any = { ...createAction.mergeInstructions.params };
      if (createAction.mergeInstructions.modifier === ModifierType.PACKAGE_JSON_MERGER || 
          createAction.mergeInstructions.modifier === ModifierType.JSON_MERGER) {
        try {
          const parsedContent = JSON.parse(newContent);
          mergeParams.merge = parsedContent;
        } catch (error) {
          return {
            success: false,
            error: `Failed to parse JSON content for merge: ${error instanceof Error ? error.message : 'Invalid JSON'}`
          };
        }
      }

      // Dynamically construct ENHANCE_FILE action
      const enhanceAction: BlueprintAction = {
        type: BlueprintActionType.ENHANCE_FILE,

        path: filePath,
        modifier: (createAction.mergeInstructions.modifier as ModifierType) || ModifierType.JS_CONFIG_MERGER,
        params: {
          ...mergeParams,
          content: newContent,
          targetProperties: targetProperties,
          strategy: createAction.mergeInstructions.strategy || 'deep-merge'
        }
      };

      // Get EnhanceFileHandler and delegate
      if (!this.enhanceFileHandler) {
        return {
          success: false,
          error: 'ENHANCE_FILE handler not available for delegation merge'
        };
      }

      // Delegate to EnhanceFileHandler
      const result = await this.enhanceFileHandler.handle(enhanceAction, context, projectRoot, vfs);

      if (result.success) {
        console.log(`  🔀 Delegation merge completed: ${filePath}`);
        return {
          success: true,
          files: [filePath],
          message: `File merged via delegation: ${filePath}`
        };
      } else {
        return {
          success: false,
          error: `Delegation merge failed: ${result.error}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Delegation merge error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse JavaScript config content to extract properties
   */
  private async parseJsConfigContent(content: string, exportName: string): Promise<any> {
    try {
      // For now, let's use a simple approach: evaluate the JavaScript content
      // This is safe because we're only parsing our own template content
      const vm = await import('vm');
      const context = { module: { exports: {} }, exports: {} };
      
      // Create a safe context for evaluation
      const sandbox: any = {
        module: { exports: {} },
        exports: {},
        require: () => ({}), // Mock require function
        console: { log: () => {} } // Mock console
      };
      
      // Evaluate the content
      vm.createContext(sandbox);
      vm.runInContext(content, sandbox);
      
      // Extract the config object based on export type
      if (exportName === 'default') {
        return sandbox.module.exports.default || sandbox.module.exports;
      } else if (exportName === 'module.exports') {
        return sandbox.module.exports;
      } else {
        return sandbox.module.exports[exportName] || sandbox.module.exports;
      }
    } catch (error) {
      // If evaluation fails, try to parse as JSON (for simple configs)
      try {
        return JSON.parse(content);
      } catch {
        throw new Error(`Failed to parse JavaScript config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Load template content from file and render with merged context
   * 
   * The absolute path to a template is always:
   * [MARKETPLACE_ROOT_PATH] + [RESOLVED_MODULE_ID] + templates/ + [TEMPLATE_FILENAME]
   * 
   * Where RESOLVED_MODULE_ID is either:
   * - integrations/[shortId] for integration modules
   * - adapters/[shortId] for adapter modules
   */
  private async loadTemplate(templatePath: string, projectRoot: string, context: ProjectContext, actionContext?: Record<string, any>): Promise<string> {
    const moduleId = context.module.id;
    // Pass context to MarketplaceService for marketplace path resolution
    const templateContent = await MarketplaceService.loadTemplate(moduleId, templatePath, context);
    
    // Merge action context with global context for template rendering
    const mergedContext = this.mergeTemplateContext(context, actionContext);
    
    // Render template with merged context
    return TemplateService.processTemplate(templateContent, mergedContext);
  }

  /**
   * Merge action context with global project context for template rendering
   */
  private mergeTemplateContext(projectContext: ProjectContext, actionContext?: Record<string, any>): ProjectContext {
    if (!actionContext) {
      return projectContext;
    }

    // Create a deep copy of the project context to avoid mutations
    const mergedContext = JSON.parse(JSON.stringify(projectContext));
    
    // Merge action context into the global context
    // Action context takes precedence over global context
    Object.assign(mergedContext, actionContext);
    
    // Ensure features array is properly merged
    if (actionContext.features && Array.isArray(actionContext.features)) {
      mergedContext.features = actionContext.features;
    }
    
    return mergedContext;
  }

  /**
   * Check if file should have auto-generated wrappers
   */
  private shouldAutoGenerateWrappers(
    filePath: string,
    action: CreateFileAction,
    context: ProjectContext
  ): boolean {
    const createAction = action as CreateFileAction & { sharedRoutes?: any };
    
    // 1. Explicit enable
    if (createAction.sharedRoutes?.enabled === true) {
      return true;
    }
    
    // 2. Explicit disable
    if (createAction.sharedRoutes?.enabled === false) {
      return false;
    }
    
    // 3. Auto-detect (default behavior)
    return this.isSharedRoute(filePath, context);
  }

  /**
   * Check if file is a shared route component
   */
  private isSharedRoute(filePath: string, context: ProjectContext): boolean {
    // Must be in shared package routes (not in apps/)
    // Routes in apps/ are app-specific, not shared
    if (filePath.includes('apps/') || !filePath.includes('shared') || !filePath.includes('routes/')) {
      return false;
    }
    
    // Must follow Page naming convention (*Page.tsx)
    if (!filePath.match(/[A-Z]\w+Page\.tsx?$/)) {
      return false;
    }
    
    // Must have multiple frontend apps
    const frontendApps = context.frontendApps || [];
    if (frontendApps.length < 2) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate wrappers for shared routes
   */
  private async generateWrappers(
    action: CreateFileAction,
    context: ProjectContext,
    vfs: VirtualFileSystem,
    sharedComponentPath: string
  ): Promise<string[]> {
    const createAction = action as CreateFileAction & { sharedRoutes?: any };
    const frontendApps = context.frontendApps || [];
    const generatedFiles: string[] = [];
    
    // Safety check: Don't generate wrappers for files in apps/ directory
    // These are app-specific routes, not shared routes
    if (sharedComponentPath.includes('apps/')) {
      return generatedFiles;
    }
    
    if (frontendApps.length === 0) {
      return generatedFiles;
    }
    
    // Determine target apps
    const targetApps = createAction.sharedRoutes?.apps || 
      frontendApps.map((app) => app.type as 'web' | 'mobile');
    
    // Extract route info
    const routePath = createAction.sharedRoutes?.routePath || 
      this.extractRoutePath(sharedComponentPath, context);
    const componentName = createAction.sharedRoutes?.componentName || 
      this.extractComponentName(sharedComponentPath);
    
    // Generate wrapper for each app
    for (const appType of targetApps) {
      const app = frontendApps.find((a) => a.type === appType);
      if (!app) continue;
      
      const wrapperPath = this.getWrapperPath(
        appType,
        routePath,
        app.package,
        app.framework
      );
      
      const wrapperContent = this.generateWrapperContent(
        appType,
        componentName,
        sharedComponentPath,
        app.framework
      );
      
      // Create wrapper file
      vfs.createFile(wrapperPath, wrapperContent);
      generatedFiles.push(wrapperPath);
      
      console.log(`  ✅ Auto-generated ${appType} wrapper: ${wrapperPath}`);
    }
    
    return generatedFiles;
  }

  /**
   * Get wrapper file path for app
   */
  private getWrapperPath(
    appType: 'web' | 'mobile',
    routePath: string,
    appPackage: string,
    framework: string
  ): string {
    if (appType === 'web' && framework === 'nextjs') {
      // Next.js: apps/web/src/app/(auth)/login/page.tsx
      return `${appPackage}/src/app/${routePath}/page.tsx`;
    } else if (appType === 'mobile' && framework === 'expo') {
      // Expo Router: apps/mobile/app/(auth)/login.tsx
      return `${appPackage}/app/${routePath}.tsx`;
    }
    
    throw new Error(`Unsupported app type/framework: ${appType}/${framework}`);
  }

  /**
   * Generate wrapper content
   */
  private generateWrapperContent(
    appType: 'web' | 'mobile',
    componentName: string,
    sharedComponentPath: string,
    framework: string
  ): string {
    const importPath = this.convertToImportPath(sharedComponentPath);
    
    if (appType === 'web' && framework === 'nextjs') {
      return `'use client';
import { ${componentName} } from '${importPath}';

export default ${componentName};`;
    } else if (appType === 'mobile' && framework === 'expo') {
      return `import { ${componentName} } from '${importPath}';

export default ${componentName};`;
    }
    
    throw new Error(`Unsupported app type/framework: ${appType}/${framework}`);
  }

  /**
   * Convert file path to import path
   */
  private convertToImportPath(filePath: string): string {
    // Remove file extension
    let importPath = filePath.replace(/\.tsx?$/, '');
    
    // V2 COMPLIANCE: No packages/shared - convert granular packages to workspace imports
    // Convert packages/{package}/... to @{projectName}/{package}/...
    // This is handled by workspace reference builder, so we don't need special handling here
    
    return importPath;
  }

  /**
   * Extract route path from file path
   */
  private extractRoutePath(filePath: string, context: ProjectContext): string {
    // V2 COMPLIANCE: Routes are in apps, not packages/shared
    // apps/web/src/app/(auth)/login/page.tsx → (auth)/login
    
    // Remove package prefix
    let routePath = filePath.replace(/^packages\/shared\/routes\//, '');
    
    // Get directory structure
    const dirPath = path.dirname(routePath);
    
    // Extract component name and convert to route name
    const fileName = path.basename(filePath, path.extname(filePath));
    const routeName = fileName.replace(/Page$/, '').toLowerCase();
    
    // Combine: auth + login → (auth)/login
    // If dirPath is '.', just use routeName
    if (dirPath === '.' || dirPath === '') {
      return routeName;
    }
    
    return `${dirPath}/${routeName}`;
  }

  /**
   * Extract component name from file path
   */
  private extractComponentName(filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName;
  }

}
