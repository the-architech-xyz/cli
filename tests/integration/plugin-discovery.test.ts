/**
 * Plugin Discovery Integration Tests
 *
 * Tests the integration between agents and plugin discovery.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UIAgent } from '../../src/agents/ui-agent.js';
import { DBAgent } from '../../src/agents/db-agent.js';
import { AuthAgent } from '../../src/agents/auth-agent.js';
import { OrchestratorAgent } from '../../src/agents/orchestrator-agent.js';
import { PluginSystem } from '../../src/core/plugin/plugin-system.js';
import { ProjectContext } from '../../src/types/smart-questions.js';

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

describe('Plugin Discovery Integration Tests', () => {
  let uiAgent: UIAgent;
  let dbAgent: DBAgent;
  let authAgent: AuthAgent;
  let orchestratorAgent: OrchestratorAgent;
  let pluginSystem: PluginSystem;

  beforeEach(async () => {
    // Initialize plugin system
    pluginSystem = new PluginSystem();

    // Initialize agents
    uiAgent = new UIAgent();
    dbAgent = new DBAgent();
    authAgent = new AuthAgent();
    orchestratorAgent = new OrchestratorAgent();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Plugin Discovery', () => {
    it('should allow UI Agent to discover UI plugins', async () => {
      const availablePlugins = await uiAgent.getAvailablePlugins();
      
      expect(availablePlugins).toBeDefined();
      expect(Array.isArray(availablePlugins)).toBe(true);
      expect(availablePlugins.length).toBeGreaterThan(0);
      
      // Check that UI plugins are found
      const uiPlugins = availablePlugins.filter(plugin => 
        plugin.getMetadata().category === 'ui-library'
      );
      expect(uiPlugins.length).toBeGreaterThan(0);
    });

    it('should allow DB Agent to discover database plugins', async () => {
      const availablePlugins = await dbAgent.getAvailablePlugins();
      
      expect(availablePlugins).toBeDefined();
      expect(Array.isArray(availablePlugins)).toBe(true);
      expect(availablePlugins.length).toBeGreaterThan(0);
      
      // Check that database plugins are found
      const dbPlugins = availablePlugins.filter(plugin => 
        plugin.getMetadata().category === 'database' || 
        plugin.getMetadata().category === 'orm'
      );
      expect(dbPlugins.length).toBeGreaterThan(0);
    });

    it('should allow Auth Agent to discover authentication plugins', async () => {
      const availablePlugins = await authAgent.getAvailablePlugins();
      
      expect(availablePlugins).toBeDefined();
      expect(Array.isArray(availablePlugins)).toBe(true);
      expect(availablePlugins.length).toBeGreaterThan(0);
      
      // Check that auth plugins are found
      const authPlugins = availablePlugins.filter(plugin => 
        plugin.getMetadata().category === 'authentication' || 
        plugin.getMetadata().category === 'authorization'
      );
      expect(authPlugins.length).toBeGreaterThan(0);
    });

    it('should allow Orchestrator Agent to discover all plugins', async () => {
      const availablePlugins = await orchestratorAgent.getAvailablePlugins();
      
      expect(availablePlugins).toBeDefined();
      expect(Array.isArray(availablePlugins)).toBe(true);
      expect(availablePlugins.length).toBeGreaterThan(0);
      
      // Check that plugins from different categories are found
      const categories = availablePlugins.map(plugin => plugin.getMetadata().category);
      expect(categories).toContain('ui-library');
      expect(categories).toContain('database');
      expect(categories).toContain('authentication');
    });
  });

  describe('Agent Recommendations', () => {
    it('should generate UI recommendations for blog projects', async () => {
      const context: ProjectContext = {
        type: 'blog',
        features: ['ui', 'database', 'authentication'],
        complexity: 'medium',
        requirements: ['beautiful design'],
        description: 'I want to create a blog with beautiful design',
        userExpertise: 'intermediate'
      };

      const recommendations = await uiAgent.getRecommendations(context);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that UI recommendations are provided
      const uiRecommendations = recommendations.filter(rec => 
        rec.name.includes('ui') || rec.name.includes('shadcn') || rec.name.includes('chakra')
      );
      expect(uiRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate database recommendations for e-commerce projects', async () => {
      const context: ProjectContext = {
        type: 'ecommerce',
        features: ['database', 'payments', 'authentication'],
        complexity: 'complex',
        requirements: ['payment processing'],
        description: 'I need an online store with payment processing',
        userExpertise: 'intermediate'
      };

      const recommendations = await dbAgent.getRecommendations(context);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that database recommendations are provided
      const dbRecommendations = recommendations.filter(rec => 
        rec.name.includes('drizzle') || rec.name.includes('prisma') || rec.name.includes('mongodb')
      );
      expect(dbRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate auth recommendations for SaaS projects', async () => {
      const context: ProjectContext = {
        type: 'saas',
        features: ['authentication', 'payments', 'database'],
        complexity: 'complex',
        requirements: ['user authentication'],
        description: 'Building a SaaS platform with user authentication',
        userExpertise: 'expert'
      };

      const recommendations = await authAgent.getRecommendations(context);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that auth recommendations are provided
      const authRecommendations = recommendations.filter(rec => 
        rec.name.includes('auth') || rec.name.includes('clerk') || rec.name.includes('nextauth')
      );
      expect(authRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Capabilities', () => {
    it('should provide plugin capabilities for UI Agent', async () => {
      const uiPlugins = await uiAgent.getAvailablePlugins();
      
      if (uiPlugins.length > 0) {
        const firstPlugin = uiPlugins[0];
        const capabilities = await uiAgent.getPluginCapabilities(firstPlugin.getMetadata().id);
        
        expect(capabilities).toBeDefined();
        expect(Array.isArray(capabilities)).toBe(true);
        expect(capabilities.length).toBeGreaterThan(0);
      }
    });

    it('should provide plugin capabilities for DB Agent', async () => {
      const dbPlugins = await dbAgent.getAvailablePlugins();
      
      if (dbPlugins.length > 0) {
        const firstPlugin = dbPlugins[0];
        const capabilities = await dbAgent.getPluginCapabilities(firstPlugin.getMetadata().id);
        
        expect(capabilities).toBeDefined();
        expect(Array.isArray(capabilities)).toBe(true);
        expect(capabilities.length).toBeGreaterThan(0);
      }
    });

    it('should provide plugin capabilities for Auth Agent', async () => {
      const authPlugins = await authAgent.getAvailablePlugins();
      
      if (authPlugins.length > 0) {
        const firstPlugin = authPlugins[0];
        const capabilities = await authAgent.getPluginCapabilities(firstPlugin.getMetadata().id);
        
        expect(capabilities).toBeDefined();
        expect(Array.isArray(capabilities)).toBe(true);
        expect(capabilities.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Domain Categories', () => {
    it('should return correct domain categories for UI Agent', () => {
      const categories = uiAgent.getDomainCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('ui-library');
    });

    it('should return correct domain categories for DB Agent', () => {
      const categories = dbAgent.getDomainCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('database');
      expect(categories).toContain('orm');
    });

    it('should return correct domain categories for Auth Agent', () => {
      const categories = authAgent.getDomainCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('authentication');
      expect(categories).toContain('authorization');
    });

    it('should return all domain categories for Orchestrator Agent', () => {
      const categories = orchestratorAgent.getDomainCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(5); // Should have many categories
    });
  });
}); 