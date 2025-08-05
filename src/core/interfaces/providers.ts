/**
 * Provider Interfaces for Tech-Agnostic Architecture
 * 
 * Defines specific interfaces for each provider category.
 * These interfaces extend the base IPlugin interface with category-specific methods.
 */

import { IPlugin, AgentContext, PluginResult } from './base.js';

// ============================================================================
// FRAMEWORK PROVIDER
// ============================================================================

export interface IFrameworkProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  getFeatures(context: AgentContext): Promise<string[]>;
  getConfiguration(context: AgentContext): Promise<Record<string, any>>;
  generateProjectStructure(context: AgentContext): Promise<void>;
  installDependencies(context: AgentContext): Promise<void>;
  configureBuild(context: AgentContext): Promise<void>;
}

// ============================================================================
// UI PROVIDER
// ============================================================================

export interface IUIProvider extends IPlugin {
  install(context: AgentContext): Promise<void>;
  getComponents(context: AgentContext): Promise<string[]>;
  getThemeConfig(context: AgentContext): Promise<Record<string, any>>;
  generateComponent(context: AgentContext, name: string, props?: any): Promise<string>;
  configureStyling(context: AgentContext): Promise<void>;
  setupDesignSystem(context: AgentContext): Promise<void>;
}

// ============================================================================
// STATE PROVIDER
// ============================================================================

export interface IStateProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  getStateManagement(context: AgentContext): Promise<string>;
  configureStore(context: AgentContext): Promise<void>;
  generateHooks(context: AgentContext): Promise<void>;
  setupPersistence(context: AgentContext): Promise<void>;
}

// ============================================================================
// DATABASE PROVIDER
// ============================================================================

export interface IDatabaseProvider extends IPlugin {
  connect(context: AgentContext): Promise<void>;
  generateSchema(context: AgentContext): Promise<void>;
  runMigrations(context: AgentContext): Promise<void>;
  getOrmClient(context: AgentContext): Promise<any>;
  seedDatabase(context: AgentContext): Promise<void>;
  setupConnection(context: AgentContext): Promise<void>;
  configureEnvironment(context: AgentContext): Promise<void>;
}

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export interface IAuthProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  getClientMethods(context: AgentContext): Promise<string[]>;
  getServerMethods(context: AgentContext): Promise<string[]>;
  generateMiddleware(context: AgentContext): Promise<void>;
  configureProviders(context: AgentContext): Promise<void>;
  setupSession(context: AgentContext): Promise<void>;
  generateAuthComponents(context: AgentContext): Promise<void>;
}

// ============================================================================
// DEPLOYMENT PROVIDER
// ============================================================================

export interface IDeploymentProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  configureEnvironment(context: AgentContext): Promise<void>;
  generateDeploymentConfig(context: AgentContext): Promise<void>;
  setupCI(context: AgentContext): Promise<void>;
  configureDomain(context: AgentContext): Promise<void>;
  setupMonitoring(context: AgentContext): Promise<void>;
}

// ============================================================================
// TESTING PROVIDER
// ============================================================================

export interface ITestingProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  configureTestEnvironment(context: AgentContext): Promise<void>;
  generateTestFiles(context: AgentContext): Promise<void>;
  setupCoverage(context: AgentContext): Promise<void>;
  configureMocking(context: AgentContext): Promise<void>;
  setupE2E(context: AgentContext): Promise<void>;
}

// ============================================================================
// OBSERVABILITY PROVIDER
// ============================================================================

export interface IObservabilityProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  configureLogging(context: AgentContext): Promise<void>;
  setupMetrics(context: AgentContext): Promise<void>;
  configureTracing(context: AgentContext): Promise<void>;
  setupAlerts(context: AgentContext): Promise<void>;
  generateDashboard(context: AgentContext): Promise<void>;
}

// ============================================================================
// EMAIL PROVIDER
// ============================================================================

export interface IEmailProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  configureProvider(context: AgentContext): Promise<void>;
  generateEmailTemplates(context: AgentContext): Promise<void>;
  setupWebhooks(context: AgentContext): Promise<void>;
  configureTemplates(context: AgentContext): Promise<void>;
  setupDelivery(context: AgentContext): Promise<void>;
}

// ============================================================================
// CONTENT PROVIDER
// ============================================================================

export interface IContentProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  configureCMS(context: AgentContext): Promise<void>;
  generateContentTypes(context: AgentContext): Promise<void>;
  setupMedia(context: AgentContext): Promise<void>;
  configureWorkflows(context: AgentContext): Promise<void>;
  setupLocalization(context: AgentContext): Promise<void>;
}

// ============================================================================
// PERFORMANCE PROVIDER
// ============================================================================

export interface IPerformanceProvider extends IPlugin {
  setup(context: AgentContext): Promise<void>;
  configureCaching(context: AgentContext): Promise<void>;
  setupOptimization(context: AgentContext): Promise<void>;
  configureCDN(context: AgentContext): Promise<void>;
  setupCompression(context: AgentContext): Promise<void>;
  generateOptimizations(context: AgentContext): Promise<void>;
} 