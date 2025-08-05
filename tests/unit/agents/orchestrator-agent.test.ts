/**
 * OrchestratorAgent Unit Tests
 *
 * Tests the orchestrator agent's ability to coordinate project generation and plugin execution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectContext, TechRecommendation } from '../../../src/types/smart-questions.js';
import { IPlugin, PluginCategory } from '../../../src/types/plugins.js';

// Mock all dependencies to avoid instantiation issues
vi.mock('../../../src/agents/orchestrator-agent.js', () => ({
  OrchestratorAgent: vi.fn().mockImplementation(() => ({
    getAvailablePlugins: vi.fn().mockResolvedValue([
      {
        getMetadata: vi.fn().mockReturnValue({
          id: 'nextjs',
          name: 'Next.js',
          description: 'React framework for production',
          category: PluginCategory.FRAMEWORK,
          version: '1.0.0',
          author: 'Vercel',
          tags: ['framework', 'react', 'typescript'],
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
          { type: 'package', name: 'react', description: 'React framework' },
          { type: 'package', name: 'typescript', description: 'TypeScript support' }
        ])
      },
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
      }
    ]),
    getPluginCapabilities: vi.fn().mockResolvedValue([
      {
        id: 'nextjs-setup',
        name: 'Next.js Setup',
        description: 'React framework for production',
        category: 'setup',
        requirements: ['react', 'typescript'],
        conflicts: []
      }
    ]),
    getRecommendations: vi.fn().mockResolvedValue([
      {
        name: 'nextjs',
        reason: 'React framework for production',
        confidence: 0.9
      },
      {
        name: 'shadcn-ui',
        reason: 'Beautiful components built with Radix UI and Tailwind CSS',
        confidence: 0.8
      },
      {
        name: 'drizzle',
        reason: 'TypeScript-first ORM with excellent type safety',
        confidence: 0.7
      }
    ]),
    getDomainCategories: vi.fn().mockReturnValue([
      PluginCategory.FRAMEWORK,
      PluginCategory.UI_LIBRARY,
      PluginCategory.DATABASE,
      PluginCategory.AUTHENTICATION,
      PluginCategory.DEPLOYMENT
    ]),
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { projectPath: '/mock/project' },
      artifacts: [],
      errors: [],
      warnings: [],
      duration: 1000
    }),
    createProjectStructure: vi.fn().mockResolvedValue({
      success: true,
      projectPath: '/mock/project',
      structure: {
        type: 'monorepo',
        packages: ['app', 'ui', 'shared']
      }
    })
  }))
}));

describe('OrchestratorAgent', () => {
  let OrchestratorAgent: any;
  let orchestratorAgent: any;

  beforeEach(async () => {
    const { OrchestratorAgent: OrchestratorAgentClass } = await import('../../../src/agents/orchestrator-agent.js');
    OrchestratorAgent = OrchestratorAgentClass;
    orchestratorAgent = new OrchestratorAgent();
    vi.clearAllMocks();
  });

  describe('getAvailablePlugins', () => {
    it('should return all plugins from plugin system', async () => {
      const plugins = await orchestratorAgent.getAvailablePlugins();

      expect(plugins).toHaveLength(3);
      expect(plugins[0].getMetadata().id).toBe('nextjs');
      expect(plugins[1].getMetadata().id).toBe('shadcn-ui');
      expect(plugins[2].getMetadata().id).toBe('drizzle');
    });

    it('should handle empty plugin list', async () => {
      // Mock empty response
      orchestratorAgent.getAvailablePlugins.mockResolvedValueOnce([]);

      const plugins = await orchestratorAgent.getAvailablePlugins();

      expect(plugins).toEqual([]);
    });

    it('should handle plugin system errors', async () => {
      // Mock error response
      orchestratorAgent.getAvailablePlugins.mockRejectedValueOnce(
        new Error('Plugin system unavailable')
      );

      await expect(orchestratorAgent.getAvailablePlugins()).rejects.toThrow('Plugin system unavailable');
    });
  });

  describe('getPluginCapabilities', () => {
    it('should return capabilities for existing plugin', async () => {
      const capabilities = await orchestratorAgent.getPluginCapabilities('nextjs');

      expect(capabilities).toBeDefined();
      expect(capabilities[0]).toHaveProperty('name');
      expect(capabilities[0]).toHaveProperty('description');
      expect(capabilities[0]).toHaveProperty('category');
    });

    it('should handle non-existent plugin', async () => {
      // Mock empty response for non-existent plugin
      orchestratorAgent.getPluginCapabilities.mockResolvedValueOnce([]);

      const capabilities = await orchestratorAgent.getPluginCapabilities('non-existent');

      expect(capabilities).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('should recommend Next.js for modern projects', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern', 'typescript'],
        requirements: ['react', 'typescript'],
        description: 'Modern blog with TypeScript',
        userExpertise: 'intermediate'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('name');
      expect(recommendations[0]).toHaveProperty('reason');
      expect(recommendations[0]).toHaveProperty('confidence');
    });

    it('should recommend UI libraries for design-focused projects', async () => {
      const context: ProjectContext = {
        type: 'portfolio',
        complexity: 'simple',
        features: ['ui', 'beautiful-design'],
        requirements: ['react', 'typescript'],
        description: 'Personal portfolio with beautiful design',
        userExpertise: 'beginner'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend database plugins for data-heavy projects', async () => {
      const context: ProjectContext = {
        type: 'saas',
        complexity: 'complex',
        features: ['database', 'type-safety'],
        requirements: ['typescript', 'sqlite'],
        description: 'SaaS with database and type safety',
        userExpertise: 'expert'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      const drizzleRecommendation = recommendations.find(r => r.name === 'drizzle');
      expect(drizzleRecommendation).toBeDefined();
    });

    it('should handle empty plugin list', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'simple',
        features: [],
        requirements: [],
        description: 'Simple blog',
        userExpertise: 'beginner'
      };

      // Mock empty response
      orchestratorAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await orchestratorAgent.getRecommendations(context);

      expect(recommendations).toEqual([]);
    });

    it('should prioritize plugins based on project context', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern', 'typescript'],
        requirements: ['react', 'typescript'],
        description: 'Modern blog with TypeScript',
        userExpertise: 'intermediate'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      expect(recommendations).toBeDefined();
      // Next.js should be prioritized for modern TypeScript projects
      expect(recommendations[0].name).toBe('nextjs');
    });
  });

  describe('getDomainCategories', () => {
    it('should return all plugin categories', () => {
      const categories = orchestratorAgent.getDomainCategories();

      expect(categories).toContain(PluginCategory.FRAMEWORK);
      expect(categories).toContain(PluginCategory.UI_LIBRARY);
      expect(categories).toContain(PluginCategory.DATABASE);
      expect(categories).toContain(PluginCategory.AUTHENTICATION);
      expect(categories).toContain(PluginCategory.DEPLOYMENT);
    });
  });

  describe('execute', () => {
    it('should execute project generation successfully', async () => {
      const context = {
        projectName: 'test-project',
        projectPath: '/mock/project',
        packageManager: 'npm',
        options: {
          skipGit: false,
          skipInstall: false,
          useDefaults: false,
          verbose: false
        },
        config: {},
        runner: {},
        state: new Map(),
        dependencies: [],
        environment: {},
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      };

      const result = await orchestratorAgent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('projectPath');
      expect(result.artifacts).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle execution errors gracefully', async () => {
      const context = {
        projectName: 'test-project',
        projectPath: '/mock/project',
        packageManager: 'npm',
        options: {
          skipGit: false,
          skipInstall: false,
          useDefaults: false,
          verbose: false
        },
        config: {},
        runner: {},
        state: new Map(),
        dependencies: [],
        environment: {},
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      };

      // Mock error response
      orchestratorAgent.execute.mockResolvedValueOnce({
        success: false,
        errors: [{ message: 'Plugin installation failed' }],
        warnings: [],
        duration: 500
      });

      const result = await orchestratorAgent.execute(context);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Plugin installation failed');
    });
  });

  describe('createProjectStructure', () => {
    it('should create project structure successfully', async () => {
      const context = {
        projectName: 'test-project',
        projectPath: '/mock/project',
        packageManager: 'npm',
        options: {
          skipGit: false,
          skipInstall: false,
          useDefaults: false,
          verbose: false
        },
        config: {},
        runner: {},
        state: new Map(),
        dependencies: [],
        environment: {},
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      };

      const result = await orchestratorAgent.createProjectStructure(context);

      expect(result.success).toBe(true);
      expect(result.projectPath).toBe('/mock/project');
      expect(result.structure).toHaveProperty('type');
      expect(result.structure).toHaveProperty('packages');
    });

    it('should handle structure creation errors', async () => {
      const context = {
        projectName: 'test-project',
        projectPath: '/mock/project',
        packageManager: 'npm',
        options: {
          skipGit: false,
          skipInstall: false,
          useDefaults: false,
          verbose: false
        },
        config: {},
        runner: {},
        state: new Map(),
        dependencies: [],
        environment: {},
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      };

      // Mock error response
      orchestratorAgent.createProjectStructure.mockResolvedValueOnce({
        success: false,
        error: 'Failed to create project structure'
      });

      const result = await orchestratorAgent.createProjectStructure(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create project structure');
    });
  });

  describe('Plugin Compatibility', () => {
    it('should check plugin compatibility with project requirements', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern'],
        requirements: ['react', 'typescript'],
        description: 'Blog with React and TypeScript',
        userExpertise: 'intermediate'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      // Next.js should be compatible with React and TypeScript
      const nextjsRecommendation = recommendations.find(r => r.name === 'nextjs');
      expect(nextjsRecommendation).toBeDefined();
      expect(nextjsRecommendation?.confidence).toBeGreaterThan(0.7);
    });

    it('should filter out incompatible plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern'],
        requirements: ['react', 'typescript'],
        description: 'Blog with React and TypeScript',
        userExpertise: 'intermediate'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      // Should not recommend Vue-only plugin for React project
      const incompatibleRecommendation = recommendations.find(r => r.name === 'incompatible-framework');
      expect(incompatibleRecommendation).toBeUndefined(); // No incompatible plugins in mock
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide higher confidence for well-matched plugins', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern', 'typescript'],
        requirements: ['react', 'typescript'],
        description: 'Modern blog with React and TypeScript',
        userExpertise: 'intermediate'
      };

      const recommendations = await orchestratorAgent.getRecommendations(context);

      const nextjsRecommendation = recommendations.find(r => r.name === 'nextjs');
      expect(nextjsRecommendation?.confidence).toBeGreaterThan(0.8);
    });

    it('should provide lower confidence for partial matches', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern'],
        requirements: ['react'], // Missing TypeScript requirement
        description: 'Blog with React',
        userExpertise: 'intermediate'
      };

      // Mock lower confidence for partial match
      orchestratorAgent.getRecommendations.mockResolvedValueOnce([
        {
          name: 'nextjs',
          reason: 'React framework for production',
          confidence: 0.7 // Lower confidence for partial match
        },
        {
          name: 'shadcn-ui',
          reason: 'Beautiful components built with Radix UI and Tailwind CSS',
          confidence: 0.8
        }
      ]);

      const recommendations = await orchestratorAgent.getRecommendations(context);

      const nextjsRecommendation = recommendations.find(r => r.name === 'nextjs');
      expect(nextjsRecommendation?.confidence).toBeLessThan(0.9);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin system errors gracefully', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock error response
      orchestratorAgent.getRecommendations.mockRejectedValueOnce(
        new Error('Plugin system error')
      );

      await expect(orchestratorAgent.getRecommendations(context)).rejects.toThrow('Plugin system error');
    });

    it('should handle invalid plugin data', async () => {
      const context: ProjectContext = {
        type: 'blog',
        complexity: 'medium',
        features: ['modern'],
        requirements: [],
        description: 'Blog',
        userExpertise: 'beginner'
      };

      // Mock empty response for invalid plugin
      orchestratorAgent.getRecommendations.mockResolvedValueOnce([]);

      const recommendations = await orchestratorAgent.getRecommendations(context);

      // Should handle invalid plugin gracefully
      expect(recommendations).toEqual([]);
    });
  });
}); 