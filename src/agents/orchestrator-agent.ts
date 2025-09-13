/**
 * Orchestrator Agent
 * 
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */

import { Recipe, Module, ExecutionResult } from '../types/recipe.js';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { PathHandler } from '../core/services/path/path-handler.js';
import { DecentralizedPathHandler } from '../core/services/path/decentralized-path-handler.js';
import { AdapterConfig } from '../types/adapter.js';
import { IntegrationRegistry } from '../core/services/integration/integration-registry.js';
import { IntegrationExecutor } from '../core/services/integration/integration-executor.js';
import { BlueprintExecutor } from '../core/services/blueprint/blueprint-executor.js';
import { VirtualFileSystem } from '../core/services/file-engine/virtual-file-system.js';
import { BlueprintAnalyzer } from '../core/services/blueprint-analyzer/index.js';
import * as path from 'path';
import { FrameworkAgent } from './core/framework-agent.js';
import { DatabaseAgent } from './core/database-agent.js';
import { AuthAgent } from './core/auth-agent.js';
import { UIAgent } from './core/ui-agent.js';
import { TestingAgent } from './core/testing-agent.js';
import { DeploymentAgent } from './core/deployment-agent.js';
import { StateAgent } from './core/state-agent.js';
import { PaymentAgent } from './core/payment-agent.js';
import { EmailAgent } from './core/email-agent.js';
import { ObservabilityAgent } from './core/observability-agent.js';
import { ContentAgent } from './core/content-agent.js';
import { BlockchainAgent } from './core/blockchain-agent.js';
import { ProjectContext, AgentResult } from '../types/agent.js';
import { Blueprint } from '../types/adapter.js';
import { ModuleLoaderService } from '../core/services/module-loader/index.js';
import { AgentExecutionService } from '../core/services/agent-execution/index.js';
import { ErrorHandler, ErrorCode } from '../core/services/error/index.js';
import { Logger, ExecutionTracer, LogLevel } from '../core/services/logging/index.js';

export class OrchestratorAgent {
  private projectManager: ProjectManager;
  private pathHandler: PathHandler;
  private decentralizedPathHandler: DecentralizedPathHandler | null = null;
  private moduleLoader: ModuleLoaderService;
  private agentExecutor: AgentExecutionService;
  private agents: Map<string, unknown>;
  private integrationRegistry: IntegrationRegistry;
  private integrationExecutor?: IntegrationExecutor;
  private blueprintAnalyzer: BlueprintAnalyzer;

  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
    this.pathHandler = projectManager.getPathHandler();
    this.moduleLoader = new ModuleLoaderService();
    this.agents = new Map();
    
    // Initialize integration services
    this.integrationRegistry = new IntegrationRegistry();
    
    // Initialize blueprint analyzer
    this.blueprintAnalyzer = new BlueprintAnalyzer();
    
    // Initialize agents (will be reconfigured with decentralized path handler)
    this.initializeAgents();
    
    // Initialize agent executor after agents are set up
    this.agentExecutor = new AgentExecutionService(this.agents);
  }

  /**
   * Initialize all agents
   */
  private initializeAgents(): void {
    this.agents.set('framework', new FrameworkAgent(this.pathHandler));
    this.agents.set('database', new DatabaseAgent(this.pathHandler));
    this.agents.set('auth', new AuthAgent(this.pathHandler));
    this.agents.set('ui', new UIAgent(this.pathHandler));
    this.agents.set('testing', new TestingAgent(this.pathHandler));
    this.agents.set('deployment', new DeploymentAgent(this.pathHandler));
    this.agents.set('state', new StateAgent(this.pathHandler));
    this.agents.set('payment', new PaymentAgent(this.pathHandler));
    this.agents.set('email', new EmailAgent(this.pathHandler));
    this.agents.set('observability', new ObservabilityAgent(this.pathHandler));
    this.agents.set('content', new ContentAgent(this.pathHandler));
    this.agents.set('blockchain', new BlockchainAgent(this.pathHandler));
  }

  /**
   * Reconfigure all agents with the decentralized path handler
   */
  private reconfigureAgents(): void {
    if (!this.decentralizedPathHandler) {
      throw new Error('Decentralized path handler not initialized');
    }

    // Update all agents to use the decentralized path handler
    this.agents.set('framework', new FrameworkAgent(this.decentralizedPathHandler));
    this.agents.set('database', new DatabaseAgent(this.decentralizedPathHandler));
    this.agents.set('auth', new AuthAgent(this.decentralizedPathHandler));
    this.agents.set('ui', new UIAgent(this.decentralizedPathHandler));
    this.agents.set('testing', new TestingAgent(this.decentralizedPathHandler));
    this.agents.set('deployment', new DeploymentAgent(this.decentralizedPathHandler));
    this.agents.set('state', new StateAgent(this.decentralizedPathHandler));
    this.agents.set('payment', new PaymentAgent(this.decentralizedPathHandler));
    this.agents.set('email', new EmailAgent(this.decentralizedPathHandler));
    this.agents.set('observability', new ObservabilityAgent(this.decentralizedPathHandler));
    this.agents.set('content', new ContentAgent(this.decentralizedPathHandler));
    this.agents.set('blockchain', new BlockchainAgent(this.decentralizedPathHandler));
  }

  /**
   * Execute a complete recipe
   */
  async executeRecipe(recipe: Recipe): Promise<ExecutionResult> {
    // Start execution trace
    const traceId = ExecutionTracer.startTrace('recipe_execution', {
      projectName: recipe.project.name,
      moduleCount: recipe.modules.length,
      hasIntegrations: !!(recipe.integrations && recipe.integrations.length > 0)
    });

    Logger.info(`🎯 Orchestrator Agent executing recipe: ${recipe.project.name}`, {
      traceId,
      operation: 'recipe_execution',
      moduleId: recipe.project.name
    });
    
    const results: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Setup framework and create decentralized path handler
      ExecutionTracer.logOperation(traceId, 'Setting up framework and path handler');
      const frameworkSetup = await this.moduleLoader.setupFramework(recipe, this.pathHandler);
      if (!frameworkSetup.success) {
        throw new Error(frameworkSetup.error);
      }
      
      this.decentralizedPathHandler = frameworkSetup.pathHandler!;
      
      // 2. Reconfigure all agents with the new path handler
      ExecutionTracer.logOperation(traceId, 'Reconfiguring agents with new path handler');
      this.reconfigureAgents();
      
      // 3. Initialize project directory
      ExecutionTracer.logOperation(traceId, 'Initializing project directory');
      await this.projectManager.initializeProject();
      Logger.info('📋 Project directory created - framework modules will handle setup', {
        traceId,
        operation: 'project_initialization'
      });
      
      
      // 4. Sort modules by execution order
      ExecutionTracer.logOperation(traceId, 'Sorting modules by execution order');
      const sortedModules = this.moduleLoader.sortModulesByExecutionOrder(recipe.modules);
      
      // 5. Execute modules using the NEW Contextual, Isolated VFS architecture
      const moduleResults = [];
      
      for (let i = 0; i < sortedModules.length; i++) {
        const module = sortedModules[i];
        
        if (!module) {
          errors.push(`Module at index ${i} is undefined`);
          break;
        }
        
        Logger.info(`🚀 [${i + 1}/${sortedModules.length}] Executing module: ${module.id} (${module.category})`, {
          traceId,
          operation: 'module_execution',
          moduleId: module.id,
          agentCategory: module.category
        });
        
        try {
          // Load adapter for this module
          const adapterResult = await this.moduleLoader.loadModuleAdapter(module);
          if (!adapterResult.success) {
            errors.push(adapterResult.error!);
            break;
          }
          
          // Create project context
          const context = this.moduleLoader.createProjectContext(
            recipe,
            module,
            adapterResult.adapter!.config,
            this.decentralizedPathHandler!
          );

          // NEW ARCHITECTURE: Contextual, Isolated VFS
          const blueprint = adapterResult.adapter!.blueprint;
          
          // Step 1: Analyze blueprint to determine required files
          Logger.info(`🔍 Analyzing blueprint: ${blueprint.name}`, {
            traceId,
            operation: 'blueprint_analysis',
            moduleId: module.id
          });
          
          const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint);
          
          // Step 2: Validate required files exist on disk
          const validation = await this.blueprintAnalyzer.validateRequiredFiles(analysis, this.pathHandler.getProjectRoot());
          if (!validation.valid) {
            const error = `Missing required files for ${module.id}: ${validation.missingFiles.join(', ')}`;
            errors.push(error);
            Logger.error(`❌ ${error}`, {
              traceId,
              operation: 'blueprint_validation',
              moduleId: module.id
            });
            break;
          }
          
          // Step 3: Create new VFS instance for this blueprint
          const vfs = new VirtualFileSystem(`blueprint-${blueprint.id}`, this.pathHandler.getProjectRoot());
          Logger.info(`🗂️ Created VFS for blueprint: ${blueprint.id}`, {
            traceId,
            operation: 'vfs_creation',
            moduleId: module.id
          });
          
          // Step 4: Pre-populate VFS with required files
          Logger.info(`📂 Pre-loading ${analysis.allRequiredFiles.length} files into VFS`, {
            traceId,
            operation: 'vfs_preload',
            moduleId: module.id,
            fileCount: analysis.allRequiredFiles.length
          });
          
          await this.preloadFilesIntoVFS(vfs, analysis.allRequiredFiles, this.pathHandler.getProjectRoot());
          
          // Step 5: Execute blueprint with pre-populated VFS
          const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot());
          const blueprintContext = {
            vfs,
            projectRoot: this.pathHandler.getProjectRoot(),
            externalFiles: []
          };
          
          const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, blueprintContext);
          
          // Step 6: Flush VFS to disk (atomic commit)
          if (blueprintResult.success) {
            await vfs.flushToDisk();
            Logger.info(`💾 VFS flushed to disk for blueprint: ${blueprint.id}`, {
              traceId,
              operation: 'vfs_flush',
              moduleId: module.id
            });
          }
          
          // Create module result from blueprint result
          const moduleResult = {
            success: blueprintResult.success,
            files: blueprintResult.files,
            errors: blueprintResult.errors,
            warnings: blueprintResult.warnings,
            executionTime: 0, // TODO: Add timing
            strategy: {
              needsVFS: true,
              complexity: 'complex' as const,
              reasons: ['Uses Contextual, Isolated VFS architecture']
            }
          };
          
          moduleResults.push(moduleResult);
          
          if (moduleResult.success) {
            results.push(...moduleResult.files);
            warnings.push(...moduleResult.warnings);
            Logger.info(`✅ Module ${module.id} completed successfully`, {
              traceId,
              operation: 'module_execution',
              moduleId: module.id,
              agentCategory: module.category,
              duration: moduleResult.executionTime,
              metadata: { filesCreated: moduleResult.files.length }
            });
          } else {
            errors.push(...moduleResult.errors);
            Logger.error(`❌ Module ${module.id} failed: ${moduleResult.errors.join(', ')}`, {
              traceId,
              operation: 'module_execution',
              moduleId: module.id,
              agentCategory: module.category
            });
            // Stop on first failure
            break;
          }
          
        } catch (error) {
          const errorResult = ErrorHandler.handleAgentError(error, module.category, module.id);
          errors.push(errorResult.error);
          Logger.error(`❌ Module ${module.id} failed: ${errorResult.error}`, {
            traceId,
            operation: 'module_execution',
            moduleId: module.id,
            agentCategory: module.category
          }, error instanceof Error ? error : undefined);
          // Stop on first failure
          break;
        }
      }
      
      const success = errors.length === 0;
      
      if (success) {
        Logger.info(`🎉 Recipe orchestrated successfully! ${results.length} files created`, {
          traceId,
          operation: 'recipe_execution',
          metadata: { 
            filesCreated: results.length,
            modulesExecuted: sortedModules.length
          }
        });
        
        // Log execution statistics
        const stats = this.agentExecutor.getExecutionStats(moduleResults);
        Logger.info(`📊 Execution stats: ${stats.successfulModules}/${stats.totalModules} modules successful`, {
          traceId,
          operation: 'execution_stats',
          metadata: {
            successfulModules: stats.successfulModules,
            totalModules: stats.totalModules,
            totalExecutionTime: stats.totalExecutionTime,
            vfsModules: stats.vfsModules,
            simpleModules: stats.simpleModules
          }
        });
        
        // Execute integration adapters if any are specified
        if (recipe.integrations && recipe.integrations.length > 0) {
          Logger.info(`🔗 Executing ${recipe.integrations.length} integration adapters...`, {
            traceId,
            operation: 'integration_execution',
            metadata: { integrationCount: recipe.integrations.length }
          });
          await this.executeIntegrationAdapters(recipe, results, errors, warnings);
        }
        
        // Create architech.json file
        ExecutionTracer.logOperation(traceId, 'Creating architech.json configuration file');
        await this.createArchitechConfig(recipe);
        
        
        // Final step: Install all dependencies
        if (!recipe.options?.skipInstall) {
          Logger.info('📦 Installing dependencies...', {
            traceId,
            operation: 'dependency_installation'
          });
          await this.installDependencies();
        }
      } else {
        Logger.error(`💥 Recipe orchestration failed with ${errors.length} errors`, {
          traceId,
          operation: 'recipe_execution',
          metadata: { errorCount: errors.length }
        });
      }
      
      // End execution trace
      ExecutionTracer.endTrace(traceId, success);
      
      return {
        success,
        modulesExecuted: success ? sortedModules.length : 0,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(error, 'orchestrator', 'recipe_execution');
      Logger.error(`💥 Orchestration failed: ${errorResult.error}`, {
        traceId,
        operation: 'recipe_execution'
      }, error instanceof Error ? error : undefined);
      
      // End execution trace with failure
      ExecutionTracer.endTrace(traceId, false, error instanceof Error ? error : undefined);
      
      return {
        success: false,
        modulesExecuted: 0,
        errors: [errorResult.error],
        warnings: []
      };
    }
  }


  /**
   * Pre-populate VFS with required files from disk
   */
  private async preloadFilesIntoVFS(vfs: VirtualFileSystem, filePaths: string[], projectRoot: string): Promise<void> {
    console.log(`📂 Pre-loading ${filePaths.length} files into VFS...`);
    
    const fs = await import('fs/promises');
    const path = await import('path');
    
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        await vfs.writeFile(filePath, content);
        console.log(`✅ Pre-loaded: ${filePath}`);
      } catch (error) {
        console.warn(`⚠️ Failed to pre-load ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with other files - some might not exist yet
      }
    }
    
    console.log(`✅ VFS pre-population complete`);
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent by category
   */
  getAgent(category: string): unknown {
    return this.agents.get(category);
  }

  /**
   * Create architech.json configuration file
   */
  private async createArchitechConfig(recipe: Recipe): Promise<void> {
    try {
      const config = {
        version: '1.0',
        project: {
          name: recipe.project.name,
          framework: recipe.project.framework,
          description: recipe.project.description,
          path: recipe.project.path
        },
        modules: recipe.modules.map(module => ({
          id: module.id,
          category: module.category,
          version: module.version,
          parameters: module.parameters,
          features: module.features || []
        })),
        options: recipe.options || {}
      };

      const configPath = path.join(this.pathHandler.getProjectRoot(), 'architech.json');
      const fs = await import('fs/promises');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log('📋 Created architech.json configuration file');
    } catch (error) {
      console.error('❌ Failed to create architech.json:', error);
    }
  }

  /**
   * Execute integration features
   */
  private async executeIntegrationAdapters(
    recipe: Recipe,
    results: string[],
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    try {
      // Initialize integration executor
      const blueprintExecutor = new BlueprintExecutor(recipe.project.path || '.');
      this.integrationExecutor = new IntegrationExecutor(blueprintExecutor);
      
      // Get available modules for validation (extract adapter IDs)
      const availableModules = recipe.modules.map(m => m.id.split('/').pop() || m.id);

      for (const integrationConfig of recipe.integrations!) {
        console.log(`🔗 Executing integration adapter: ${integrationConfig.name}`);

        // Load integration adapter
        const integration = await this.integrationRegistry.get(integrationConfig.name);
        if (!integration) {
          const error = `Integration adapter not found: ${integrationConfig.name}`;
          errors.push(error);
          console.error(`❌ ${error}`);
          continue;
        }

        // Validate requirements
        if (!this.integrationExecutor!.validateRequirements(integration, availableModules)) {
          const error = `Integration ${integrationConfig.name} requirements not met`;
          errors.push(error);
          console.error(`❌ ${error}`);
          continue;
        }

        // Validate features
        if (!this.integrationExecutor!.validateFeatures(integration, integrationConfig.features)) {
          const error = `Integration ${integrationConfig.name} features validation failed`;
          errors.push(error);
          console.error(`❌ ${error}`);
          continue;
        }

        // Create context for integration with shared VFS
        const context = {
          project: {
            ...recipe.project,
            path: this.pathHandler.getProjectRoot()
          },
          module: { 
            id: integrationConfig.name, 
            category: 'integration',
            version: '1.0.0',
            parameters: {}
          },
          pathHandler: this.decentralizedPathHandler,
          adapter: { id: integrationConfig.name },
          framework: recipe.project.framework
        };

        // NEW ARCHITECTURE: Contextual, Isolated VFS for Integration
        const blueprint = integration.blueprint;
        
        // Step 1: Analyze integration blueprint to determine required files
        console.log(`🔍 Analyzing integration blueprint: ${blueprint.name}`);
        const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint);
        
        // Step 2: Validate required files exist on disk
        const validation = await this.blueprintAnalyzer.validateRequiredFiles(analysis, this.pathHandler.getProjectRoot());
        if (!validation.valid) {
          const error = `Missing required files for integration ${integrationConfig.name}: ${validation.missingFiles.join(', ')}`;
          errors.push(error);
          console.error(`❌ ${error}`);
          continue;
        }
        
        // Step 3: Create new VFS instance for this integration blueprint
        const vfs = new VirtualFileSystem(`integration-${blueprint.id}`, this.pathHandler.getProjectRoot());
        console.log(`🗂️ Created VFS for integration blueprint: ${blueprint.id}`);
        
        // Step 4: Pre-populate VFS with required files
        console.log(`📂 Pre-loading ${analysis.allRequiredFiles.length} files into VFS for integration`);
        await this.preloadFilesIntoVFS(vfs, analysis.allRequiredFiles, this.pathHandler.getProjectRoot());
        
        // Step 5: Execute integration blueprint with pre-populated VFS
        const blueprintExecutor = new BlueprintExecutor(recipe.project.path || '.');
        const blueprintContext = {
          vfs,
          projectRoot: this.pathHandler.getProjectRoot(),
          externalFiles: []
        };
        
        const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, blueprintContext);
        
        // Step 6: Flush VFS to disk (atomic commit)
        if (blueprintResult.success) {
          await vfs.flushToDisk();
          console.log(`💾 VFS flushed to disk for integration blueprint: ${blueprint.id}`);
        } else {
          errors.push(...blueprintResult.errors);
          console.error(`❌ Integration blueprint failed: ${blueprintResult.errors.join(', ')}`);
          continue;
        }

        // Add created files to results
        results.push(...integration.provides.files);

        console.log(`✅ Integration adapter ${integrationConfig.name} completed successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Integration execution failed: ${errorMessage}`);
      console.error(`❌ Integration execution failed: ${errorMessage}`);
    }
  }


  /**
   * Install dependencies (delegated to project manager)
   */
  private async installDependencies(): Promise<void> {
    try {
      console.log('📦 Installing dependencies...');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('npm install', { 
        cwd: this.pathHandler.getProjectRoot()
      });
      
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.warn('⚠️ Failed to install dependencies automatically. Please run "npm install" manually.');
      console.warn(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
