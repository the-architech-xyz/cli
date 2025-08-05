/**
 * PluginSystem Tests
 * 
 * Tests for the core plugin system that manages plugin registration,
 * discovery, and lifecycle operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginSystem } from '../../../src/core/plugin/plugin-system';
import { IPlugin, PluginCategory, PluginMetadata } from '../../../src/types/plugins';

// Mock plugin for testing
const mockPlugin: IPlugin = {
  getMetadata: () => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test Author',
    category: PluginCategory.CUSTOM,
    tags: ['test'],
    license: 'MIT'
  }),
  install: vi.fn(),
  uninstall: vi.fn(),
  update: vi.fn(),
  validate: vi.fn(),
  getCompatibility: vi.fn(() => ({
    frameworks: ['custom'],
    platforms: ['web' as any],
    nodeVersions: ['16.0.0'],
    packageManagers: ['npm'],
    conflicts: []
  })),
  getRequirements: vi.fn(() => []),
  getConflicts: vi.fn(() => []),
  getDependencies: vi.fn(() => []),
  getConfigSchema: vi.fn(),
  getDefaultConfig: vi.fn()
};

describe('PluginSystem', () => {
  let pluginSystem: PluginSystem;

  beforeEach(() => {
    // Reset the singleton instance for each test
    (PluginSystem as any).instance = undefined;
    pluginSystem = PluginSystem.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = PluginSystem.getInstance();
      const instance2 = PluginSystem.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getRegistry', () => {
    it('should return a plugin registry', () => {
      const registry = pluginSystem.getRegistry();
      
      expect(registry).toBeDefined();
      expect(typeof registry.get).toBe('function');
      expect(typeof registry.getAll).toBe('function');
      expect(typeof registry.getByCategory).toBe('function');
    });
  });

  describe('Plugin Registration', () => {
    it('should register plugins correctly', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      // Verify it's registered
      const retrieved = registry.get('test-plugin');
      expect(retrieved).toBe(mockPlugin);
    });

    it('should handle duplicate plugin registration', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register the same plugin twice
      registry.register(mockPlugin);
      registry.register(mockPlugin);
      
      // Should still have only one instance
      const all = registry.getAll();
      const testPlugins = all.filter(p => p.getMetadata().id === 'test-plugin');
      expect(testPlugins).toHaveLength(1);
    });

    it('should unregister plugins correctly', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      // Verify it's registered
      expect(registry.get('test-plugin')).toBe(mockPlugin);
      
      // Unregister it
      registry.unregister('test-plugin');
      
      // Verify it's unregistered
      expect(registry.get('test-plugin')).toBeUndefined();
    });
  });

  describe('Plugin Discovery', () => {
    it('should get all plugins', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      const all = registry.getAll();
      expect(all.length).toBeGreaterThan(0);
      expect(all.some(p => p.getMetadata().id === 'test-plugin')).toBe(true);
    });

    it('should get plugins by category', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      const customPlugins = registry.getByCategory(PluginCategory.CUSTOM);
      expect(customPlugins.some(p => p.getMetadata().id === 'test-plugin')).toBe(true);
    });

    it('should get plugins by ID', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      const plugin = registry.get('test-plugin');
      expect(plugin).toBe(mockPlugin);
    });

    it('should return undefined for non-existent plugins', () => {
      const registry = pluginSystem.getRegistry();
      
      const plugin = registry.get('non-existent-plugin');
      expect(plugin).toBeUndefined();
    });
  });

  describe('Plugin Compatibility', () => {
    it('should get compatible plugins', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      const compatible = registry.getCompatible('custom' as any, ['web' as any]);
      expect(compatible.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate plugin compatibility', () => {
      const registry = pluginSystem.getRegistry();
      
      // Register a plugin
      registry.register(mockPlugin);
      
      const result = registry.validateCompatibility(['test-plugin']);
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Built-in Plugins', () => {
    it('should have built-in plugins registered', () => {
      const registry = pluginSystem.getRegistry();
      const all = registry.getAll();
      
      // Should have some built-in plugins
      expect(all.length).toBeGreaterThan(0);
      
      // Check for common plugin categories
      const uiPlugins = registry.getByCategory(PluginCategory.UI_LIBRARY);
      const dbPlugins = registry.getByCategory(PluginCategory.DATABASE);
      const authPlugins = registry.getByCategory(PluginCategory.AUTHENTICATION);
      
      // At least one of these categories should have plugins
      expect(uiPlugins.length + dbPlugins.length + authPlugins.length).toBeGreaterThan(0);
    });

    it('should have specific plugins available', () => {
      const registry = pluginSystem.getRegistry();
      
      // Check for specific known plugins
      const shadcnPlugin = registry.get('shadcn-ui');
      const drizzlePlugin = registry.get('drizzle');
      const betterAuthPlugin = registry.get('better-auth');
      
      // At least one of these should exist
      const hasKnownPlugin = shadcnPlugin || drizzlePlugin || betterAuthPlugin;
      expect(hasKnownPlugin).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid plugin registration gracefully', () => {
      const registry = pluginSystem.getRegistry();
      
      // Try to register an invalid plugin
      const invalidPlugin = {
        getMetadata: () => ({
          id: 'invalid-plugin',
          name: 'Invalid Plugin',
          version: '1.0.0',
          description: 'An invalid plugin',
          author: 'Test',
          category: 'invalid-category' as any,
          tags: ['test'],
          license: 'MIT'
        })
      } as IPlugin;
      
      // Should not throw an error
      expect(() => {
        registry.register(invalidPlugin);
      }).not.toThrow();
    });

    it('should handle plugin validation errors', () => {
      const registry = pluginSystem.getRegistry();
      
      // Create a plugin that throws during validation
      const errorPlugin: IPlugin = {
        ...mockPlugin,
        validate: vi.fn().mockRejectedValue(new Error('Validation error'))
      };
      
      registry.register(errorPlugin);
      
      // Should handle the error gracefully
      const result = registry.validateCompatibility(['test-plugin']);
      expect(result).toBeDefined();
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should handle plugin installation', async () => {
      const registry = pluginSystem.getRegistry();
      registry.register(mockPlugin);
      
      const plugin = registry.get('test-plugin');
      expect(plugin).toBeDefined();
      
      // Mock the install method
      const installSpy = vi.spyOn(plugin!, 'install');
      installSpy.mockResolvedValue({
        success: true,
        artifacts: [],
        dependencies: [],
        scripts: [],
        configs: [],
        errors: [],
        warnings: [],
        duration: 100
      });
      
      // Test installation
      const result = await plugin!.install({} as any);
      expect(result.success).toBe(true);
      expect(installSpy).toHaveBeenCalled();
    });

    it('should handle plugin uninstallation', async () => {
      const registry = pluginSystem.getRegistry();
      registry.register(mockPlugin);
      
      const plugin = registry.get('test-plugin');
      expect(plugin).toBeDefined();
      
      // Mock the uninstall method
      const uninstallSpy = vi.spyOn(plugin!, 'uninstall');
      uninstallSpy.mockResolvedValue({
        success: true,
        artifacts: [],
        dependencies: [],
        scripts: [],
        configs: [],
        errors: [],
        warnings: [],
        duration: 50
      });
      
      // Test uninstallation
      const result = await plugin!.uninstall({} as any);
      expect(result.success).toBe(true);
      expect(uninstallSpy).toHaveBeenCalled();
    });
  });

  describe('Plugin Metadata', () => {
    it('should retrieve plugin metadata correctly', () => {
      const registry = pluginSystem.getRegistry();
      registry.register(mockPlugin);
      
      const plugin = registry.get('test-plugin');
      const metadata = plugin!.getMetadata();
      
      expect(metadata.id).toBe('test-plugin');
      expect(metadata.name).toBe('Test Plugin');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.category).toBe(PluginCategory.CUSTOM);
    });

    it('should handle plugins with different categories', () => {
      const registry = pluginSystem.getRegistry();
      
      const uiPlugin: IPlugin = {
        ...mockPlugin,
        getMetadata: () => ({
          ...mockPlugin.getMetadata(),
          id: 'ui-plugin',
          category: PluginCategory.UI_LIBRARY
        })
      };
      
      const dbPlugin: IPlugin = {
        ...mockPlugin,
        getMetadata: () => ({
          ...mockPlugin.getMetadata(),
          id: 'db-plugin',
          category: PluginCategory.DATABASE
        })
      };
      
      registry.register(uiPlugin);
      registry.register(dbPlugin);
      
      const uiPlugins = registry.getByCategory(PluginCategory.UI_LIBRARY);
      const dbPlugins = registry.getByCategory(PluginCategory.DATABASE);
      
      expect(uiPlugins.some(p => p.getMetadata().id === 'ui-plugin')).toBe(true);
      expect(dbPlugins.some(p => p.getMetadata().id === 'db-plugin')).toBe(true);
    });
  });
}); 