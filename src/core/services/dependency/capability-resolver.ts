/**
 * Capability Resolver
 * 
 * Maps abstract capability dependencies to concrete npm packages
 * based on genome provider choices.
 * 
 * V2 COMPLIANCE: Reads from recipe books instead of hardcoded mappings.
 */

import type {
  DependencyCapability,
  ResolvedDependency,
  V2Genome,
  RecipeBook
} from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/index.js';

export class CapabilityResolver {
  /**
   * Fallback mappings for when recipe books are not available
   * These should only be used as a last resort during migration
   * @deprecated Use recipe books instead
   */
  private static readonly FALLBACK_CAPABILITY_MAP: Record<
    DependencyCapability,
    Record<string, string>  // provider → npm package
  > = {
    'auth': {
      'better-auth': 'better-auth',
      'supabase': '@supabase/supabase-js',
      'clerk': '@clerk/nextjs'
    },
    'database': {
      'drizzle': 'drizzle-orm',
      'prisma': 'prisma',
      'typeorm': 'typeorm',
      'sequelize': 'sequelize'
    },
    'ui': {
      'tamagui': 'tamagui',
      'shadcn-ui': 'class-variance-authority',
      'tailwind': 'tailwindcss'
    },
    'email': {
      'resend': 'resend',
      'sendgrid': '@sendgrid/mail'
    },
    'storage': {
      's3-compatible': '@aws-sdk/client-s3',
      'cloudflare-r2': '@cloudflare/workers-types'
    },
    'data-fetching': {
      'tanstack-query': '@tanstack/react-query',
      'trpc': '@trpc/server'
    },
    'state': {
      'zustand': 'zustand',
      'redux': '@reduxjs/toolkit'
    },
    'api': {
      'trpc': '@trpc/server',
      'graphql': 'graphql'
    },
    'jobs': {
      'inngest': 'inngest',
      'bullmq': 'bullmq'
    },
    'monitoring': {
      'sentry': '@sentry/nextjs',
      'posthog': 'posthog-js'
    },
    'payment': {
      'stripe': 'stripe',
      'lemon-squeezy': '@lemonsqueezy/lemonsqueezy.js'
    }
  };

  /**
   * Resolve capability to npm package based on genome and recipe books
   * 
   * V2 COMPLIANCE: Reads from recipe books instead of hardcoded mappings
   * 
   * @param capability - Capability to resolve
   * @param genome - Genome with provider choices
   * @param recipeBooks - Optional recipe books map (if available)
   * @returns Resolved dependency or null
   */
  static resolve(
    capability: DependencyCapability,
    genome: V2Genome,
    recipeBooks?: Map<string, RecipeBook>
  ): ResolvedDependency | null {
    // Find package in genome for this capability
    const packageConfig = genome.packages[capability];
    if (!packageConfig) {
      return null;  // Capability not in genome
    }

    const provider = packageConfig.provider || 'default';
    
    // PRIORITY 1: Try to resolve from recipe books (V2 compliant)
    if (recipeBooks && recipeBooks.size > 0) {
      const npmPackage = this.resolveFromRecipeBook(capability, provider, recipeBooks);
      if (npmPackage) {
        return {
          capability,
          provider,
          npmPackage: npmPackage.package,
          version: npmPackage.version || 'latest'
        };
      }
    }

    // PRIORITY 2: Fallback to hardcoded mappings (deprecated, for migration period)
    const fallbackPackage = this.FALLBACK_CAPABILITY_MAP[capability]?.[provider];
    if (fallbackPackage) {
      Logger.warn(
        `Using fallback capability mapping for ${capability}/${provider}. ` +
        `Recipe books should provide this mapping.`,
        { capability, provider }
      );
      return {
        capability,
        provider,
        npmPackage: fallbackPackage,
        version: 'latest'
      };
    }

    // No mapping found
    const availableProviders = recipeBooks && recipeBooks.size > 0
      ? this.getAvailableProvidersFromRecipeBook(capability, recipeBooks)
      : Object.keys(this.FALLBACK_CAPABILITY_MAP[capability] || {});
    
    throw new Error(
      `Unknown provider '${provider}' for capability '${capability}'. ` +
      `Available providers: ${availableProviders.join(', ')}`
    );
  }

  /**
   * Resolve npm package from recipe book
   * 
   * Extracts the primary npm package from packageStructure.dependencies
   * for the given capability and provider.
   */
  private static resolveFromRecipeBook(
    capability: DependencyCapability,
    provider: string,
    recipeBooks: Map<string, RecipeBook>
  ): { package: string; version?: string } | null {
    // Search all recipe books for this capability
    for (const recipeBook of Array.from(recipeBooks.values())) {
      const packageRecipe = recipeBook.packages[capability];
      if (!packageRecipe) continue;

      // Check if provider exists
      const providerRecipe = packageRecipe.providers?.[provider];
      if (!providerRecipe) continue;

      // Get package structure (may be at package level or provider level)
      const packageStructure = packageRecipe.packageStructure;
      if (!packageStructure || !packageStructure.dependencies) {
        continue;
      }

      // Extract primary npm package from dependencies
      // Strategy: Use first dependency, or one matching provider name
      const dependencies = packageStructure.dependencies;
      const depEntries = Object.entries(dependencies);

      if (depEntries.length === 0) {
        continue;
      }

      // Try to find package matching provider name (e.g., "better-auth" for provider "better-auth")
      const matchingDep = depEntries.find(([pkgName]) => 
        pkgName.toLowerCase().includes(provider.toLowerCase()) ||
        provider.toLowerCase().includes(pkgName.toLowerCase())
      );

      if (matchingDep) {
        return {
          package: matchingDep[0],
          version: matchingDep[1] as string
        };
      }

      // Fallback: use first dependency
      if (depEntries.length > 0 && depEntries[0]) {
        const firstDep = depEntries[0];
        return {
          package: firstDep[0],
          version: firstDep[1] as string
        };
      }
    }

    return null;
  }

  /**
   * Get all available providers for a capability from recipe books
   */
  static getAvailableProviders(
    capability: DependencyCapability,
    recipeBooks?: Map<string, RecipeBook>
  ): string[] {
    // PRIORITY 1: Get from recipe books
    if (recipeBooks && recipeBooks.size > 0) {
      const providers = this.getAvailableProvidersFromRecipeBook(capability, recipeBooks);
      if (providers.length > 0) {
        return providers;
      }
    }

    // PRIORITY 2: Fallback to hardcoded mappings
    return Object.keys(this.FALLBACK_CAPABILITY_MAP[capability] || {});
  }

  /**
   * Get available providers from recipe books
   */
  private static getAvailableProvidersFromRecipeBook(
    capability: DependencyCapability,
    recipeBooks: Map<string, RecipeBook>
  ): string[] {
    const providers: string[] = [];

    for (const recipeBook of Array.from(recipeBooks.values())) {
      const packageRecipe = recipeBook.packages[capability];
      if (packageRecipe && packageRecipe.providers) {
        providers.push(...Object.keys(packageRecipe.providers));
      }
    }

    // Deduplicate
    return Array.from(new Set(providers));
  }
}



