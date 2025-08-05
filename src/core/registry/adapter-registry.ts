/**
 * Adapter Registry - Central Management for Tech-Agnostic Adapters
 * 
 * Singleton registry that manages all adapters and provides factory methods
 * for creating adapters dynamically based on category and name.
 */

import { CoreCategory, IPlugin, PluginMetadata } from '../interfaces/base.js';
import { 
  IDatabaseProvider, 
  IAuthProvider, 
  IUIProvider, 
  IFrameworkProvider,
  IDeploymentProvider,
  ITestingProvider,
  IObservabilityProvider,
  IEmailProvider
} from '../interfaces/providers.js';

// Import all adapters (fixed to no .js extension)
import { DrizzleAdapter } from '../adapters/database/drizzle-adapter.js';
import { PrismaAdapter } from '../adapters/database/prisma-adapter.js';
import { BetterAuthAdapter } from '../adapters/auth/better-auth-adapter.js';
import { NextAuthAdapter } from '../adapters/auth/nextauth-adapter.js';
import { ShadcnUIAdapter } from '../adapters/ui/shadcn-ui-adapter.js';
import { ChakraUIAdapter } from '../adapters/ui/chakra-ui-adapter.js';
import { NextJSAdapter } from '../adapters/framework/nextjs-adapter.js';
import { DockerAdapter } from '../adapters/deployment/docker-adapter.js';
import { VitestAdapter } from '../adapters/testing/vitest-adapter.js';
import { GoogleAnalyticsAdapter } from '../adapters/observability/google-analytics-adapter.js';

interface AdapterMetadata {
  name: string;
  category: CoreCategory;
  description: string;
  version: string;
  dependencies: string[];
}

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: Map<string, AdapterMetadata> = new Map();

  private constructor() {
    this.registerBuiltInAdapters();
  }

  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  private registerBuiltInAdapters(): void {
    // Database Adapters
    this.registerAdapter(CoreCategory.DATABASE, 'drizzle', {
      name: 'Drizzle ORM',
      category: CoreCategory.DATABASE,
      description: 'TypeScript ORM for SQL databases with excellent type safety',
      version: '0.44.3',
      dependencies: ['drizzle-orm', '@neondatabase/serverless']
    });

    this.registerAdapter(CoreCategory.DATABASE, 'prisma', {
      name: 'Prisma ORM',
      category: CoreCategory.DATABASE,
      description: 'Next-generation Node.js and TypeScript ORM',
      version: '5.0.0',
      dependencies: ['@prisma/client', 'prisma']
    });

    // Auth Adapters
    this.registerAdapter(CoreCategory.AUTH, 'better-auth', {
      name: 'Better Auth',
      category: CoreCategory.AUTH,
      description: 'Modern, secure authentication library',
      version: '1.0.0',
      dependencies: ['@auth/core', '@auth/nextjs']
    });

    this.registerAdapter(CoreCategory.AUTH, 'nextauth', {
      name: 'NextAuth.js',
      category: CoreCategory.AUTH,
      description: 'Complete authentication solution for Next.js',
      version: '4.24.0',
      dependencies: ['next-auth']
    });

    // UI Adapters
    this.registerAdapter(CoreCategory.UI, 'shadcn-ui', {
      name: 'Shadcn/UI',
      category: CoreCategory.UI,
      description: 'Beautifully designed components that you can copy and paste into your apps',
      version: '1.0.0',
      dependencies: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge']
    });

    this.registerAdapter(CoreCategory.UI, 'chakra-ui', {
      name: 'Chakra UI',
      category: CoreCategory.UI,
      description: 'Simple, modular and accessible component library',
      version: '2.8.0',
      dependencies: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion']
    });

    // Framework Adapters
    this.registerAdapter(CoreCategory.FRAMEWORK, 'nextjs', {
      name: 'Next.js',
      category: CoreCategory.FRAMEWORK,
      description: 'React framework for production with App Router',
      version: '14.0.0',
      dependencies: ['next', 'react', 'react-dom']
    });

    // Deployment Adapters
    this.registerAdapter(CoreCategory.DEPLOYMENT, 'docker', {
      name: 'Docker',
      category: CoreCategory.DEPLOYMENT,
      description: 'Containerization and deployment with Docker',
      version: '1.0.0',
      dependencies: []
    });

    // Testing Adapters
    this.registerAdapter(CoreCategory.TESTING, 'vitest', {
      name: 'Vitest',
      category: CoreCategory.TESTING,
      description: 'Fast unit test framework powered by Vite',
      version: '1.0.0',
      dependencies: ['vitest', '@vitest/ui']
    });

    // Observability Adapters
    this.registerAdapter(CoreCategory.OBSERVABILITY, 'google-analytics', {
      name: 'Google Analytics',
      category: CoreCategory.OBSERVABILITY,
      description: 'Web analytics and tracking with Google Analytics 4',
      version: '1.0.0',
      dependencies: ['@next/third-parties']
    });
  }

  private registerAdapter(category: CoreCategory, name: string, metadata: AdapterMetadata): void {
    const key = `${category}:${name}`;
    this.adapters.set(key, metadata);
  }

  // Factory methods for creating adapters
  async createDatabaseAdapter(name: string): Promise<IDatabaseProvider> {
    switch (name) {
      case 'drizzle':
        return new DrizzleAdapter();
      case 'prisma':
        return new PrismaAdapter();
      default:
        throw new Error(`Unknown database adapter: ${name}`);
    }
  }

  async createAuthAdapter(name: string): Promise<IAuthProvider> {
    switch (name) {
      case 'better-auth':
        return new BetterAuthAdapter();
      case 'nextauth':
        return new NextAuthAdapter();
      default:
        throw new Error(`Unknown auth adapter: ${name}`);
    }
  }

  async createUIAdapter(name: string): Promise<IUIProvider> {
    switch (name) {
      case 'shadcn-ui':
        return new ShadcnUIAdapter();
      case 'chakra-ui':
        return new ChakraUIAdapter();
      default:
        throw new Error(`Unknown UI adapter: ${name}`);
    }
  }

  async createFrameworkAdapter(name: string): Promise<IFrameworkProvider> {
    switch (name) {
      case 'nextjs':
        return new NextJSAdapter();
      default:
        throw new Error(`Unknown framework adapter: ${name}`);
    }
  }

  async createDeploymentAdapter(name: string): Promise<IDeploymentProvider> {
    switch (name) {
      case 'docker':
        return new DockerAdapter();
      default:
        throw new Error(`Unknown deployment adapter: ${name}`);
    }
  }

  async createTestingAdapter(name: string): Promise<ITestingProvider> {
    switch (name) {
      case 'vitest':
        return new VitestAdapter();
      default:
        throw new Error(`Unknown testing adapter: ${name}`);
    }
  }

  async createObservabilityAdapter(name: string): Promise<IObservabilityProvider> {
    switch (name) {
      case 'google-analytics':
        return new GoogleAnalyticsAdapter();
      default:
        throw new Error(`Unknown observability adapter: ${name}`);
    }
  }

  async createEmailAdapter(name: string): Promise<IEmailProvider> {
    switch (name) {
      default:
        throw new Error(`Unknown email adapter: ${name}`);
    }
  }

  // Utility methods
  listAdapters(): AdapterMetadata[] {
    return Array.from(this.adapters.values());
  }

  getAdaptersForCategory(category: CoreCategory): AdapterMetadata[] {
    return this.listAdapters().filter(adapter => adapter.category === category);
  }

  getAdapter(category: CoreCategory, name: string): AdapterMetadata | undefined {
    const key = `${category}:${name}`;
    return this.adapters.get(key);
  }

  hasAdapter(category: CoreCategory, name: string): boolean {
    return this.getAdapter(category, name) !== undefined;
  }
}

// Export factory functions for convenience
export const createDatabaseAdapter = (name: string) => AdapterRegistry.getInstance().createDatabaseAdapter(name);
export const createAuthAdapter = (name: string) => AdapterRegistry.getInstance().createAuthAdapter(name);
export const createUIAdapter = (name: string) => AdapterRegistry.getInstance().createUIAdapter(name);
export const createFrameworkAdapter = (name: string) => AdapterRegistry.getInstance().createFrameworkAdapter(name);
export const createDeploymentAdapter = (name: string) => AdapterRegistry.getInstance().createDeploymentAdapter(name);
export const createTestingAdapter = (name: string) => AdapterRegistry.getInstance().createTestingAdapter(name);
export const createObservabilityAdapter = (name: string) => AdapterRegistry.getInstance().createObservabilityAdapter(name);
export const createEmailAdapter = (name: string) => AdapterRegistry.getInstance().createEmailAdapter(name); 