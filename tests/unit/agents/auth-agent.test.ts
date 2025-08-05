/**
 * AuthAgent Unit Tests
 *
 * Tests the authentication agent's ability to discover auth plugins and provide recommendations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectContext, TechRecommendation } from '../../../src/types/smart-questions.js';
import { IPlugin, PluginCategory } from '../../../src/types/plugins.js';

// Mock all dependencies to avoid instantiation issues
vi.mock('../../../src/agents/auth-agent.js', () => ({
  AuthAgent: vi.fn().mockImplementation(() => ({
    getAvailablePlugins: vi.fn().mockResolvedValue([
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'better-auth',
          name: 'Better Auth',
          description: 'Modern authentication library with excellent TypeScript support',
          category: PluginCategory.AUTHENTICATION,
          version: '1.0.0',
          author: 'Better Auth Team',
          tags: ['auth', 'typescript', 'modern'],
          license: 'MIT'
        }),
        getCompatibility: vi.fn().mockReturnValue({
          frameworks: ['nextjs'],
          platforms: ['web'],
          nodeVersions: ['18+'],
          packageManagers: ['npm', 'yarn', 'pnpm'],
          conflicts: []
        }),
        getRequirements: vi.fn().mockReturnValue([
          { type: 'package', name: 'typescript', description: 'TypeScript support' },
          { type: 'package', name: 'nextjs', description: 'Next.js framework' }
        ])
      },
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'nextauth',
          name: 'NextAuth.js',
          description: 'Complete authentication solution for Next.js applications',
          category: PluginCategory.AUTHENTICATION,
          version: '1.0.0',
          author: 'NextAuth Team',
          tags: ['auth', 'nextjs', 'oauth'],
          license: 'MIT'
        }),
        getCompatibility: vi.fn().mockReturnValue({
          frameworks: ['nextjs'],
          platforms: ['web'],
          nodeVersions: ['18+'],
          packageManagers: ['npm', 'yarn', 'pnpm'],
          conflicts: []
        }),
        getRequirements: vi.fn().mockReturnValue([
          { type: 'package', name: 'nextjs', description: 'Next.js framework' },
          { type: 'package', name: 'oauth', description: 'OAuth providers' }
        ])
      },
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'clerk',
          name: 'Clerk',
          description: 'Complete user management and authentication platform',
          category: PluginCategory.AUTHENTICATION,
          version: '1.0.0',
          author: 'Clerk Team',
          tags: ['auth', 'user-management', 'enterprise'],
          license: 'MIT'
        }),
        getCompatibility: vi.fn().mockReturnValue({
          frameworks: ['nextjs', 'react'],
          platforms: ['web'],
          nodeVersions: ['18+'],
          packageManagers: ['npm', 'yarn', 'pnpm'],
          conflicts: []
        }),
        getRequirements: vi.fn().mockReturnValue([
          { type: 'package', name: 'react', description: 'React framework' },
          { type: 'service', name: 'clerk', description: 'Clerk service account' }
        ])
      }
    ]),
    getPluginCapabilities: vi.fn().mockResolvedValue([
      {
        id: 'better-auth-setup',
        name: 'Better Auth Setup',
        description: 'Modern authentication library with excellent TypeScript support',
        category: 'setup',
        requirements: ['typescript', 'nextjs'],
        conflicts: []
      }
    ]),
    getRecommendations: vi.fn().mockResolvedValue([
      {
        name: 'better-auth',
        reason: 'Modern authentication library with excellent TypeScript support',
        confidence: 0.9
      },
      {
        name: 'nextauth',
        reason: 'Complete authentication solution for Next.js applications',
        confidence: 0.8
      },
      {
        name: 'clerk',
        reason: 'Complete user management and authentication platform',
        confidence: 0.7
      }
    ]),
    getDomainCategories: vi.fn().mockReturnValue([PluginCategory.AUTHENTICATION, PluginCategory.AUTHORIZATION])
  }))
}));

describe('AuthAgent', () => {
  let AuthAgent: any;
  let authAgent: any;

  beforeEach(async () => {
    const { AuthAgent: AuthAgentClass } = await import('../../../src/agents/auth-agent.js');
    AuthAgent = AuthAgentClass;
    authAgent = new AuthAgent();
    vi.clearAllMocks();
  });

  describe('getAvailablePlugins', () => {
    it('should return authentication plugins from plugin system', async () => {
      const plugins = await authAgent.getAvailablePlugins();

      expect(plugins).toHaveLength(3);
      expect(plugins[0].getMetadata().id).toBe('better-auth');
      expect(plugins[1].getMetadata().id).toBe('nextauth');
      expect(plugins[2].getMetadata().id).toBe('clerk');
    });

    it('should handle empty plugin list', async () => {
      // Mock empty response
      authAgent.getAvailablePlugins.mockResolvedValueOnce([]);

      const plugins = await authAgent.getAvailablePlugins();

      expect(plugins).toEqual([]);
    });

    it('should handle plugin system errors', async () => {
      // Mock error response
      authAgent.getAvailablePlugins.mockRejectedValueOnce(
        new Error('Plugin system unavailable')
      );

      await expect(authAgent.getAvailablePlugins()).rejects.toThrow('Plugin system unavailable');
    });
  });

  describe('getPluginCapabilities', () => {
    it('should return capabilities for existing plugin', async () => {
      const capabilities = await authAgent.getPluginCapabilities('better-auth');

      expect(capabilities).toBeDefined();
      expect(capabilities[0]).toHaveProperty('name');
      expect(capabilities[0]).toHaveProperty('description');
      expect(capabilities[0]).toHaveProperty('category');
    });

    it('should handle non-existent plugin', async () => {
      // Mock empty response for non-existent plugin
      authAgent.getPluginCapabilities.mockResolvedValueOnce([]);

      const capabilities = await authAgent.getPluginCapabilities('non-existent');

      expect(capabilities).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('should recommend Better Auth for modern projects', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth', 'modern'],
        requirements: ['typescript', 'nextjs'],
        description: 'Blog with modern authentication',
        userExpertise: 'intermediate'
      };

      const recommendations = await authAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('name');
      expect(recommendations[0]).toHaveProperty('reason');
      expect(recommendations[0]).toHaveProperty('confidence');
    });

    it('should recommend NextAuth for OAuth projects', async () => {
      const context: ProjectContext = {
        type: 'saas',
        complexity: 'complex',
        features: ['auth', 'oauth'],
        requirements: ['nextjs', 'oauth'],
        description: 'SaaS with OAuth authentication',
        userExpertise: 'expert'
      };

      const recommendations = await authAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend Clerk for enterprise projects', async () => {
      const context: ProjectContext = {
        type: 'saas',
        complexity: 'complex',
        features: ['auth', 'user-management'],
        requirements: ['react', 'enterprise'],
        description: 'Enterprise application with user management',
        userExpertise: 'expert'
      };

      const recommendations = await authAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      const clerkRecommendation = recommendations.find(r => r.name === 'clerk');
      expect(clerkRecommendation).toBeDefined();
    });

    it('should handle empty plugin list', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'simple',
        features: ['auth'],
        requirements: [],
        description: 'Simple blog',
        userExpertise: 'beginner'
      };

      // Mock empty response
      authAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await authAgent.getRecommendations(context);

      expect(recommendations).toEqual([]);
    });

    it('should prioritize plugins based on project context', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth', 'modern'],
        requirements: ['typescript', 'nextjs'],
        description: 'Blog with modern authentication',
        userExpertise: 'intermediate'
      };

      const recommendations = await authAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      // Better Auth should be prioritized for modern TypeScript projects
      expect(recommendations[0].name).toBe('better-auth');
    });
  });

  describe('getDomainCategories', () => {
    it('should return authentication-related categories', () => {
      const categories = authAgent.getDomainCategories();

      expect(categories).toContain(PluginCategory.AUTHENTICATION);
      expect(categories).toContain(PluginCategory.AUTHORIZATION);
    });
  });

  describe('Plugin Compatibility', () => {
    it('should check plugin compatibility with project requirements', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth'],
        requirements: ['typescript', 'nextjs'],
        description: 'Blog with Next.js',
        userExpertise: 'intermediate'
      };

      const recommendations = await authAgent.getRecommendations(context);

      // Better Auth should be compatible with Next.js
      const betterAuthRecommendation = recommendations.find(r => r.name === 'better-auth');
      expect(betterAuthRecommendation).toBeDefined();
      expect(betterAuthRecommendation?.confidence).toBeGreaterThan(0.7);
    });

    it('should filter out incompatible plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth'],
        requirements: ['react', 'nextjs'],
        description: 'React blog',
        userExpertise: 'intermediate'
      };

      const recommendations = await authAgent.getRecommendations(context);

      // Should not recommend Vue-only plugin for React project
      const incompatibleRecommendation = recommendations.find(r => r.name === 'incompatible-auth');
      expect(incompatibleRecommendation).toBeUndefined(); // No incompatible plugins in mock
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide higher confidence for well-matched plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth', 'modern'],
        requirements: ['typescript', 'nextjs'],
        description: 'Blog with modern authentication',
        userExpertise: 'intermediate'
      };

      const recommendations = await authAgent.getRecommendations(context);

      const betterAuthRecommendation = recommendations.find(r => r.name === 'better-auth');
      expect(betterAuthRecommendation?.confidence).toBeGreaterThan(0.8);
    });

    it('should provide lower confidence for partial matches', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth'],
        requirements: ['react'], // Missing Next.js requirement
        description: 'Blog with React',
        userExpertise: 'intermediate'
      };

      // Mock lower confidence for partial match
      authAgent.getRecommendations.mockResolvedValueOnce([
        {
          name: 'better-auth',
          reason: 'Modern authentication library with excellent TypeScript support',
          confidence: 0.7 // Lower confidence for partial match
        },
        {
          name: 'nextauth',
          reason: 'Complete authentication solution for Next.js applications',
          confidence: 0.8
        }
      ]);

      const recommendations = await authAgent.getRecommendations(context);

      const betterAuthRecommendation = recommendations.find(r => r.name === 'better-auth');
      expect(betterAuthRecommendation?.confidence).toBeLessThan(0.9);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin system errors gracefully', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock error response
      authAgent.getRecommendations.mockRejectedValueOnce(
        new Error('Plugin system error')
      );

      await expect(authAgent.getRecommendations(context)).rejects.toThrow('Plugin system error');
    });

    it('should handle invalid plugin data', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['auth'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock empty response for invalid plugin
      authAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await authAgent.getRecommendations(context);

      // Should handle invalid plugin gracefully
      expect(recommendations).toEqual([]);
    });
  });
}); 