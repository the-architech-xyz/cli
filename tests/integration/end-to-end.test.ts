/**
 * End-to-End Integration Tests
 *
 * Tests complete user workflows and project generation processes.
 * Focuses on testing the core flow rather than full project generation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SmartRecommender } from '../../src/core/questions/smart-recommender.js';
import { UnifiedQuestioner } from '../../src/core/questions/unified-questioner.js';
import { ConfigBuilder } from '../../src/core/questions/config-builder.js';
import { OrchestratorAgent } from '../../src/agents/orchestrator-agent.js';
import { PluginSystem } from '../../src/core/plugin/plugin-system.js';
import { ProjectRecommendation, ProjectContext } from '../../src/types/smart-questions.js';
import { AgentContext, ExecutionOptions } from '../../src/types/agents.js';
import { CommandRunner } from '../../src/core/cli/command-runner.js';

// Mock file system operations
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(''),
    existsSync: vi.fn().mockReturnValue(false),
    copy: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(false),
    writeJson: vi.fn().mockResolvedValue(undefined),
    readJson: vi.fn().mockResolvedValue({}),
    mkdirp: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({
      accepted: true
    })
  }
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    magenta: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text)
  }
}));

describe('End-to-End Integration Tests', () => {
  let smartRecommender: SmartRecommender;
  let unifiedQuestioner: UnifiedQuestioner;
  let configBuilder: ConfigBuilder;
  let orchestratorAgent: OrchestratorAgent;
  let pluginSystem: PluginSystem;

  beforeEach(async () => {
    // Initialize plugin system
    pluginSystem = new PluginSystem();

    // Initialize components
    smartRecommender = new SmartRecommender();
    unifiedQuestioner = new UnifiedQuestioner();
    configBuilder = new ConfigBuilder();
    orchestratorAgent = new OrchestratorAgent();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create AgentContext
  function createAgentContext(projectName: string, config: any): AgentContext {
    const options: ExecutionOptions = {
      skipGit: false,
      skipInstall: false,
      useDefaults: true,
      verbose: false
    };

    // Create a simple mock logger
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      success: vi.fn(),
      log: vi.fn()
    };

    return {
      projectName,
      projectPath: `/tmp/${projectName}`,
      userInput: 'Test project',
      config,
      options,
      logger: mockLogger,
      state: new Map(),
      packageManager: 'npm',
      runner: new CommandRunner(),
      dependencies: [],
      environment: {
        nodeVersion: '18.0.0',
        platform: 'darwin',
        arch: 'x64',
        cwd: '/tmp',
        env: {
          NODE_ENV: 'test',
          PATH: '/usr/local/bin:/usr/bin:/bin'
        }
      }
    };
  }

  describe('Core Flow Tests', () => {
    it('should complete the core recommendation flow for blog projects', async () => {
      // Step 1: User provides input
      const userInput = 'I want to create a blog with beautiful design and user authentication';

      // Step 2: Smart Recommender analyzes input
      const recommendation = await smartRecommender.getRecommendation(userInput);

      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('blog');
      expect(recommendation.features).toContain('database');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.features).toContain('ui');
      expect(recommendation.confidence).toBeGreaterThan(0.5);

      // Step 3: Unified Questioner presents recommendation
      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);

      expect(questionResult).toBe(true);

      // Step 4: Config Builder creates final configuration
      const finalConfig = configBuilder.buildConfig(recommendation, {});

      expect(finalConfig).toBeDefined();
      expect(finalConfig.projectType).toBe('blog');
      expect(finalConfig.plugins).toBeDefined();
      expect(finalConfig.plugins.length).toBeGreaterThan(0);

      // Step 5: Test agent capabilities (without full execution)
      const availablePlugins = await orchestratorAgent.getAvailablePlugins();
      expect(availablePlugins.length).toBeGreaterThan(0);

      const recommendations = await orchestratorAgent.getRecommendations({
        type: 'blog',
        complexity: 'medium',
        features: ['database', 'authentication', 'ui'],
        requirements: [],
        description: userInput,
        userExpertise: 'intermediate'
      });
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should complete the core recommendation flow for e-commerce projects', async () => {
      // Step 1: User provides input
      const userInput = 'I need an online store to sell products with payment processing';

      // Step 2: Smart Recommender analyzes input
      const recommendation = await smartRecommender.getRecommendation(userInput);

      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('ecommerce');
      expect(recommendation.features).toContain('payments');
      expect(recommendation.features).toContain('database');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.complexity).toBe('complex');
      expect(recommendation.confidence).toBeGreaterThan(0.5);

      // Step 3: Unified Questioner presents recommendation
      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);

      expect(questionResult).toBe(true);

      // Step 4: Config Builder creates final configuration
      const finalConfig = configBuilder.buildConfig(recommendation, {});

      expect(finalConfig).toBeDefined();
      expect(finalConfig.projectType).toBe('ecommerce');
      expect(finalConfig.plugins).toBeDefined();
      expect(finalConfig.plugins.length).toBeGreaterThan(0);
    });

    it('should complete the core recommendation flow for SaaS projects', async () => {
      // Step 1: User provides input
      const userInput = 'Building a SaaS platform with user authentication and subscription billing';

      // Step 2: Smart Recommender analyzes input
      const recommendation = await smartRecommender.getRecommendation(userInput);

      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('saas');
      expect(recommendation.features).toContain('payments');
      expect(recommendation.features).toContain('database');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.complexity).toBe('complex');
      expect(recommendation.confidence).toBeGreaterThan(0.5);

      // Step 3: Unified Questioner presents recommendation
      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);

      expect(questionResult).toBe(true);

      // Step 4: Config Builder creates final configuration
      const finalConfig = configBuilder.buildConfig(recommendation, {});

      expect(finalConfig).toBeDefined();
      expect(finalConfig.projectType).toBe('saas');
      expect(finalConfig.plugins).toBeDefined();
      expect(finalConfig.plugins.length).toBeGreaterThan(0);
    });
  });

  describe('User Interaction Flow', () => {
    it('should handle user rejection and allow customization', async () => {
      // Step 1: User provides input
      const userInput = 'I want to create a simple portfolio website';

      // Step 2: Smart Recommender analyzes input
      const recommendation = await smartRecommender.getRecommendation(userInput);

      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('fullstack'); // SmartRecommender detects this as fullstack

      // Step 3: Mock user rejection
      const { default: inquirer } = await import('inquirer');
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({
        accepted: false
      });

      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);

      expect(questionResult).toBe(false);

      // Step 4: Test that the recommendation has tech stack
      expect(recommendation.techStack).toBeDefined();
      expect(Object.keys(recommendation.techStack).length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Flow', () => {
    it('should handle errors gracefully and provide recovery options', async () => {
      // Test error handling in SmartRecommender
      const recommendation = await smartRecommender.getRecommendation('');

      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('custom');
      expect(recommendation.confidence).toBeLessThan(0.8);
    });
  });

  describe('Performance Tests', () => {
    it('should complete recommendation generation within reasonable time', async () => {
      const startTime = Date.now();

      const userInput = 'I want to create a blog with beautiful design and user authentication';
      const recommendation = await smartRecommender.getRecommendation(userInput);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(recommendation).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Complex Project Generation', () => {
    it('should handle complex multi-feature projects', async () => {
      const userInput = 'Building a complex SaaS platform with user authentication, subscription billing, email notifications, analytics dashboard, and mobile app';

      const recommendation = await smartRecommender.getRecommendation(userInput);

      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('saas');
      expect(recommendation.complexity).toBe('complex');
      expect(recommendation.features.length).toBeGreaterThan(3);
      expect(recommendation.features).toContain('payments');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.features).toContain('email');
      expect(recommendation.confidence).toBeGreaterThan(0.5);

      const finalConfig = configBuilder.buildConfig(recommendation, {});

      expect(finalConfig).toBeDefined();
      expect(finalConfig.plugins.length).toBeGreaterThan(3);
    });
  });
}); 