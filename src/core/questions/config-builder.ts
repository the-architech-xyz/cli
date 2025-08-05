/**
 * Config Builder
 * 
 * Builds final project configuration from recommendations and customizations.
 * Maps to plugins and generates artifacts.
 */

import { 
  ProjectRecommendation, 
  ProjectConfig,
  TechStackRecommendation
} from '../../types/smart-questions.js';

export class ConfigBuilder {
  /**
   * Build final project configuration
   */
  buildConfig(recommendation: ProjectRecommendation, customizations: Record<string, any>): ProjectConfig {
    // Map tech stack to plugin names
    const plugins = this.mapToPlugins(recommendation);
    
    // Build tech stack configuration
    const techStack = this.buildTechStackConfig(recommendation, customizations);
    
    // Build customizations
    const finalCustomizations = this.buildCustomizations(recommendation, customizations);
    
    return {
      projectName: '', // Will be set by CLI
      projectType: recommendation.projectType,
      features: recommendation.features,
      techStack,
      customizations: finalCustomizations,
      plugins,
      complexity: recommendation.complexity,
      estimatedTime: recommendation.estimatedTime
    };
  }

  /**
   * Map recommendation to plugin names
   */
  private mapToPlugins(recommendation: ProjectRecommendation): string[] {
    const plugins: string[] = [];
    
    // Always include Next.js as the base framework
    plugins.push('nextjs');
    
    // Map tech stack to plugins using ACTUAL recommendations
    if (recommendation.techStack.database) {
      plugins.push(recommendation.techStack.database.name);
    }
    
    if (recommendation.techStack.auth) {
      plugins.push(recommendation.techStack.auth.name);
    }
    
    if (recommendation.techStack.ui) {
      plugins.push(recommendation.techStack.ui.name);
    }
    
    if (recommendation.techStack.deployment) {
      plugins.push(recommendation.techStack.deployment.name);
    }
    
    if (recommendation.techStack.testing) {
      plugins.push(recommendation.techStack.testing.name);
    }
    
    return plugins;
  }

  /**
   * Build tech stack configuration
   */
  buildTechStackConfig(recommendation: ProjectRecommendation, customizations: Record<string, any>): Record<string, any> {
    const config: Record<string, any> = {};
    
    // Framework configuration - CRITICAL for PathResolver detection
    config.framework = {
      name: 'nextjs',
      version: '14',
      features: ['app-router', 'typescript', 'eslint']
    };
    
    // Database configuration
    config.database = {
      provider: this.getDatabaseProvider(recommendation.techStack.database.name),
      orm: recommendation.techStack.database.name,
      features: this.getDatabaseFeatures(recommendation.projectType, customizations)
    };
    
    // Auth configuration
    config.auth = {
      provider: recommendation.techStack.auth.name,
      providers: ['credentials'], // Default to credentials provider
      features: this.getAuthFeatures(recommendation.projectType, customizations)
    };
    
    // UI configuration
    config.ui = {
      library: recommendation.techStack.ui.name,
      components: this.getUIComponents(recommendation.projectType, customizations),
      theme: 'system',
      styling: 'tailwind',
      features: this.getUIFeatures(recommendation.projectType, customizations)
    };
    
    // Deployment configuration
    if (recommendation.techStack.deployment) {
      config.deployment = {
        platform: recommendation.techStack.deployment.name,
        environment: 'production',
        autoDeploy: true,
        healthcheckPath: '/api/health',
        build: {
          builder: 'nixpacks',
          watchPatterns: ['**/*']
        },
        deploy: {
          restartPolicyType: 'on_failure',
          restartPolicyMaxRetries: 10,
          healthcheckTimeout: 300,
          healthcheckInterval: 5,
          healthcheckRetries: 3
        },
        features: this.getDeploymentFeatures(recommendation.projectType, customizations)
      };
    }
    
    // Testing configuration
    if (recommendation.techStack.testing) {
      config.testing = {
        framework: recommendation.techStack.testing.name,
        testTypes: this.getTestTypes(recommendation.projectType, customizations),
        coverage: true,
        coverageThreshold: 80,
        features: this.getTestingFeatures(recommendation.projectType, customizations)
      };
    }
    
    return config;
  }

  /**
   * Build customizations configuration
   */
  buildCustomizations(recommendation: ProjectRecommendation, customizations: Record<string, any>): Record<string, any> {
    const finalCustomizations: Record<string, any> = {};
    
    // Project-specific customizations
    if (recommendation.projectType === 'blog') {
      finalCustomizations.comments = customizations.blogFeatures ?? true;
      finalCustomizations.newsletter = customizations.newsletter ?? true;
      finalCustomizations.seo = true;
    }
    
    if (recommendation.projectType === 'ecommerce') {
      finalCustomizations.inventory = customizations.inventoryManagement ?? true;
      finalCustomizations.orderTracking = customizations.orderTracking ?? true;
      finalCustomizations.reviews = true;
    }
    
    if (recommendation.projectType === 'saas') {
      finalCustomizations.subscriptions = true;
      finalCustomizations.billing = true;
      finalCustomizations.usageTracking = true;
    }
    
    if (recommendation.projectType === 'dashboard') {
      finalCustomizations.analytics = true;
      finalCustomizations.reports = true;
      finalCustomizations.export = true;
    }
    
    // Feature-specific customizations
    if (recommendation.features.includes('payments')) {
      finalCustomizations.paymentProvider = customizations.paymentProvider || 'stripe';
    }
    
    if (recommendation.features.includes('email')) {
      finalCustomizations.emailProvider = customizations.emailProvider || 'resend';
    }
    
    if (recommendation.features.includes('monitoring')) {
      finalCustomizations.monitoringProvider = customizations.monitoringProvider || 'sentry';
    }
    
    // Complexity-based customizations
    if (recommendation.complexity === 'complex') {
      finalCustomizations.deploymentStrategy = customizations.deploymentStrategy || 'railway';
      finalCustomizations.performanceMonitoring = true;
      finalCustomizations.errorTracking = true;
    }
    
    return finalCustomizations;
  }

  /**
   * Get database provider from ORM name
   */
  private getDatabaseProvider(ormName: string): string {
    const providerMap: Record<string, string> = {
      'drizzle': 'local-sqlite', // Use local-sqlite for local development
      'prisma': 'supabase',
      'mongodb': 'mongodb'
    };
    
    return providerMap[ormName] || 'local-sqlite';
  }

  /**
   * Get database features based on project type
   */
  private getDatabaseFeatures(projectType: string, customizations: Record<string, any>): string[] {
    const features: string[] = ['migrations', 'schema'];
    
    if (projectType === 'ecommerce') {
      features.push('products', 'orders', 'users');
    }
    
    if (projectType === 'blog') {
      features.push('posts', 'comments', 'users');
    }
    
    if (projectType === 'saas') {
      features.push('subscriptions', 'billing', 'usage');
    }
    
    if (projectType === 'dashboard') {
      features.push('analytics', 'reports', 'metrics');
    }
    
    return features;
  }

  /**
   * Get auth features based on project type
   */
  private getAuthFeatures(projectType: string, customizations: Record<string, any>): string[] {
    const features: string[] = ['login', 'register', 'sessions'];
    
    if (projectType === 'ecommerce') {
      features.push('orders', 'wishlist', 'reviews');
    }
    
    if (projectType === 'saas') {
      features.push('subscriptions', 'billing', 'teams');
    }
    
    if (projectType === 'dashboard') {
      features.push('roles', 'permissions', 'admin');
    }
    
    return features;
  }

  /**
   * Get UI features based on project type
   */
  private getUIFeatures(projectType: string, customizations: Record<string, any>): string[] {
    const features: string[] = ['components', 'themes', 'responsive'];
    
    if (projectType === 'ecommerce') {
      features.push('product-cards', 'cart', 'checkout');
    }
    
    if (projectType === 'blog') {
      features.push('article-layout', 'comments', 'newsletter');
    }
    
    if (projectType === 'dashboard') {
      features.push('charts', 'tables', 'filters');
    }
    
    return features;
  }

  /**
   * Get deployment features based on complexity
   */
  private getDeploymentFeatures(complexity: string, customizations: Record<string, any>): string[] {
    const features: string[] = ['ci-cd', 'environment-variables'];
    
    if (complexity === 'complex') {
      features.push('monitoring', 'logging', 'scaling');
    }
    
    return features;
  }

  /**
   * Get testing features based on complexity
   */
  private getTestingFeatures(projectType: string, customizations: Record<string, any>): string[] {
    // Default testing features based on project type
    const defaultFeatures = {
      'blog': ['unit'],
      'ecommerce': ['unit', 'integration'],
      'saas': ['unit', 'integration', 'e2e'],
      'dashboard': ['unit', 'integration'],
      'api': ['unit', 'integration'],
      'custom': ['unit']
    };
    
    return defaultFeatures[projectType as keyof typeof defaultFeatures] || ['unit'];
  }

  /**
   * Get email features based on project type
   */
  private getEmailFeatures(projectType: string, customizations: Record<string, any>): string[] {
    const features: string[] = ['notifications'];
    
    if (projectType === 'blog') {
      features.push('newsletter', 'subscriptions');
    }
    
    if (projectType === 'ecommerce') {
      features.push('order-confirmations', 'shipping-updates');
    }
    
    if (projectType === 'saas') {
      features.push('welcome-emails', 'billing-notifications');
    }
    
    return features;
  }

  /**
   * Get payment features based on project type
   */
  private getPaymentFeatures(projectType: string, customizations: Record<string, any>): string[] {
    const features: string[] = ['checkout'];
    
    if (projectType === 'ecommerce') {
      features.push('products', 'cart', 'orders');
    }
    
    if (projectType === 'saas') {
      features.push('subscriptions', 'billing', 'invoices');
    }
    
    return features;
  }

  /**
   * Get monitoring features based on complexity
   */
  private getMonitoringFeatures(complexity: string): string[] {
    const features: string[] = ['error-tracking'];
    
    if (complexity === 'complex') {
      features.push('performance', 'analytics', 'alerts');
    }
    
    return features;
  }

  /**
   * Generate artifacts for the project
   */
  generateArtifacts(config: ProjectConfig): any[] {
    const artifacts: any[] = [];
    
    // Add project structure artifacts
    artifacts.push({
      type: 'directory',
      path: 'src',
      description: 'Source code directory'
    });
    
    artifacts.push({
      type: 'directory',
      path: 'src/components',
      description: 'UI components'
    });
    
    artifacts.push({
      type: 'directory',
      path: 'src/lib',
      description: 'Utility libraries'
    });
    
    // Add configuration artifacts
    if (config.techStack.database) {
      artifacts.push({
        type: 'file',
        path: 'src/lib/db.ts',
        description: 'Database configuration'
      });
    }
    
    if (config.techStack.auth) {
      artifacts.push({
        type: 'file',
        path: 'src/lib/auth.ts',
        description: 'Authentication configuration'
      });
    }
    
    // Add README
    artifacts.push({
      type: 'file',
      path: 'README.md',
      description: 'Project documentation'
    });
    
    return artifacts;
  }

  private getUIComponents(projectType: string, customizations: Record<string, any>): string[] {
    // Default components based on project type
    const defaultComponents = {
      'blog': ['button', 'card', 'input', 'textarea'],
      'ecommerce': ['button', 'card', 'input', 'badge', 'dialog'],
      'saas': ['button', 'card', 'input', 'badge', 'dialog', 'dropdown-menu'],
      'dashboard': ['button', 'card', 'input', 'badge', 'dialog', 'dropdown-menu', 'table'],
      'api': ['button', 'card'],
      'custom': ['button', 'card']
    };
    
    return defaultComponents[projectType as keyof typeof defaultComponents] || ['button', 'card'];
  }

  private getTestTypes(projectType: string, customizations: Record<string, any>): string[] {
    // Default test types based on project type
    const defaultTestTypes = {
      'blog': ['unit'],
      'ecommerce': ['unit', 'integration'],
      'saas': ['unit', 'integration', 'e2e'],
      'dashboard': ['unit', 'integration'],
      'api': ['unit', 'integration'],
      'custom': ['unit']
    };
    
    return defaultTestTypes[projectType as keyof typeof defaultTestTypes] || ['unit'];
  }
} 