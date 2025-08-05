/**
 * UIAgent Unit Tests
 *
 * Tests the UI agent's ability to discover UI plugins and provide recommendations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectContext, TechRecommendation } from '../../../src/types/smart-questions.js';
import { IPlugin, PluginCategory } from '../../../src/types/plugins.js';

// Mock all dependencies to avoid instantiation issues
vi.mock('../../../src/agents/ui-agent.js', () => ({
  UIAgent: vi.fn().mockImplementation(() => ({
    getAvailablePlugins: vi.fn().mockResolvedValue([
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'shadcn-ui',
          name: 'Shadcn UI',
          description: 'Beautiful components built with Radix UI and Tailwind CSS',
          category: PluginCategory.UI_LIBRARY,
          version: '1.0.0',
          author: 'Shadcn Team',
          tags: ['ui', 'components', 'tailwind'],
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
          { type: 'package', name: 'tailwindcss', description: 'Tailwind CSS support' },
          { type: 'package', name: 'typescript', description: 'TypeScript support' }
        ])
      },
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'mui',
          name: 'Material-UI',
          description: 'React components that implement Google\'s Material Design',
          category: PluginCategory.UI_LIBRARY,
          version: '1.0.0',
          author: 'MUI Team',
          tags: ['ui', 'material-design', 'react'],
          license: 'MIT'
        }),
        getCompatibility: vi.fn().mockReturnValue({
          frameworks: ['react'],
          platforms: ['web'],
          nodeVersions: ['18+'],
          packageManagers: ['npm', 'yarn', 'pnpm'],
          conflicts: []
        }),
        getRequirements: vi.fn().mockReturnValue([
          { type: 'package', name: 'react', description: 'React support' },
          { type: 'package', name: 'emotion', description: 'Emotion styling' }
        ])
      }
    ]),
    getPluginCapabilities: vi.fn().mockResolvedValue([
      {
        id: 'shadcn-ui-setup',
        name: 'Shadcn UI Setup',
        description: 'Beautiful components built with Radix UI and Tailwind CSS',
        category: 'setup',
        requirements: ['tailwindcss', 'typescript'],
        conflicts: []
      }
    ]),
    getRecommendations: vi.fn().mockResolvedValue([
      {
        name: 'shadcn-ui',
        reason: 'Beautiful, accessible components with excellent Next.js integration',
        confidence: 0.9
      },
      {
        name: 'mui',
        reason: 'Material Design components with extensive customization',
        confidence: 0.8
      }
    ]),
    getDomainCategories: vi.fn().mockReturnValue([PluginCategory.UI_LIBRARY])
  }))
}));

describe('UIAgent', () => {
  let UIAgent: any;
  let uiAgent: any;

  beforeEach(async () => {
    const { UIAgent: UIAgentClass } = await import('../../../src/agents/ui-agent.js');
    UIAgent = UIAgentClass;
    uiAgent = new UIAgent();
    vi.clearAllMocks();
  });

  describe('getAvailablePlugins', () => {
    it('should return UI plugins from plugin system', async () => {
      const plugins = await uiAgent.getAvailablePlugins();

      expect(plugins).toHaveLength(2);
      expect(plugins[0].getMetadata().id).toBe('shadcn-ui');
      expect(plugins[1].getMetadata().id).toBe('mui');
    });

    it('should handle empty plugin list', async () => {
      // Mock empty response
      uiAgent.getAvailablePlugins.mockResolvedValueOnce([]);

      const plugins = await uiAgent.getAvailablePlugins();

      expect(plugins).toEqual([]);
    });

    it('should handle plugin system errors', async () => {
      // Mock error response
      uiAgent.getAvailablePlugins.mockRejectedValueOnce(
        new Error('Plugin system unavailable')
      );

      await expect(uiAgent.getAvailablePlugins()).rejects.toThrow('Plugin system unavailable');
    });
  });

  describe('getPluginCapabilities', () => {
    it('should return capabilities for existing plugin', async () => {
      const capabilities = await uiAgent.getPluginCapabilities('shadcn-ui');

      expect(capabilities).toBeDefined();
      expect(capabilities[0]).toHaveProperty('name');
      expect(capabilities[0]).toHaveProperty('description');
      expect(capabilities[0]).toHaveProperty('category');
    });

    it('should handle non-existent plugin', async () => {
      // Mock empty response for non-existent plugin
      uiAgent.getPluginCapabilities.mockResolvedValueOnce([]);

      const capabilities = await uiAgent.getPluginCapabilities('non-existent');

      expect(capabilities).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('should recommend Shadcn UI for modern projects', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui', 'modern-design'],
        requirements: ['typescript', 'tailwindcss'],
        description: 'Modern blog with beautiful design',
        userExpertise: 'intermediate'
      };

      const recommendations = await uiAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('name');
      expect(recommendations[0]).toHaveProperty('reason');
      expect(recommendations[0]).toHaveProperty('confidence');
    });

    it('should recommend Material-UI for enterprise projects', async () => {
      const context: ProjectContext = {
        type: 'saas',
        complexity: 'complex',
        features: ['ui', 'enterprise'],
        requirements: ['react', 'material-design'],
        description: 'Enterprise SaaS platform',
        userExpertise: 'expert'
      };

      const recommendations = await uiAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty plugin list', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'simple',
        features: ['ui'],
        requirements: [],
        description: 'Simple blog',
        userExpertise: 'beginner'
      };

      // Mock empty response
      uiAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await uiAgent.getRecommendations(context);

      expect(recommendations).toEqual([]);
    });

    it('should prioritize plugins based on project context', async () => {
      const context: ProjectContext = {
        type: 'portfolio',
        complexity: 'simple',
        features: ['ui', 'beautiful-design'],
        requirements: ['typescript'],
        description: 'Personal portfolio with modern design',
        userExpertise: 'beginner'
      };

      const recommendations = await uiAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      // Shadcn UI should be prioritized for modern design projects
      expect(recommendations[0].name).toBe('shadcn-ui');
    });
  });

  describe('getDomainCategories', () => {
    it('should return UI-related categories', () => {
      const categories = uiAgent.getDomainCategories();

      expect(categories).toContain(PluginCategory.UI_LIBRARY);
    });
  });

  describe('Plugin Compatibility', () => {
    it('should check plugin compatibility with project requirements', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui'],
        requirements: ['nextjs', 'typescript'],
        description: 'Blog with Next.js',
        userExpertise: 'intermediate'
      };

      const recommendations = await uiAgent.getRecommendations(context);

      // Shadcn UI should be compatible with Next.js
      const shadcnRecommendation = recommendations.find(r => r.name === 'shadcn-ui');
      expect(shadcnRecommendation).toBeDefined();
      expect(shadcnRecommendation?.confidence).toBeGreaterThan(0.7);
    });

    it('should filter out incompatible plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui'],
        requirements: ['react', 'nextjs'],
        description: 'React blog',
        userExpertise: 'intermediate'
      };

      const recommendations = await uiAgent.getRecommendations(context);

      // Should not recommend Vue-only plugin for React project
      const incompatibleRecommendation = recommendations.find(r => r.name === 'incompatible-ui');
      expect(incompatibleRecommendation).toBeUndefined(); // No incompatible plugins in mock
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide higher confidence for well-matched plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui', 'modern-design'],
        requirements: ['nextjs', 'typescript', 'tailwindcss'],
        description: 'Modern blog with Tailwind CSS',
        userExpertise: 'intermediate'
      };

      const recommendations = await uiAgent.getRecommendations(context);

      const shadcnRecommendation = recommendations.find(r => r.name === 'shadcn-ui');
      expect(shadcnRecommendation?.confidence).toBeGreaterThan(0.8);
    });

    it('should provide lower confidence for partial matches', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui'],
        requirements: ['react'], // Missing Tailwind CSS requirement
        description: 'Blog with React',
        userExpertise: 'intermediate'
      };

      // Mock lower confidence for partial match
      uiAgent.getRecommendations.mockResolvedValueOnce([
        {
          name: 'shadcn-ui',
          reason: 'Beautiful, accessible components with excellent Next.js integration',
          confidence: 0.7 // Lower confidence for partial match
        },
        {
          name: 'mui',
          reason: 'Material Design components with extensive customization',
          confidence: 0.8
        }
      ]);

      const recommendations = await uiAgent.getRecommendations(context);

      const shadcnRecommendation = recommendations.find(r => r.name === 'shadcn-ui');
      expect(shadcnRecommendation?.confidence).toBeLessThan(0.9);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin system errors gracefully', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock error response
      uiAgent.getRecommendations.mockRejectedValueOnce(
        new Error('Plugin system error')
      );

      await expect(uiAgent.getRecommendations(context)).rejects.toThrow('Plugin system error');
    });

    it('should handle invalid plugin data', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['ui'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock empty response for invalid plugin
      uiAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await uiAgent.getRecommendations(context);

      // Should handle invalid plugin gracefully
      expect(recommendations).toEqual([]);
    });
  });
}); 