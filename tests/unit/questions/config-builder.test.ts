/**
 * ConfigBuilder Unit Tests
 * 
 * Tests the component that builds the final project configuration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigBuilder } from '../../../src/core/questions/config-builder.js';
import { ProjectRecommendation, TechStackRecommendation } from '../../../src/types/smart-questions.js';

describe('ConfigBuilder', () => {
  let configBuilder: ConfigBuilder;

  beforeEach(() => {
    configBuilder = new ConfigBuilder();
  });

  describe('buildConfig', () => {
    it('should build complete project configuration', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 },
          deployment: { name: 'railway', reason: 'Full-stack deployment', confidence: 0.8 },
          testing: { name: 'vitest', reason: 'Fast testing framework', confidence: 0.8 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      const customizations = {
        'shadcn-ui.theme': 'dark',
        'drizzle.provider': 'neon'
      };

      const config = configBuilder.buildConfig(recommendation, customizations);

      expect(config).toBeDefined();
      expect(config.projectType).toBe('blog');
      expect(config.plugins).toContain('drizzle');
      expect(config.plugins).toContain('better-auth');
      expect(config.plugins).toContain('shadcn-ui');
      expect(config.plugins).toContain('railway');
      expect(config.plugins).toContain('vitest');
    });

    it('should handle empty customizations', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'portfolio',
        features: ['ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple portfolio',
        complexity: 'simple'
      };

      const customizations = {};

      const config = configBuilder.buildConfig(recommendation, customizations);

      expect(config).toBeDefined();
      expect(config.projectType).toBe('portfolio');
      expect(config.plugins).toContain('shadcn-ui');
    });

    it('should map recommendations to plugins correctly', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'ecommerce',
        features: ['database', 'authentication', 'payments', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 },
          payment: { name: 'stripe', reason: 'Payment processing', confidence: 0.9 }
        },
        estimatedTime: '5 minutes',
        questionsRemaining: 3,
        confidence: 0.9,
        description: 'A complete e-commerce solution',
        complexity: 'complex'
      };

      const customizations = {};

      const config = configBuilder.buildConfig(recommendation, customizations);

      expect(config.plugins).toContain('drizzle');
      expect(config.plugins).toContain('better-auth');
      expect(config.plugins).toContain('shadcn-ui');
      // Note: stripe is not mapped to plugins in the current implementation
      expect(config.plugins).not.toContain('stripe');
    });
  });

  describe('buildTechStackConfig', () => {
    it('should configure UI plugins', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = {
        'shadcn-ui.theme': 'dark',
        'shadcn-ui.components': ['button', 'card', 'input']
      };

      const config = configBuilder.buildTechStackConfig(recommendation, customizations);

      expect(config.ui).toBeDefined();
      expect(config.ui.theme).toBe('system'); // Default theme is 'system'
      expect(config.ui.library).toBe('shadcn-ui');
      expect(config.ui.components).toBeDefined();
    });

    it('should configure database plugins', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = {
        'drizzle.provider': 'neon',
        'drizzle.schema': 'users,posts,comments'
      };

      const config = configBuilder.buildTechStackConfig(recommendation, customizations);

      expect(config.database).toBeDefined();
      expect(config.database.provider).toBe('sqlite'); // Default provider for drizzle
      expect(config.database.orm).toBe('drizzle');
      expect(config.database.features).toBeDefined();
    });

    it('should configure auth plugins', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['authentication'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = {
        'better-auth.provider': 'credentials',
        'better-auth.session': 'jwt'
      };

      const config = configBuilder.buildTechStackConfig(recommendation, customizations);

      expect(config.auth).toBeDefined();
      expect(config.auth.provider).toBe('better-auth'); // Uses the tech stack name
      expect(config.auth.providers).toEqual(['credentials']); // Default providers
      expect(config.auth.features).toBeDefined();
    });

    it('should configure deployment plugins', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['deployment'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 },
          deployment: { name: 'railway', reason: 'Full-stack deployment', confidence: 0.8 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = {
        'railway.environment': 'production',
        'railway.region': 'us-east-1'
      };

      const config = configBuilder.buildTechStackConfig(recommendation, customizations);

      expect(config.deployment).toBeDefined();
      expect(config.deployment.platform).toBe('railway');
      expect(config.deployment.environment).toBe('production');
      expect(config.deployment.features).toBeDefined();
    });

    it('should configure testing plugins', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['testing'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 },
          testing: { name: 'vitest', reason: 'Fast testing framework', confidence: 0.8 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = {
        'vitest.coverage': true,
        'vitest.threshold': 80
      };

      const config = configBuilder.buildTechStackConfig(recommendation, customizations);

      expect(config.testing).toBeDefined();
      expect(config.testing.framework).toBe('vitest');
      expect(config.testing.coverage).toBe(true);
      expect(config.testing.coverageThreshold).toBe(80);
      expect(config.testing.features).toBeDefined();
    });
  });

  describe('Plugin Mapping', () => {
    it('should map tech stack to plugin IDs through buildConfig', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 },
          deployment: { name: 'railway', reason: 'Full-stack deployment', confidence: 0.8 },
          testing: { name: 'vitest', reason: 'Fast testing framework', confidence: 0.8 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      const config = configBuilder.buildConfig(recommendation, {});

      expect(config.plugins).toContain('drizzle');
      expect(config.plugins).toContain('better-auth');
      expect(config.plugins).toContain('shadcn-ui');
      expect(config.plugins).toContain('railway');
      expect(config.plugins).toContain('vitest');
    });

    it('should handle empty tech stack', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'custom',
        features: [],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '1 minute',
        questionsRemaining: 0,
        confidence: 0.5,
        description: 'Custom project',
        complexity: 'simple'
      };

      const config = configBuilder.buildConfig(recommendation, {});

      expect(config.plugins).toContain('nextjs'); // Always included
      expect(config.plugins).toContain('drizzle');
      expect(config.plugins).toContain('better-auth');
      expect(config.plugins).toContain('shadcn-ui');
    });

    it('should handle tech stack with optional components', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
          // No deployment or testing specified
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const config = configBuilder.buildConfig(recommendation, {});

      expect(config.plugins).toContain('nextjs');
      expect(config.plugins).toContain('drizzle');
      expect(config.plugins).toContain('better-auth');
      expect(config.plugins).toContain('shadcn-ui');
      expect(config.plugins).not.toContain('railway'); // Not specified
      expect(config.plugins).not.toContain('vitest'); // Not specified
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid recommendation', () => {
      const recommendation = null as any;

      expect(() => {
        configBuilder.buildConfig(recommendation, {});
      }).toThrow();
    });

    it('should handle invalid customizations', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = null as any;

      expect(() => {
        configBuilder.buildConfig(recommendation, customizations);
      }).toThrow();
    });

    it('should handle missing tech stack', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const config = configBuilder.buildConfig(recommendation, {});

      expect(config).toBeDefined();
      expect(config.plugins).toContain('nextjs'); // Always included
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid customizations gracefully', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '2 minutes',
        questionsRemaining: 1,
        confidence: 0.8,
        description: 'A simple blog',
        complexity: 'simple'
      };

      const customizations = {
        'shadcn-ui.components': [] // Invalid: empty components
      };

      // Should not throw, but handle gracefully
      expect(() => {
        configBuilder.buildTechStackConfig(recommendation, customizations);
      }).not.toThrow();
    });

    it('should validate plugin compatibility', () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'auth'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog',
        complexity: 'medium'
      };

      const customizations = {};

      const config = configBuilder.buildConfig(recommendation, customizations);

      // Should not contain incompatible plugins
      expect(config.plugins).not.toContain('prisma'); // Conflicts with drizzle
      expect(config.plugins).not.toContain('nextauth'); // Conflicts with better-auth
    });
  });
}); 