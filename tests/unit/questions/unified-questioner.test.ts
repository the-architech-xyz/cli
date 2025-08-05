/**
 * UnifiedQuestioner Unit Tests
 *
 * Tests the component that presents recommendations and gathers customization input.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedQuestioner } from '../../../src/core/questions/unified-questioner.js';
import { ProjectRecommendation, TechStackRecommendation } from '../../../src/types/smart-questions.js';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}));

// Mock SimplifiedQuestioner
const mockSimplifiedQuestioner = {
  presentRecommendationWithDefaults: vi.fn().mockResolvedValue(true),
  askMinimalQuestions: vi.fn().mockResolvedValue({
    'shadcn-ui.theme': 'system',
    'drizzle.provider': 'sqlite'
  })
};

vi.mock('../../../src/core/questions/simplified-questioner.js', () => ({
  SimplifiedQuestioner: vi.fn().mockImplementation(() => mockSimplifiedQuestioner)
}));

describe('UnifiedQuestioner', () => {
  let questioner: UnifiedQuestioner;

  beforeEach(() => {
    questioner = new UnifiedQuestioner();
    vi.clearAllMocks();
  });

  describe('presentRecommendation', () => {
    it('should present recommendation clearly', async () => {
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

      const accepted = await questioner.presentRecommendation(recommendation);

      expect(accepted).toBe(true);
    });

    it('should handle user rejection', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      // Mock SimplifiedQuestioner to return false
      mockSimplifiedQuestioner.presentRecommendationWithDefaults.mockResolvedValueOnce(false);

      const accepted = await questioner.presentRecommendation(recommendation);

      expect(accepted).toBe(false);
    });

    it('should display all tech stack components', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      await questioner.presentRecommendation(recommendation);

      // Verify that SimplifiedQuestioner was called
      expect(mockSimplifiedQuestioner.presentRecommendationWithDefaults).toHaveBeenCalledWith(recommendation);
    });
  });

  describe('askCustomizationQuestions', () => {
    it('should generate plugin-specific questions', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      const customizations = await questioner.askCustomizationQuestions(recommendation);

      expect(customizations).toBeDefined();
      expect(customizations['shadcn-ui.theme']).toBe('system');
      expect(customizations['drizzle.provider']).toBe('sqlite');
    });

    it('should handle empty tech stack', async () => {
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

      const customizations = await questioner.askCustomizationQuestions(recommendation);

      expect(customizations).toBeDefined();
    });

    it('should handle validation errors', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      // Mock SimplifiedQuestioner to throw error
      mockSimplifiedQuestioner.askMinimalQuestions.mockRejectedValueOnce(
        new Error('Validation failed')
      );

      await expect(questioner.askCustomizationQuestions(recommendation)).rejects.toThrow('Validation failed');
    });

    it('should merge plugin and legacy questions', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      const customizations = await questioner.askCustomizationQuestions(recommendation);

      expect(customizations).toBeDefined();
      expect(customizations['shadcn-ui.theme']).toBe('system');
      expect(customizations['drizzle.provider']).toBe('sqlite');
    });
  });

  describe('handleCustomizationRejection', () => {
    it('should handle user rejection gracefully', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      // Mock inquirer to return user choices
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        database: 'prisma',
        auth: 'clerk',
        ui: 'mui'
      });

      const result = await questioner.handleCustomizationRejection(recommendation);

      expect(result).toBeDefined();
      expect(result.techStack.database.name).toBe('prisma');
      expect(result.techStack.auth.name).toBe('clerk');
      expect(result.techStack.ui.name).toBe('mui');
    });
  });

  describe('Error Handling', () => {
    it('should handle inquirer errors', async () => {
      const recommendation: ProjectRecommendation = {
        projectType: 'blog',
        features: ['database', 'authentication', 'ui'],
        techStack: {
          database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
          auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
          ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
        },
        estimatedTime: '3 minutes',
        questionsRemaining: 2,
        confidence: 0.85,
        description: 'A modern blog with content management',
        complexity: 'medium'
      };

      // Mock inquirer to throw error
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockRejectedValueOnce(
        new Error('User input failed')
      );

      await expect(questioner.handleCustomizationRejection(recommendation)).rejects.toThrow('User input failed');
    });
  });
}); 