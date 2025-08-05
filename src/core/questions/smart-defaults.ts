/**
 * Smart Defaults System
 * 
 * Provides intelligent defaults for plugins to reduce configuration questions.
 * Makes the user experience magical instead of overwhelming.
 */

import { ProjectType } from '../../types/smart-questions.js';

export interface SmartDefaults {
  [pluginId: string]: Record<string, any>;
}

export interface ProjectDefaults {
  [projectType: string]: SmartDefaults;
}

/**
 * Smart defaults for different project types
 */
export const PROJECT_DEFAULTS: ProjectDefaults = {
  blog: {
    'shadcn-ui': {
      components: ['button', 'card', 'input', 'textarea'],
      theme: 'system',
      styling: 'tailwind'
    },
    'drizzle': {
      provider: 'sqlite', // Use SQLite for local development
      orm: 'drizzle',
      features: ['migrations', 'schema'],
      connectionString: '', // Empty for SQLite
      migrations: true,
      seeding: false
    },
    'better-auth': {
      providers: ['credentials'],
      session: 'jwt',
      emailVerification: false
    },
    'railway': {
      environment: 'production',
      builder: 'nixpacks',
      watchPatterns: ['**/*']
    },
    'vitest': {
      testTypes: ['unit'],
      coverage: true,
      coverageThreshold: 80
    }
  },
  ecommerce: {
    'shadcn-ui': {
      components: ['button', 'card', 'input', 'badge', 'dialog'],
      theme: 'system',
      styling: 'tailwind'
    },
    'drizzle': {
      provider: 'sqlite', // Use SQLite for local development
      orm: 'drizzle',
      features: ['migrations', 'schema'],
      connectionString: '', // Empty for SQLite
      migrations: true,
      seeding: false
    },
    'better-auth': {
      providers: ['credentials', 'google'],
      session: 'jwt',
      emailVerification: true
    },
    'stripe': {
      mode: 'test',
      webhooks: true,
      subscriptions: false
    },
    'railway': {
      environment: 'production',
      builder: 'nixpacks',
      watchPatterns: ['**/*']
    },
    'vitest': {
      testTypes: ['unit', 'integration'],
      coverage: true,
      coverageThreshold: 80
    }
  },
  saas: {
    'shadcn-ui': {
      components: ['button', 'card', 'input', 'badge', 'dialog', 'dropdown-menu'],
      theme: 'system',
      styling: 'tailwind'
    },
    'drizzle': {
      provider: 'sqlite', // Use SQLite for local development
      orm: 'drizzle',
      features: ['migrations', 'schema'],
      connectionString: '', // Empty for SQLite
      migrations: true,
      seeding: false
    },
    'better-auth': {
      providers: ['credentials', 'google', 'github'],
      session: 'jwt',
      emailVerification: true
    },
    'stripe': {
      mode: 'test',
      webhooks: true,
      subscriptions: true
    },
    'resend': {
      provider: 'resend',
      templates: false
    },
    'sentry': {
      environment: 'production',
      performance: true
    },
    'railway': {
      environment: 'production',
      builder: 'nixpacks',
      watchPatterns: ['**/*']
    },
    'vitest': {
      testTypes: ['unit', 'integration'],
      coverage: true,
      coverageThreshold: 80
    }
  },
  api: {
    'drizzle': {
      provider: 'sqlite', // Use SQLite for local development
      orm: 'drizzle',
      features: ['migrations', 'schema'],
      connectionString: '', // Empty for SQLite
      migrations: true,
      seeding: false
    },
    'better-auth': {
      providers: ['credentials'],
      session: 'jwt',
      emailVerification: false
    },
    'vitest': {
      testTypes: ['unit', 'integration'],
      coverage: true,
      coverageThreshold: 80
    },
    'railway': {
      environment: 'production',
      builder: 'nixpacks',
      watchPatterns: ['**/*']
    }
  },
  portfolio: {
    'shadcn-ui': {
      components: ['button', 'card', 'input'],
      theme: 'system',
      styling: 'tailwind'
    },
    'better-auth': {
      providers: ['credentials'],
      session: 'jwt',
      emailVerification: false
    },
    'railway': {
      environment: 'production',
      builder: 'nixpacks',
      watchPatterns: ['**/*']
    },
    'vitest': {
      testTypes: ['unit'],
      coverage: false,
      coverageThreshold: 0
    }
  },
  dashboard: {
    'shadcn-ui': {
      components: ['button', 'card', 'input', 'badge', 'dialog', 'dropdown-menu', 'table'],
      theme: 'system',
      styling: 'tailwind'
    },
    'drizzle': {
      provider: 'sqlite', // Use SQLite for local development
      orm: 'drizzle',
      features: ['migrations', 'schema'],
      connectionString: '', // Empty for SQLite
      migrations: true,
      seeding: false
    },
    'better-auth': {
      providers: ['credentials'],
      session: 'jwt',
      emailVerification: false
    }
  }
};

/**
 * Get smart defaults for a project type and plugins
 */
export function getSmartDefaults(projectType: ProjectType, pluginIds: string[]): SmartDefaults {
  const projectDefaults = PROJECT_DEFAULTS[projectType] || PROJECT_DEFAULTS.blog;
  const defaults: SmartDefaults = {};
  
  for (const pluginId of pluginIds) {
    if (projectDefaults && projectDefaults[pluginId]) {
      defaults[pluginId] = projectDefaults[pluginId];
    }
  }
  
  return defaults;
}

/**
 * Check if a plugin has smart defaults
 */
export function hasSmartDefaults(projectType: ProjectType, pluginId: string): boolean {
  const projectDefaults = PROJECT_DEFAULTS[projectType] || PROJECT_DEFAULTS.blog;
  return !!(projectDefaults && projectDefaults[pluginId]);
}

/**
 * Get default configuration for a specific plugin
 */
export function getPluginDefaults(projectType: ProjectType, pluginId: string): Record<string, any> {
  const projectDefaults = PROJECT_DEFAULTS[projectType] || PROJECT_DEFAULTS.blog;
  return (projectDefaults && projectDefaults[pluginId]) || {};
} 