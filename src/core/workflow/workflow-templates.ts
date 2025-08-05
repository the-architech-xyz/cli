/**
 * Workflow Templates System
 * 
 * Pre-configured plugin selections for common use cases.
 * Dramatically reduces questions from 20+ to 2-5 while maintaining customization.
 */

import { 
  DATABASE_PROVIDERS, 
  ORM_LIBRARIES,
  AUTH_PROVIDERS, 
  UI_LIBRARIES,
  DEPLOYMENT_PLATFORMS,
  EMAIL_SERVICES,
  TESTING_FRAMEWORKS
} from '../../types/core.js';

// Define missing selection types
export interface PluginSelection {
  database: DatabaseSelection;
  authentication: AuthSelection;
  ui: UISelection;
  deployment: DeploymentSelection;
  testing: TestingSelection;
  email: EmailSelection;
  monitoring: MonitoringSelection;
  payment: PaymentSelection;
  blockchain: BlockchainSelection;
}

export interface DatabaseSelection {
  enabled: boolean;
  provider: string;
  orm: string;
  features: Record<string, boolean>;
}

export interface AuthSelection {
  enabled: boolean;
  providers: string[];
  features: Record<string, boolean>;
}

export interface UISelection {
  enabled: boolean;
  library: string;
  features: Record<string, boolean>;
}

export interface DeploymentSelection {
  enabled: boolean;
  platform: string;
  features: Record<string, boolean>;
}

export interface TestingSelection {
  enabled: boolean;
  framework: string;
  features: Record<string, boolean>;
}

export interface EmailSelection {
  enabled: boolean;
  service: string;
  features: Record<string, boolean>;
}

export interface MonitoringSelection {
  enabled: boolean;
  services: string[];
  features: Record<string, boolean>;
}

export interface PaymentSelection {
  enabled: boolean;
  providers: string[];
  features: Record<string, boolean>;
}

export interface BlockchainSelection {
  enabled: boolean;
  networks: string[];
  features: Record<string, boolean>;
}

// ============================================================================
// TEMPLATE INTERFACES
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  questions: number;
  estimatedTime: string;
  targetAudience: string[];
  pluginSelection: PluginSelection;
  customizations: TemplateCustomization[];
  keywords: string[];
  complexity: 'beginner' | 'intermediate' | 'expert';
}

export interface TemplateCustomization {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'choice' | 'text';
  options?: string[];
  default?: any;
  required?: boolean;
}

export interface TemplateSuggestion {
  template: WorkflowTemplate;
  confidence: number;
  reason: string;
  keywords: string[];
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'quick-start',
    name: 'Quick Start',
    description: 'Get up and running in 30 seconds with a modern Next.js app',
    questions: 2,
    estimatedTime: '30 seconds',
    targetAudience: ['beginners', 'prototyping', 'learning'],
    complexity: 'beginner',
    keywords: ['quick', 'start', 'simple', 'basic', 'prototype', 'learn'],
    pluginSelection: {
      database: {
        enabled: false,
        provider: DATABASE_PROVIDERS.NEON,
        orm: ORM_LIBRARIES.DRIZZLE,
        features: {}
      },
      authentication: {
        enabled: false,
        providers: [],
        features: {}
      },
      ui: {
        enabled: true,
        library: UI_LIBRARIES.SHADCN_UI,
        features: { components: true, theming: true, responsive: true }
      },
      deployment: {
        enabled: false,
        platform: DEPLOYMENT_PLATFORMS.VERCEL,
        features: {}
      },
      testing: {
        enabled: true,
        framework: TESTING_FRAMEWORKS.VITEST,
        features: { unit: true, integration: false, e2e: false, coverage: false }
      },
      email: {
        enabled: false,
        service: EMAIL_SERVICES.RESEND,
        features: {}
      },
      monitoring: {
        enabled: false,
        services: [],
        features: {}
      },
      payment: {
        enabled: false,
        providers: [],
        features: {}
      },
      blockchain: {
        enabled: false,
        networks: [],
        features: {}
      }
    },
    customizations: [
      {
        id: 'projectName',
        name: 'Project Name',
        description: 'What should we call your project?',
        type: 'text',
        required: true
      },
      {
        id: 'packageManager',
        name: 'Package Manager',
        description: 'Which package manager do you prefer?',
        type: 'choice',
        options: ['npm', 'yarn', 'pnpm', 'bun', 'auto'],
        default: 'auto'
      }
    ]
  },
  {
    id: 'default',
    name: 'Default Stack',
    description: 'Modern full-stack app with Drizzle ORM, Neon DB, Better Auth, and ShadcnUI',
    questions: 1,
    estimatedTime: '45 seconds',
    targetAudience: ['developers', 'startups', 'production'],
    complexity: 'intermediate',
    keywords: ['default', 'modern', 'fullstack', 'production', 'drizzle', 'neon', 'better-auth', 'shadcn'],
    pluginSelection: {
      database: {
        enabled: true,
        provider: DATABASE_PROVIDERS.NEON,
        orm: ORM_LIBRARIES.DRIZZLE,
        features: { migrations: true, seeding: true, studio: true, backup: true }
      },
      authentication: {
        enabled: true,
        providers: [AUTH_PROVIDERS.EMAIL, AUTH_PROVIDERS.GOOGLE],
        features: { 
          'email-verification': true, 
          'password-reset': true, 
          'social-login': true, 
          'session-management': true,
          'two-factor': false,
          'oauth': true
        }
      },
      ui: {
        enabled: true,
        library: UI_LIBRARIES.SHADCN_UI,
        features: { 
          components: true, 
          theming: true, 
          responsive: true,
          darkMode: true,
          animations: true
        }
      },
      deployment: {
        enabled: true,
        platform: DEPLOYMENT_PLATFORMS.VERCEL,
        features: { autoDeploy: true, preview: true, analytics: true }
      },
      testing: {
        enabled: true,
        framework: TESTING_FRAMEWORKS.VITEST,
        features: { unit: true, integration: true, e2e: false, coverage: true }
      },
      email: {
        enabled: true,
        service: EMAIL_SERVICES.RESEND,
        features: { templates: true, analytics: true, webhooks: true }
      },
      monitoring: {
        enabled: true,
        services: ['sentry'],
        features: { errorTracking: true, performance: true, alerts: true }
      },
      payment: {
        enabled: false,
        providers: [],
        features: {}
      },
      blockchain: {
        enabled: false,
        networks: [],
        features: {}
      }
    },
    customizations: [
      {
        id: 'projectName',
        name: 'Project Name',
        description: 'What should we call your project?',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'blog-platform',
    name: 'Blog Platform',
    description: 'A modern blog with content management, SEO, and analytics',
    questions: 3,
    estimatedTime: '1 minute',
    targetAudience: ['content creators', 'writers', 'marketers'],
    complexity: 'beginner',
    keywords: ['blog', 'content', 'articles', 'writing', 'publishing', 'seo', 'marketing'],
    pluginSelection: {
      database: {
        enabled: true,
        provider: DATABASE_PROVIDERS.NEON,
        orm: ORM_LIBRARIES.DRIZZLE,
        features: { migrations: true, seeding: true, studio: true }
      },
      authentication: {
        enabled: true,
        providers: [AUTH_PROVIDERS.EMAIL],
        features: { 
          'email-verification': true, 
          'password-reset': true, 
          'social-login': false, 
          'session-management': true 
        }
      },
      ui: {
        enabled: true,
        library: UI_LIBRARIES.SHADCN_UI,
        features: { components: true, theming: true, responsive: true }
      },
      deployment: {
        enabled: true,
        platform: DEPLOYMENT_PLATFORMS.VERCEL,
        features: { autoDeploy: true, preview: true, analytics: true }
      },
      testing: {
        enabled: true,
        framework: TESTING_FRAMEWORKS.VITEST,
        features: { unit: true, integration: true, e2e: false, coverage: true }
      },
      email: {
        enabled: true,
        service: EMAIL_SERVICES.RESEND,
        features: { templates: true, tracking: false, analytics: false }
      },
      monitoring: {
        enabled: true,
        services: ['vercel-analytics'],
        features: { errorTracking: false, performanceMonitoring: false, analytics: true }
      },
      payment: {
        enabled: false,
        providers: [],
        features: {}
      },
      blockchain: {
        enabled: false,
        networks: [],
        features: {}
      }
    },
    customizations: [
      {
        id: 'projectName',
        name: 'Blog Name',
        description: 'What should we call your blog?',
        type: 'text',
        required: true
      },
      {
        id: 'contentType',
        name: 'Content Type',
        description: 'What type of content will you publish?',
        type: 'choice',
        options: ['articles', 'tutorials', 'news', 'personal', 'mixed'],
        default: 'articles'
      },
      {
        id: 'monetization',
        name: 'Monetization',
        description: 'Do you want to monetize your blog?',
        type: 'boolean',
        default: false
      }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'A complete online store with products, payments, and inventory',
    questions: 4,
    estimatedTime: '2 minutes',
    targetAudience: ['entrepreneurs', 'business owners', 'retailers'],
    complexity: 'intermediate',
    keywords: ['store', 'shop', 'sell', 'products', 'payments', 'cart', 'commerce', 'retail'],
    pluginSelection: {
      database: {
        enabled: true,
        provider: DATABASE_PROVIDERS.NEON,
        orm: ORM_LIBRARIES.DRIZZLE,
        features: { migrations: true, seeding: true, studio: true }
      },
      authentication: {
        enabled: true,
        providers: [AUTH_PROVIDERS.EMAIL],
        features: { 
          'email-verification': true, 
          'password-reset': true, 
          'social-login': true, 
          'session-management': true 
        }
      },
      ui: {
        enabled: true,
        library: UI_LIBRARIES.SHADCN_UI,
        features: { components: true, theming: true, responsive: true }
      },
      deployment: {
        enabled: true,
        platform: DEPLOYMENT_PLATFORMS.VERCEL,
        features: { autoDeploy: true, preview: true, analytics: true }
      },
      testing: {
        enabled: true,
        framework: TESTING_FRAMEWORKS.VITEST,
        features: { unit: true, integration: true, e2e: true, coverage: true }
      },
      email: {
        enabled: true,
        service: EMAIL_SERVICES.RESEND,
        features: { templates: true, tracking: true, analytics: true }
      },
      monitoring: {
        enabled: true,
        services: ['vercel-analytics', 'sentry'],
        features: { errorTracking: true, performanceMonitoring: true, analytics: true }
      },
      payment: {
        enabled: true,
        providers: ['stripe'],
        features: { subscriptions: false, oneTimePayments: true, invoices: true }
      },
      blockchain: {
        enabled: false,
        networks: [],
        features: {}
      }
    },
    customizations: [
      {
        id: 'projectName',
        name: 'Store Name',
        description: 'What should we call your store?',
        type: 'text',
        required: true
      },
      {
        id: 'productType',
        name: 'Product Type',
        description: 'What type of products will you sell?',
        type: 'choice',
        options: ['physical', 'digital', 'subscription', 'mixed'],
        default: 'physical'
      },
      {
        id: 'paymentProvider',
        name: 'Payment Provider',
        description: 'Which payment provider do you prefer?',
        type: 'choice',
        options: ['stripe', 'paypal', 'both'],
        default: 'stripe'
      },
      {
        id: 'inventory',
        name: 'Inventory Management',
        description: 'Do you need inventory tracking?',
        type: 'boolean',
        default: true
      }
    ]
  },
  {
    id: 'saas',
    name: 'SaaS Application',
    description: 'A scalable SaaS platform with user management and subscriptions',
    questions: 5,
    estimatedTime: '3 minutes',
    targetAudience: ['startups', 'entrepreneurs', 'developers'],
    complexity: 'intermediate',
    keywords: ['saas', 'app', 'platform', 'dashboard', 'users', 'subscription', 'business'],
    pluginSelection: {
      database: {
        enabled: true,
        provider: DATABASE_PROVIDERS.NEON,
        orm: ORM_LIBRARIES.DRIZZLE,
        features: { migrations: true, seeding: true, studio: true }
      },
      authentication: {
        enabled: true,
        providers: [AUTH_PROVIDERS.EMAIL],
        features: { 
          'email-verification': true, 
          'password-reset': true, 
          'social-login': true, 
          'session-management': true 
        }
      },
      ui: {
        enabled: true,
        library: UI_LIBRARIES.SHADCN_UI,
        features: { components: true, theming: true, responsive: true }
      },
      deployment: {
        enabled: true,
        platform: DEPLOYMENT_PLATFORMS.VERCEL,
        features: { autoDeploy: true, preview: true, analytics: true }
      },
      testing: {
        enabled: true,
        framework: TESTING_FRAMEWORKS.VITEST,
        features: { unit: true, integration: true, e2e: true, coverage: true }
      },
      email: {
        enabled: true,
        service: EMAIL_SERVICES.RESEND,
        features: { templates: true, tracking: true, analytics: true }
      },
      monitoring: {
        enabled: true,
        services: ['sentry', 'vercel-analytics'],
        features: { errorTracking: true, performanceMonitoring: true, analytics: true }
      },
      payment: {
        enabled: true,
        providers: ['stripe'],
        features: { subscriptions: true, oneTimePayments: true, invoices: true }
      },
      blockchain: {
        enabled: false,
        networks: [],
        features: {}
      }
    },
    customizations: [
      {
        id: 'projectName',
        name: 'Application Name',
        description: 'What should we call your SaaS application?',
        type: 'text',
        required: true
      },
      {
        id: 'userModel',
        name: 'User Model',
        description: 'How will users access your application?',
        type: 'choice',
        options: ['individual', 'teams', 'organizations', 'mixed'],
        default: 'individual'
      },
      {
        id: 'billingModel',
        name: 'Billing Model',
        description: 'How will you charge users?',
        type: 'choice',
        options: ['subscription', 'usage-based', 'one-time', 'freemium'],
        default: 'subscription'
      },
      {
        id: 'features',
        name: 'Core Features',
        description: 'What are the main features of your SaaS?',
        type: 'text',
        default: 'User management, dashboard, analytics'
      },
      {
        id: 'scalability',
        name: 'Scalability',
        description: 'Do you need enterprise-grade scalability?',
        type: 'boolean',
        default: false
      }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Application',
    description: 'A robust enterprise application with advanced features and security',
    questions: 6,
    estimatedTime: '5 minutes',
    targetAudience: ['enterprises', 'large teams', 'complex projects'],
    complexity: 'expert',
    keywords: ['enterprise', 'business', 'team', 'scalable', 'professional', 'corporate'],
    pluginSelection: {
      database: {
        enabled: true,
        provider: DATABASE_PROVIDERS.NEON,
        orm: ORM_LIBRARIES.DRIZZLE,
        features: { migrations: true, seeding: true, studio: true }
      },
      authentication: {
        enabled: true,
        providers: [AUTH_PROVIDERS.EMAIL],
        features: { 
          'email-verification': true, 
          'password-reset': true, 
          'social-login': true, 
          'session-management': true 
        }
      },
      ui: {
        enabled: true,
        library: UI_LIBRARIES.SHADCN_UI,
        features: { components: true, theming: true, responsive: true }
      },
      deployment: {
        enabled: true,
        platform: DEPLOYMENT_PLATFORMS.VERCEL,
        features: { autoDeploy: true, preview: true, analytics: true }
      },
      testing: {
        enabled: true,
        framework: TESTING_FRAMEWORKS.VITEST,
        features: { unit: true, integration: true, e2e: true, coverage: true }
      },
      email: {
        enabled: true,
        service: EMAIL_SERVICES.RESEND,
        features: { templates: true, tracking: true, analytics: true }
      },
      monitoring: {
        enabled: true,
        services: ['sentry', 'vercel-analytics', 'google-analytics'],
        features: { errorTracking: true, performanceMonitoring: true, analytics: true }
      },
      payment: {
        enabled: true,
        providers: ['stripe'],
        features: { subscriptions: true, oneTimePayments: true, invoices: true }
      },
      blockchain: {
        enabled: false,
        networks: [],
        features: {}
      }
    },
    customizations: [
      {
        id: 'projectName',
        name: 'Application Name',
        description: 'What should we call your enterprise application?',
        type: 'text',
        required: true
      },
      {
        id: 'organization',
        name: 'Organization Type',
        description: 'What type of organization is this for?',
        type: 'choice',
        options: ['corporation', 'government', 'nonprofit', 'startup', 'agency'],
        default: 'corporation'
      },
      {
        id: 'security',
        name: 'Security Requirements',
        description: 'What level of security do you need?',
        type: 'choice',
        options: ['standard', 'enhanced', 'enterprise', 'compliance'],
        default: 'enhanced'
      },
      {
        id: 'teamSize',
        name: 'Team Size',
        description: 'How many developers will work on this?',
        type: 'choice',
        options: ['1-5', '6-20', '21-50', '50+'],
        default: '6-20'
      },
      {
        id: 'compliance',
        name: 'Compliance',
        description: 'Do you need compliance features (GDPR, SOC2, etc.)?',
        type: 'boolean',
        default: false
      },
      {
        id: 'integrations',
        name: 'Integrations',
        description: 'What external systems do you need to integrate with?',
        type: 'text',
        default: 'CRM, ERP, SSO'
      }
    ]
  }
];

// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================

export class WorkflowTemplateService {
  
  /**
   * Get all available templates
   */
  static getTemplates(): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES;
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES.find(template => template.id === id);
  }

  /**
   * Get templates by complexity level
   */
  static getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'expert'): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => template.complexity === complexity);
  }

  /**
   * Get templates by target audience
   */
  static getTemplatesByAudience(audience: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => 
      template.targetAudience.includes(audience)
    );
  }

  /**
   * Get custom template (full customization)
   */
  static getCustomTemplate(): WorkflowTemplate {
    return {
      id: 'custom',
      name: 'Custom Template',
      description: 'Build your own custom template with full control',
      questions: 15,
      estimatedTime: '5-10 minutes',
      targetAudience: ['experts', 'custom', 'enterprise'],
      complexity: 'expert',
      pluginSelection: {
        database: {
          enabled: false,
          provider: DATABASE_PROVIDERS.NEON,
          orm: ORM_LIBRARIES.DRIZZLE,
          features: {}
        },
        authentication: {
          enabled: false,
          providers: [],
          features: {}
        },
        ui: {
          enabled: false,
          library: UI_LIBRARIES.SHADCN_UI,
          features: {}
        },
        deployment: {
          enabled: false,
          platform: DEPLOYMENT_PLATFORMS.VERCEL,
          features: {}
        },
        testing: {
          enabled: false,
          framework: TESTING_FRAMEWORKS.VITEST,
          features: {}
        },
        email: {
          enabled: false,
          service: EMAIL_SERVICES.RESEND,
          features: {}
        },
        monitoring: {
          enabled: false,
          services: [],
          features: {}
        },
        payment: {
          enabled: false,
          providers: [],
          features: {}
        },
        blockchain: {
          enabled: false,
          networks: [],
          features: {}
        }
      },
      customizations: [],
      keywords: ['custom', 'enterprise', 'expert', 'full-control']
    };
  }
} 