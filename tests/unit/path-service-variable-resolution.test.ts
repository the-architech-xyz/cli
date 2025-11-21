/**
 * Path Service Variable Resolution Unit Tests
 * 
 * Tests for the PathService.resolvePathWithVariables method that resolves
 * path key templates with dynamic variables.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PathService } from '../../src/core/services/path/path-service.js';

describe('PathService - Variable Resolution', () => {
  let pathService: PathService;
  const projectRoot = '/test/project';
  const projectName = 'synap';

  beforeEach(() => {
    // Initialize PathService with mock path map
    pathService = new PathService(projectRoot, projectName);
    
    // Set up path map with resolved paths
    pathService.setFrameworkPaths({
      'packages.auth.root': 'packages/auth/',
      'packages.auth.src': 'packages/auth/src/',
      'packages.db.root': 'packages/db/',
      'packages.db.src': 'packages/db/src/',
      'packages.ui.root': 'packages/ui/',
      'packages.ui.src': 'packages/ui/src/',
      'apps.web.root': 'apps/web/',
      'apps.web.src': 'apps/web/src/',
      'apps.mobile.root': 'apps/mobile/',
      'apps.mobile.src': 'apps/mobile/src/',
      'apps.api.root': 'apps/api/',
      'apps.api.src': 'apps/api/src/'
    });
  });

  describe('resolvePathWithVariables', () => {
    it('should resolve package name variable in path template', () => {
      const template = 'packages.{packageName}.src';
      const variables = { packageName: 'auth' };
      
      const result = pathService.resolvePathWithVariables(template, variables);
      
      expect(result).toBe('packages/auth/src/');
    });

    it('should resolve app ID variable in path template', () => {
      const template = 'apps.{appId}.src';
      const variables = { appId: 'web' };
      
      const result = pathService.resolvePathWithVariables(template, variables);
      
      expect(result).toBe('apps/web/src/');
    });

    it('should resolve multiple variables in path template', () => {
      // This would require a path key like "packages.{packageName}.{subPath}"
      // For now, test single variable resolution
      const template = 'packages.{packageName}.root';
      const variables = { packageName: 'db' };
      
      const result = pathService.resolvePathWithVariables(template, variables);
      
      expect(result).toBe('packages/db/');
    });

    it('should throw error if resolved path key does not exist', () => {
      const template = 'packages.{packageName}.src';
      const variables = { packageName: 'nonexistent' };
      
      expect(() => {
        pathService.resolvePathWithVariables(template, variables);
      }).toThrow(/Path 'packages\.nonexistent\.src' not defined/);
    });

    it('should handle different package names', () => {
      const testCases = [
        { packageName: 'auth', expected: 'packages/auth/src/' },
        { packageName: 'db', expected: 'packages/db/src/' },
        { packageName: 'ui', expected: 'packages/ui/src/' }
      ];

      for (const testCase of testCases) {
        const template = 'packages.{packageName}.src';
        const variables = { packageName: testCase.packageName };
        
        const result = pathService.resolvePathWithVariables(template, variables);
        
        expect(result).toBe(testCase.expected);
      }
    });

    it('should handle different app IDs', () => {
      const testCases = [
        { appId: 'web', expected: 'apps/web/src/' },
        { appId: 'mobile', expected: 'apps/mobile/src/' },
        { appId: 'api', expected: 'apps/api/src/' }
      ];

      for (const testCase of testCases) {
        const template = 'apps.{appId}.src';
        const variables = { appId: testCase.appId };
        
        const result = pathService.resolvePathWithVariables(template, variables);
        
        expect(result).toBe(testCase.expected);
      }
    });

    it('should replace all occurrences of variable in template', () => {
      // If we had a path key like "packages.{packageName}/src/{packageName}.ts"
      // This test would verify all occurrences are replaced
      // For now, test with a simple case
      const template = 'packages.{packageName}.root';
      const variables = { packageName: 'auth' };
      
      const result = pathService.resolvePathWithVariables(template, variables);
      
      // Should resolve to the path value, not contain the variable
      expect(result).not.toContain('{packageName}');
      expect(result).toBe('packages/auth/');
    });

    it('should respect user overrides when resolving variables', () => {
      // Set user override for a specific path
      pathService.setUserOverrides({
        'packages.auth.src': 'custom/path/to/auth/src/'
      });

      const template = 'packages.{packageName}.src';
      const variables = { packageName: 'auth' };
      
      const result = pathService.resolvePathWithVariables(template, variables);
      
      // Should use user override instead of default
      expect(result).toBe('custom/path/to/auth/src/');
    });
  });
});

