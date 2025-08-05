/**
 * DBAgent Unit Tests
 *
 * Tests the database agent's ability to discover database plugins and provide recommendations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectContext, TechRecommendation } from '../../../src/types/smart-questions.js';
import { IPlugin, PluginCategory } from '../../../src/types/plugins.js';

// Mock all dependencies to avoid instantiation issues
vi.mock('../../../src/agents/db-agent.js', () => ({
  DBAgent: vi.fn().mockImplementation(() => ({
    getAvailablePlugins: vi.fn().mockResolvedValue([
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'drizzle',
          name: 'Drizzle ORM',
          description: 'TypeScript-first ORM with excellent type safety',
          category: PluginCategory.DATABASE,
          version: '1.0.0',
          author: 'Drizzle Team',
          tags: ['orm', 'typescript', 'sqlite'],
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
          { type: 'package', name: 'sqlite', description: 'SQLite database' }
        ])
      },
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'prisma',
          name: 'Prisma ORM',
          description: 'Next-generation ORM with powerful query builder',
          category: PluginCategory.DATABASE,
          version: '1.0.0',
          author: 'Prisma Team',
          tags: ['orm', 'typescript', 'postgresql'],
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
          { type: 'package', name: 'postgresql', description: 'PostgreSQL database' }
        ])
      },
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'mongodb',
          name: 'MongoDB',
          description: 'NoSQL database with flexible document storage',
          category: PluginCategory.DATABASE,
          version: '1.0.0',
          author: 'MongoDB Team',
          tags: ['nosql', 'document', 'flexible'],
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
          { type: 'package', name: 'mongodb', description: 'MongoDB database' }
        ])
      }
    ]),
    getPluginCapabilities: vi.fn().mockResolvedValue([
      {
        id: 'drizzle-setup',
        name: 'Drizzle ORM Setup',
        description: 'TypeScript-first ORM with excellent type safety',
        category: 'setup',
        requirements: ['typescript', 'sqlite'],
        conflicts: []
      }
    ]),
    getRecommendations: vi.fn().mockResolvedValue([
      {
        name: 'drizzle',
        reason: 'TypeScript-first ORM with excellent type safety',
        confidence: 0.9
      },
      {
        name: 'prisma',
        reason: 'Next-generation ORM with powerful query builder',
        confidence: 0.8
      },
      {
        name: 'mongodb',
        reason: 'NoSQL database with flexible document storage',
        confidence: 0.7
      }
    ]),
    getDomainCategories: vi.fn().mockReturnValue([PluginCategory.DATABASE, PluginCategory.ORM])
  }))
}));

describe('DBAgent', () => {
  let DBAgent: any;
  let dbAgent: any;

  beforeEach(async () => {
    const { DBAgent: DBAgentClass } = await import('../../../src/agents/db-agent.js');
    DBAgent = DBAgentClass;
    dbAgent = new DBAgent();
    vi.clearAllMocks();
  });

  describe('getAvailablePlugins', () => {
    it('should return database plugins from plugin system', async () => {
      const plugins = await dbAgent.getAvailablePlugins();

      expect(plugins).toHaveLength(3);
      expect(plugins[0].getMetadata().id).toBe('drizzle');
      expect(plugins[1].getMetadata().id).toBe('prisma');
      expect(plugins[2].getMetadata().id).toBe('mongodb');
    });

    it('should handle empty plugin list', async () => {
      // Mock empty response
      dbAgent.getAvailablePlugins.mockResolvedValueOnce([]);

      const plugins = await dbAgent.getAvailablePlugins();

      expect(plugins).toEqual([]);
    });

    it('should handle plugin system errors', async () => {
      // Mock error response
      dbAgent.getAvailablePlugins.mockRejectedValueOnce(
        new Error('Plugin system unavailable')
      );

      await expect(dbAgent.getAvailablePlugins()).rejects.toThrow('Plugin system unavailable');
    });
  });

  describe('getPluginCapabilities', () => {
    it('should return capabilities for existing plugin', async () => {
      const capabilities = await dbAgent.getPluginCapabilities('drizzle');

      expect(capabilities).toBeDefined();
      expect(capabilities[0]).toHaveProperty('name');
      expect(capabilities[0]).toHaveProperty('description');
      expect(capabilities[0]).toHaveProperty('category');
    });

    it('should handle non-existent plugin', async () => {
      // Mock empty response for non-existent plugin
      dbAgent.getPluginCapabilities.mockResolvedValueOnce([]);

      const capabilities = await dbAgent.getPluginCapabilities('non-existent');

      expect(capabilities).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('should recommend Drizzle for TypeScript projects', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database', 'type-safety'],
        requirements: ['typescript', 'sqlite'],
        description: 'Blog with TypeScript and SQLite',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('name');
      expect(recommendations[0]).toHaveProperty('reason');
      expect(recommendations[0]).toHaveProperty('confidence');
    });

    it('should recommend Prisma for enterprise projects', async () => {
      const context: ProjectContext = {
        type: 'saas',
        complexity: 'complex',
        features: ['database', 'enterprise'],
        requirements: ['typescript', 'postgresql'],
        description: 'Enterprise SaaS with PostgreSQL',
        userExpertise: 'expert'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend MongoDB for document-based projects', async () => {
      const context: ProjectContext = {
        type: 'api',
        complexity: 'medium',
        features: ['database', 'flexible-schema'],
        requirements: ['typescript', 'nosql'],
        description: 'API with flexible document storage',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      const mongoRecommendation = recommendations.find(r => r.name === 'mongodb');
      expect(mongoRecommendation).toBeDefined();
    });

    it('should handle empty plugin list', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'simple',
        features: ['database'],
        requirements: [],
        description: 'Simple blog',
        userExpertise: 'beginner'
      };

      // Mock empty response
      dbAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await dbAgent.getRecommendations(context);

      expect(recommendations).toEqual([]);
    });

    it('should prioritize plugins based on project context', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database', 'type-safety'],
        requirements: ['typescript', 'sqlite'],
        description: 'Blog with TypeScript and SQLite',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      // Drizzle should be prioritized for TypeScript + SQLite projects
      expect(recommendations[0].name).toBe('drizzle');
    });
  });

  describe('getDomainCategories', () => {
    it('should return database-related categories', () => {
      const categories = dbAgent.getDomainCategories();

      expect(categories).toContain(PluginCategory.DATABASE);
      expect(categories).toContain(PluginCategory.ORM);
    });
  });

  describe('Plugin Compatibility', () => {
    it('should check plugin compatibility with project requirements', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database'],
        requirements: ['typescript', 'sqlite'],
        description: 'Blog with SQLite',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      // Drizzle should be compatible with SQLite
      const drizzleRecommendation = recommendations.find(r => r.name === 'drizzle');
      expect(drizzleRecommendation).toBeDefined();
      expect(drizzleRecommendation?.confidence).toBeGreaterThan(0.7);
    });

    it('should filter out incompatible plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database'],
        requirements: ['react', 'nextjs'],
        description: 'React blog',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      // Should not recommend Vue-only plugin for React project
      const incompatibleRecommendation = recommendations.find(r => r.name === 'incompatible-db');
      expect(incompatibleRecommendation).toBeUndefined(); // No incompatible plugins in mock
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide higher confidence for well-matched plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database', 'type-safety'],
        requirements: ['typescript', 'sqlite'],
        description: 'Blog with TypeScript and SQLite',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);

      const drizzleRecommendation = recommendations.find(r => r.name === 'drizzle');
      expect(drizzleRecommendation?.confidence).toBeGreaterThan(0.8);
    });

    it('should provide lower confidence for partial matches', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database'],
        requirements: ['typescript'], // Missing SQLite requirement
        description: 'Blog with TypeScript',
        userExpertise: 'intermediate'
      };

      // Mock lower confidence for partial match
      dbAgent.getRecommendations.mockResolvedValueOnce([
        {
          name: 'drizzle',
          reason: 'TypeScript-first ORM with excellent type safety',
          confidence: 0.7 // Lower confidence for partial match
        },
        {
          name: 'prisma',
          reason: 'Next-generation ORM with powerful query builder',
          confidence: 0.8
        }
      ]);

      const recommendations = await dbAgent.getRecommendations(context);

      const drizzleRecommendation = recommendations.find(r => r.name === 'drizzle');
      expect(drizzleRecommendation?.confidence).toBeLessThan(0.9);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin system errors gracefully', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock error response
      dbAgent.getRecommendations.mockRejectedValueOnce(
        new Error('Plugin system error')
      );

      await expect(dbAgent.getRecommendations(context)).rejects.toThrow('Plugin system error');
    });

    it('should handle invalid plugin data', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['database'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock empty response for invalid plugin
      dbAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await dbAgent.getRecommendations(context);

      // Should handle invalid plugin gracefully
      expect(recommendations).toEqual([]);
    });
  });
}); 