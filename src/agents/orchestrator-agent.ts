/**
 * Orchestrator Agent
 * 
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */

import { Recipe, Module, ExecutionResult, GlobalContext, LegacyProjectContext } from '@thearchitech.xyz/types';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { PathService } from '../core/services/path/path-service.js';
import { AdapterConfig } from '@thearchitech.xyz/types';
import { IntegrationRegistry } from '../core/services/integration/integration-registry.js';
import { IntegrationExecutor } from '../core/services/integration/integration-executor.js';
import { BlueprintExecutor } from '../core/services/execution/blueprint/blueprint-executor.js';
import { VirtualFileSystem } from '../core/services/file-system/file-engine/virtual-file-system.js';
import { BlueprintAnalyzer } from '../core/services/project/blueprint-analyzer/index.js';
import { ModuleFetcherService } from '../core/services/module-management/fetcher/module-fetcher.js';
import { CacheManagerService, UpdateChecker } from '../core/services/infrastructure/cache/index.js';
import { GlobalContextManager } from '../core/services/context/global-context-manager.js';
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
import { AgentResult, Blueprint } from '@thearchitech.xyz/types';
import { ModuleLoaderService } from '../core/services/module-management/module-loader/index.js';
import { AgentExecutionService } from '../core/services/execution/agent-execution/index.js';
import { ErrorHandler, ErrorCode } from '../core/services/infrastructure/error/index.js';
import { Logger, ExecutionTracer, LogLevel } from '../core/services/infrastructure/logging/index.js';
import { PrerequisiteValidator, ExecutionPlan } from '../core/services/validation/prerequisite-validator.js';
import * as fs from 'fs/promises';

export class OrchestratorAgent {
  private projectManager: ProjectManager;
  private pathHandler: PathService;
  private moduleLoader: ModuleLoaderService;
  private agentExecutor: AgentExecutionService;
  private agents: Map<string, unknown>;
  private integrationRegistry: IntegrationRegistry;
  private integrationExecutor?: IntegrationExecutor;
  private blueprintAnalyzer: BlueprintAnalyzer;
  private moduleFetcher: ModuleFetcherService;
  private cacheManager: CacheManagerService;
  private updateChecker: UpdateChecker;
  private contextManager: GlobalContextManager;
  private prerequisiteValidator: PrerequisiteValidator;

  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
    this.pathHandler = projectManager.getPathHandler();
    this.cacheManager = new CacheManagerService();
    this.moduleFetcher = new ModuleFetcherService(this.cacheManager);
    this.updateChecker = new UpdateChecker(this.cacheManager, this.moduleFetcher);
    this.moduleLoader = new ModuleLoaderService(this.moduleFetcher);
    this.prerequisiteValidator = new PrerequisiteValidator(this.moduleFetcher);
    this.agents = new Map();
    
    // Initialize global context manager
    this.contextManager = new GlobalContextManager({
      project: {
        name: projectManager.getProjectConfig().name,
        description: projectManager.getProjectConfig().description || '',
        version: projectManager.getProjectConfig().version || '1.0.0',
        path: projectManager.getProjectConfig().path,
        framework: { type: '', version: '', configuration: {} },
        structure: { srcDir: 'src', publicDir: 'public', configDir: '.', libDir: 'src/lib' },
        files: { created: [], modified: [], deleted: [] }
      },
      environment: {
        variables: new Map(),
        cliOptions: {},
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        paths: {
          projectRoot: projectManager.getProjectConfig().path,
          sourceRoot: path.join(projectManager.getProjectConfig().path, 'src'),
          configRoot: projectManager.getProjectConfig().path,
          libRoot: path.join(projectManager.getProjectConfig().path, 'src/lib')
        }
      }
    });
    
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
   * Initialize the orchestrator and all its services
   */
  async initialize(): Promise<void> {
    try {
      // Initialize modifiers first
      const { initializeModifiers } = await import('../core/services/file-system/modifiers/modifier-registration.js');
      initializeModifiers();
      
      // Initialize cache manager
      await this.cacheManager.initialize();
      
      // Initialize module fetcher (this will clone/update the marketplace repo)
      await this.moduleFetcher.initialize();
      
      // Initialize integration registry (this will load all integrations)
      await this.integrationRegistry.initialize();
      
      console.log('✅ Orchestrator initialized successfully');
    } catch (error) {
      console.error(`❌ Failed to initialize orchestrator: ${error}`);
      throw error;
    }
  }

  /**
   * Initialize all agents
   */
  private initializeAgents(): void {
    this.agents.set('framework', new FrameworkAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('database', new DatabaseAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('auth', new AuthAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('ui', new UIAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('testing', new TestingAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('deployment', new DeploymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('state', new StateAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('payment', new PaymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('email', new EmailAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('observability', new ObservabilityAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('content', new ContentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('blockchain', new BlockchainAgent(this.pathHandler, this.moduleFetcher));
  }

  /**
   * Reconfigure all agents with the decentralized path handler
   */
  private reconfigureAgents(): void {
    if (!this.pathHandler) {
      throw new Error('Path handler not initialized');
    }

    // Update all agents to use the path handler
    this.agents.set('framework', new FrameworkAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('database', new DatabaseAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('auth', new AuthAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('ui', new UIAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('testing', new TestingAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('deployment', new DeploymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('state', new StateAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('payment', new PaymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('email', new EmailAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('observability', new ObservabilityAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('content', new ContentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('blockchain', new BlockchainAgent(this.pathHandler, this.moduleFetcher));
  }


  /**
   * Execute a complete recipe using Topological Dependency Ordering
   */
  async executeRecipe(recipe: Recipe): Promise<ExecutionResult> {
    // Initialize the orchestrator
    await this.initialize();
    
    // Start execution trace
    const traceId = this.contextManager.getExecutionState().traceId;
    this.contextManager.updateExecutionState({
      status: 'running',
      currentPhase: 'initialization'
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
      // ============================================================================
      // STEP 1: BUILD EXECUTION PLAN (Topological Sort)
      // ============================================================================
      
      Logger.info('🔍 Building execution plan using topological dependency ordering...', {
        operation: 'execution_planning',
      moduleCount: recipe.modules.length
    });
    
      const executionPlan = await this.prerequisiteValidator.buildExecutionPlan(recipe);
      if (executionPlan.error) {
        Logger.error(`❌ Execution plan failed: ${executionPlan.error}`, {
          operation: 'execution_planning',
          error: executionPlan.error
      });
      
      return {
        success: false,
        modulesExecuted: 0,
          errors: [executionPlan.error],
          warnings: []
        };
      }
      
      Logger.info(`✅ Execution plan created: ${executionPlan.plan.join(' → ')}`, {
        operation: 'execution_planning',
        executionOrder: executionPlan.plan
      });
      
      // Check for module updates before generation
      Logger.info('🔍 Checking for module updates...', {
        operation: 'update_check',
        moduleCount: recipe.modules.length
      });
      
      const updateResult = await this.updateChecker.checkAndHandleUpdates(executionPlan.plan, {
        forceCheck: false,
        autoUpdate: false,
        silent: true
      });
      
      if (updateResult.updated) {
        Logger.info(`✅ Updated ${updateResult.updatedModules.length} modules`, {
          operation: 'update_check',
          updatedModules: updateResult.updatedModules
        });
      } else {
        Logger.info('✅ All modules are up to date', {
          operation: 'update_check'
        });
      }
    
    // Update global context with recipe information
    this.contextManager.updateProjectState({
      name: recipe.project.name,
      description: recipe.project.description || '',
      version: recipe.project.version || '1.0.0',
      framework: {
        type: recipe.project.framework,
        version: '1.0.0',
        configuration: {}
      }
    });

      // ============================================================================
      // STEP 2: SETUP FRAMEWORK AND PROJECT
      // ============================================================================
      
      // 1. Setup framework and create decentralized path handler
      ExecutionTracer.logOperation(traceId, 'Setting up framework and path handler');
      const frameworkSetup = await this.moduleLoader.setupFramework(recipe, this.pathHandler);
      if (!frameworkSetup.success) {
        throw new Error(frameworkSetup.error);
      }
      
      this.pathHandler = frameworkSetup.pathHandler!;
      
      // 2. Reconfigure all agents with the new path handler
      ExecutionTracer.logOperation(traceId, 'Reconfiguring agents with new path handler');
      this.reconfigureAgents();
      
      // 3. Initialize project directory
      ExecutionTracer.logOperation(traceId, 'Initializing project directory');
      await this.projectManager.initializeProject();
      Logger.info('📋 Project directory created - modules will handle setup', {
        traceId,
        operation: 'project_initialization'
      });
      
      // ============================================================================
      // STEP 3: EXECUTE MODULES IN TOPOLOGICAL ORDER
      // ============================================================================
      
      this.contextManager.updateExecutionState({
        currentPhase: 'modules'
      });
      
      Logger.info(`🚀 Executing ${executionPlan.plan.length} modules in dependency order...`, {
        traceId,
        operation: 'topological_execution',
        executionOrder: executionPlan.plan
      });
      
      const moduleResults = [];
      
      for (let i = 0; i < executionPlan.plan.length; i++) {
        const moduleId = executionPlan.plan[i];
        
        // Find the module configuration
        const module = recipe.modules.find(m => m.id === moduleId);
        if (!module) {
          errors.push(`Module ${moduleId} not found in recipe`);
          break;
        }
        
        // Update context with current module
        this.contextManager.updateExecutionState({
          currentModule: module.id
        });
        
        // Add module configuration to context
        this.contextManager.addModuleConfiguration(module.id, {
          id: module.id,
          category: module.category,
          version: module.version,
          parameters: module.parameters || {},
          features: {}
        });
        
        Logger.info(`🚀 [${i + 1}/${executionPlan.plan.length}] Executing module: ${module.id} (${module.category})`, {
          traceId,
          operation: 'module_execution',
          moduleId: module.id,
          agentCategory: module.category
        });
        
        try {
          // Load adapter for this module
          console.log(`🔍 Loading adapter for module: ${module.id} (${module.category})`);
          const adapterResult = await this.moduleLoader.loadModuleAdapter(module);
          if (!adapterResult.success) {
            console.error(`❌ Failed to load adapter for module ${module.id}: ${adapterResult.error}`);
            errors.push(adapterResult.error!);
            break;
          }
          console.log(`✅ Successfully loaded adapter for module: ${module.id}`);
          
          // Create legacy context for backward compatibility
          const context = this.createLegacyContext(recipe, module, adapterResult.adapter!.config);

          // ============================================================================
          // EXECUTION STRATEGY
          // ============================================================================
          
          const blueprint = adapterResult.adapter!.blueprint;
          
          // Step 1: Analyze blueprint to determine execution strategy
          const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint);
          const needsVFS = analysis.allRequiredFiles.length > 0;
          
          Logger.info(`🔍 Blueprint analysis: ${needsVFS ? 'VFS needed' : 'Direct execution'} (${analysis.allRequiredFiles.length} required files)`, {
            traceId,
            operation: 'blueprint_analysis',
            moduleId: module.id
          });
          
          let moduleResult;
          
          if (needsVFS) {
            // Complex blueprint - use VFS with file pre-loading
            Logger.info(`📂 Complex blueprint detected - using VFS with file pre-loading`, {
              traceId,
              operation: 'vfs_strategy',
              moduleId: module.id,
              fileCount: analysis.allRequiredFiles.length
            });
            
            // Validate required files exist on disk (created by previous modules)
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
            
            // Create VFS and pre-load files
            const vfs = new VirtualFileSystem(`blueprint-${blueprint.id}`, this.pathHandler.getProjectRoot());
            Logger.info(`🗂️ Created VFS for blueprint: ${blueprint.id}`, {
              traceId,
              operation: 'vfs_creation',
              moduleId: module.id
            });
            
            // Pre-populate VFS with required files
            Logger.info(`📂 Pre-loading ${analysis.allRequiredFiles.length} files into VFS`, {
              traceId,
              operation: 'vfs_preload',
              moduleId: module.id,
              fileCount: analysis.allRequiredFiles.length
            });
            
            await this.preloadFilesIntoVFS(vfs, analysis.allRequiredFiles, this.pathHandler.getProjectRoot());
            
            // Execute blueprint with VFS
            const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot(), this.moduleFetcher);
            const blueprintContext = {
              vfs,
              projectRoot: this.pathHandler.getProjectRoot(),
              externalFiles: []
            };
            
            const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, blueprintContext);
            
            // Flush VFS to disk (atomic commit)
            if (blueprintResult.success) {
              await vfs.flushToDisk();
              Logger.info(`💾 VFS flushed to disk for blueprint: ${blueprint.id}`, {
                traceId,
                operation: 'vfs_flush',
                moduleId: module.id
              });
            }
            
            moduleResult = {
              success: blueprintResult.success,
              files: blueprintResult.files,
              errors: blueprintResult.errors,
              warnings: blueprintResult.warnings,
              executionTime: 0,
              strategy: {
                needsVFS: true,
                complexity: analysis.allRequiredFiles.length > 5 ? 'complex' as const : analysis.allRequiredFiles.length > 2 ? 'moderate' as const : 'simple' as const,
                reasons: [`Requires ${analysis.allRequiredFiles.length} files`]
              }
            };
            
          } else {
            // Simple blueprint - execute directly on disk
            Logger.info(`🏗️ Simple blueprint detected - executing directly on disk`, {
              traceId,
              operation: 'direct_execution',
              moduleId: module.id
            });
            
            // Debug: Log package.json before blueprint execution
            try {
              const packageJsonPath = path.join(this.pathHandler.getProjectRoot(), 'package.json');
              const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
              console.log(`🔍 [Orchestrator] package.json BEFORE blueprint execution:`, packageJsonContent);
            } catch (error) {
              console.log(`🔍 [Orchestrator] package.json not found before blueprint execution`);
            }
            
            // Execute blueprint directly on disk with null VFS context
            const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot(), this.moduleFetcher);
            const blueprintContext = {
              vfs: null, // No VFS for direct execution
              projectRoot: this.pathHandler.getProjectRoot(),
              externalFiles: []
            };
            const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, blueprintContext);
            
            // Debug: Log package.json after blueprint execution
            try {
              const packageJsonPath = path.join(this.pathHandler.getProjectRoot(), 'package.json');
              const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
              console.log(`🔍 [Orchestrator] package.json AFTER blueprint execution:`, packageJsonContent);
            } catch (error) {
              console.log(`🔍 [Orchestrator] package.json not found after blueprint execution`);
            }
            
            moduleResult = {
              success: blueprintResult.success,
              files: blueprintResult.files,
              errors: blueprintResult.errors,
              warnings: blueprintResult.warnings,
              executionTime: 0,
              strategy: {
                needsVFS: false,
                complexity: 'simple' as const,
                reasons: ['Simple blueprint - no file dependencies']
              }
            };
          }
          
          // Add module result to global context
          this.contextManager.addModuleResult(module.id, {
            success: moduleResult.success,
            files: moduleResult.files,
            errors: moduleResult.errors,
            warnings: moduleResult.warnings,
            dependencies: [],
            environmentVariables: []
          });
          
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
              metadata: { 
                filesCreated: moduleResult.files.length,
                strategy: moduleResult.strategy.complexity
              }
            });
          } else {
            errors.push(...moduleResult.errors);
            Logger.error(`❌ Module ${module.id} failed: ${moduleResult.errors.join(', ')}`, {
              traceId,
              operation: 'module_execution',
              moduleId: module.id,
              agentCategory: module.category
            });
            // Stop on first failure (Fail-Fast strategy)
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
          // Stop on first failure (Fail-Fast strategy)
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
            modulesExecuted: executionPlan.plan.length
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
          this.contextManager.updateExecutionState({
            currentPhase: 'integrations'
          });
          
          Logger.info(`🔗 Executing ${recipe.integrations.length} integration adapters...`, {
            traceId,
            operation: 'integration_execution',
            metadata: { integrationCount: recipe.integrations.length }
          });
          await this.executeIntegrationAdapters(recipe, results, errors, warnings);
        }
        
        // Finalize package.json and .env.example
        this.contextManager.updateExecutionState({
          currentPhase: 'finalization'
        });
        
        await this.finalizePackageJson();
        await this.generateEnvExample();
        
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
      
      // Update final execution state
      this.contextManager.updateExecutionState({
        status: success ? 'completed' : 'failed',
        endTime: new Date()
      });
      
      // End execution trace
      ExecutionTracer.endTrace(traceId, success);
      
      return {
        success,
        modulesExecuted: success ? executionPlan.plan.length : 0,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(error, 'orchestrator', 'recipe_execution');
      Logger.error(`💥 Orchestration failed: ${errorResult.error}`, {
        traceId,
        operation: 'recipe_execution'
      }, error instanceof Error ? error : undefined);
      
      // Update context with failure
      this.contextManager.updateExecutionState({
        status: 'failed',
        endTime: new Date()
      });
      
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
      const blueprintExecutor = new BlueprintExecutor(recipe.project.path || '.', this.moduleFetcher);
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
          pathHandler: this.pathHandler,
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
        const blueprintExecutor = new BlueprintExecutor(recipe.project.path || '.', this.moduleFetcher);
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

  /**
   * Create legacy context for backward compatibility
   */
  private createLegacyContext(recipe: Recipe, module: any, adapter: any): LegacyProjectContext {
    const allModules = recipe.modules.reduce((acc, mod) => {
      acc[mod.id] = mod;
      return acc;
    }, {} as Record<string, any>);

    return {
      project: {
        name: recipe.project.name,
        path: this.pathHandler.getProjectRoot(),
        framework: recipe.project.framework,
        description: recipe.project.description || '',
        author: recipe.project.author || '',
        version: recipe.project.version || '1.0.0',
        license: recipe.project.license || 'MIT'
      },
      module: module,
      pathHandler: this.pathHandler,
      adapter: adapter,
      framework: recipe.project.framework,
      cliArgs: {},
      projectRoot: this.pathHandler.getProjectRoot(),
      modules: allModules,
      databaseModule: recipe.modules.find(m => m.category === 'database'),
      paymentModule: recipe.modules.find(m => m.category === 'payment'),
      authModule: recipe.modules.find(m => m.category === 'auth'),
      emailModule: recipe.modules.find(m => m.category === 'email'),
      observabilityModule: recipe.modules.find(m => m.category === 'observability'),
      stateModule: recipe.modules.find(m => m.category === 'state'),
      uiModule: recipe.modules.find(m => m.category === 'ui'),
      testingModule: recipe.modules.find(m => m.category === 'testing'),
      deploymentModule: recipe.modules.find(m => m.category === 'deployment'),
      contentModule: recipe.modules.find(m => m.category === 'content'),
      blockchainModule: recipe.modules.find(m => m.category === 'blockchain')
    };
  }

  /**
   * Finalize package.json with all collected dependencies
   */
  private async finalizePackageJson(): Promise<void> {
    try {
      const dependencyState = this.contextManager.getDependencyState();
      const packageJsonPath = path.join(this.contextManager.getContext().environment.paths.projectRoot, 'package.json');
      
      // Read existing package.json
      const existingPackage = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(existingPackage);
      
      // Merge all collected dependencies
      packageJson.dependencies = { 
        ...packageJson.dependencies, 
        ...Object.fromEntries(dependencyState.packages.dependencies) 
      };
      packageJson.devDependencies = { 
        ...packageJson.devDependencies, 
        ...Object.fromEntries(dependencyState.packages.devDependencies) 
      };
      packageJson.scripts = { 
        ...packageJson.scripts, 
        ...Object.fromEntries(dependencyState.scripts) 
      };
      
      // Update metadata
      const projectState = this.contextManager.getProjectState();
      packageJson.name = projectState.name || 'test-full-app';
      packageJson.description = projectState.description || '';
      packageJson.version = projectState.version || '1.0.0';
      
      // Write back
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      console.log('✅ Package.json finalized with all dependencies');
    } catch (error) {
      console.error(`❌ Failed to finalize package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate .env.example file with all collected environment variables
   */
  private async generateEnvExample(): Promise<void> {
    try {
      const envVars = this.contextManager.getContext().environment.variables;
      const envExamplePath = path.join(this.contextManager.getContext().environment.paths.projectRoot, '.env.example');
      
      let envExample = '# Environment Variables\n# Copy this file to .env.local and fill in your values\n\n';
      
      for (const [key, variable] of envVars) {
        envExample += `# ${variable.description}\n`;
        envExample += `${key}=${variable.value}\n\n`;
      }
      
      await fs.writeFile(envExamplePath, envExample);
      
      console.log('✅ .env.example generated with all environment variables');
    } catch (error) {
      console.error(`❌ Failed to generate .env.example: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
