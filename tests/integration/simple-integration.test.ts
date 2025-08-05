/**
 * Simple Integration Tests
 *
 * Tests core functionality without complex agent dependencies.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SmartRecommender } from '../../src/core/questions/smart-recommender.js';
import { UnifiedQuestioner } from '../../src/core/questions/unified-questioner.js';
import { ConfigBuilder } from '../../src/core/questions/config-builder.js';
import { PluginSystem } from '../../src/core/plugin/plugin-system.js';

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

describe('Simple Integration Tests', () => {
  let smartRecommender: SmartRecommender;
  let unifiedQuestioner: UnifiedQuestioner;
  let configBuilder: ConfigBuilder;
  let pluginSystem: PluginSystem;

  beforeEach(async () => {
    // Initialize components
    smartRecommender = new SmartRecommender();
    unifiedQuestioner = new UnifiedQuestioner();
    configBuilder = new ConfigBuilder();
    pluginSystem = new PluginSystem();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Smart Recommender', () => {
    it('should analyze user input and generate recommendations', async () => {
      const userInput = 'I want to create a blog with content management and beautiful design';
      
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('blog');
      expect(recommendation.features).toContain('database');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.features).toContain('ui');
      expect(recommendation.complexity).toBe('medium');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.techStack).toBeDefined();
      expect(recommendation.techStack.database).toBeDefined();
      expect(recommendation.techStack.auth).toBeDefined();
      expect(recommendation.techStack.ui).toBeDefined();
    });

    it('should handle e-commerce projects', async () => {
      const userInput = 'I need an online store to sell products with payment processing';
      
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('ecommerce');
      expect(recommendation.features).toContain('payments');
      expect(recommendation.features).toContain('database');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.complexity).toBe('complex');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
    });

    it('should handle SaaS projects', async () => {
      const userInput = 'Building a SaaS platform with user authentication and subscription billing';
      
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('saas');
      expect(recommendation.features).toContain('payments');
      expect(recommendation.features).toContain('database');
      expect(recommendation.features).toContain('authentication');
      expect(recommendation.complexity).toBe('complex');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Unified Questioner', () => {
    it('should present recommendations and get user acceptance', async () => {
      const userInput = 'I want to create a blog with content management';
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);
      
      expect(questionResult).toBe(true);
    });

    it('should handle user rejection', async () => {
      const userInput = 'I want to create a simple portfolio website';
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      // Mock user rejection
      const { default: inquirer } = await import('inquirer');
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({
        accepted: false
      });
      
      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);
      
      expect(questionResult).toBe(false);
    });
  });

  describe('Config Builder', () => {
    it('should build configuration from recommendation', async () => {
      const userInput = 'I want to create a blog with content management';
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      const config = configBuilder.buildConfig(recommendation, {});
      
      expect(config).toBeDefined();
      expect(config.projectType).toBe('blog');
      expect(config.plugins).toBeDefined();
      expect(config.plugins.length).toBeGreaterThan(0);
      expect(config.techStack).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should handle customizations', async () => {
      const userInput = 'I want to create a blog with content management';
      const recommendation = await smartRecommender.getRecommendation(userInput);
      
      const customizations = {
        framework: 'nextjs',
        ui: 'shadcn-ui',
        database: 'drizzle',
        auth: 'better-auth'
      };
      
      const config = configBuilder.buildConfig(recommendation, customizations);
      
      expect(config).toBeDefined();
      expect(config.projectType).toBe('blog');
      expect(config.plugins).toBeDefined();
      expect(config.plugins.length).toBeGreaterThan(0);
    });
  });

  describe('Plugin System', () => {
    it('should initialize and register plugins', () => {
      expect(pluginSystem).toBeDefined();
      
      const registry = pluginSystem.getRegistry();
      expect(registry).toBeDefined();
      
      const pluginCount = pluginSystem.getPluginCount();
      expect(pluginCount).toBeGreaterThan(0);
    });

    it('should provide plugin categories', () => {
      const categories = pluginSystem.getAvailableCategories();
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // Check for expected categories
      expect(categories).toContain('ui-library');
      expect(categories).toContain('database');
      expect(categories).toContain('authentication');
    });

    it('should find plugins by category', () => {
      const uiPlugins = pluginSystem.getPluginsByCategory('ui-library');
      expect(uiPlugins).toBeDefined();
      expect(Array.isArray(uiPlugins)).toBe(true);
      expect(uiPlugins.length).toBeGreaterThan(0);
      
      const dbPlugins = pluginSystem.getPluginsByCategory('database');
      expect(dbPlugins).toBeDefined();
      expect(Array.isArray(dbPlugins)).toBe(true);
      expect(dbPlugins.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete a simple blog project flow', async () => {
      // Step 1: User provides input
      const userInput = 'I want to create a blog with content management';
      
      // Step 2: Smart Recommender analyzes input
      const recommendation = await smartRecommender.getRecommendation(userInput);
      expect(recommendation).toBeDefined();
      expect(recommendation.projectType).toBe('blog');
      
      // Step 3: Unified Questioner presents recommendation
      const questionResult = await unifiedQuestioner.presentRecommendation(recommendation);
      expect(questionResult).toBe(true);
      
      // Step 4: Config Builder creates final configuration
      const config = configBuilder.buildConfig(recommendation, {});
      expect(config).toBeDefined();
      expect(config.projectType).toBe('blog');
      expect(config.plugins).toBeDefined();
      expect(config.plugins.length).toBeGreaterThan(0);
      
      // Step 5: Verify plugin system has required plugins
      const requiredPlugins = ['nextjs', 'drizzle', 'better-auth', 'shadcn-ui'];
      for (const pluginId of requiredPlugins) {
        const plugin = pluginSystem.getRegistry().get(pluginId);
        expect(plugin).toBeDefined();
      }
    });
  });
}); 