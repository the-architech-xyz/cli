/**
 * Keyword Analyzer
 * 
 * Simple but effective keyword-based template recommendation system.
 * Analyzes user input to suggest the most appropriate workflow template.
 */

import { WorkflowTemplate, WorkflowTemplateService } from './workflow-templates.js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TemplateSuggestion {
  template: WorkflowTemplate;
  confidence: number;
  reason: string;
  keywords: string[];
}

// ============================================================================
// KEYWORD PATTERNS
// ============================================================================

interface KeywordPattern {
  keywords: string[];
  weight: number;
  templateIds: string[];
}

const KEYWORD_PATTERNS: KeywordPattern[] = [
  // Quick Start patterns
  {
    keywords: ['quick', 'start', 'simple', 'basic', 'prototype', 'learn', 'tutorial', 'demo'],
    weight: 1.0,
    templateIds: ['quick-start']
  },
  
  // Blog patterns
  {
    keywords: ['blog', 'content', 'articles', 'writing', 'publishing', 'seo', 'marketing', 'newsletter', 'posts'],
    weight: 1.2,
    templateIds: ['blog-platform']
  },
  
  // E-commerce patterns
  {
    keywords: ['store', 'shop', 'sell', 'products', 'payments', 'cart', 'commerce', 'retail', 'buy', 'purchase', 'checkout', 'inventory'],
    weight: 1.5,
    templateIds: ['ecommerce']
  },
  
  // SaaS patterns
  {
    keywords: ['saas', 'app', 'platform', 'dashboard', 'users', 'subscription', 'business', 'service', 'software', 'tool', 'application'],
    weight: 1.3,
    templateIds: ['saas']
  },
  
  // Enterprise patterns
  {
    keywords: ['enterprise', 'business', 'team', 'scalable', 'professional', 'corporate', 'organization', 'company', 'large', 'complex'],
    weight: 1.4,
    templateIds: ['enterprise']
  },
  
  // Database patterns
  {
    keywords: ['database', 'data', 'storage', 'persistent', 'users', 'accounts', 'profiles'],
    weight: 0.8,
    templateIds: ['blog-platform', 'ecommerce', 'saas', 'enterprise']
  },
  
  // Authentication patterns
  {
    keywords: ['auth', 'login', 'signup', 'users', 'accounts', 'authentication', 'authorization', 'security'],
    weight: 0.9,
    templateIds: ['blog-platform', 'ecommerce', 'saas', 'enterprise']
  },
  
  // UI patterns
  {
    keywords: ['ui', 'design', 'interface', 'components', 'modern', 'beautiful', 'responsive'],
    weight: 0.5,
    templateIds: ['quick-start', 'blog-platform', 'ecommerce', 'saas', 'enterprise']
  },
  
  // Payment patterns
  {
    keywords: ['payment', 'pay', 'money', 'billing', 'stripe', 'paypal', 'credit card', 'subscription', 'monetize'],
    weight: 1.1,
    templateIds: ['ecommerce', 'saas']
  },
  
  // Monitoring patterns
  {
    keywords: ['analytics', 'tracking', 'monitoring', 'performance', 'errors', 'logs', 'metrics'],
    weight: 0.7,
    templateIds: ['blog-platform', 'ecommerce', 'saas', 'enterprise']
  },
  
  // Testing patterns
  {
    keywords: ['test', 'testing', 'quality', 'reliable', 'stable', 'robust'],
    weight: 0.6,
    templateIds: ['blog-platform', 'ecommerce', 'saas', 'enterprise']
  },
  
  // Deployment patterns
  {
    keywords: ['deploy', 'hosting', 'server', 'production', 'live', 'online', 'website'],
    weight: 0.8,
    templateIds: ['blog-platform', 'ecommerce', 'saas', 'enterprise']
  }
];

// ============================================================================
// KEYWORD ANALYZER
// ============================================================================

export class KeywordAnalyzer {
  
  /**
   * Analyze user input and suggest templates
   */
  static analyzeInput(userInput: string): TemplateSuggestion[] {
    if (!userInput || userInput.trim().length === 0) {
      return this.getDefaultSuggestions();
    }

    const input = userInput.toLowerCase();
    const words = input.split(/\s+/);
    const templateScores = new Map<string, number>();
    const matchedKeywords = new Map<string, string[]>();

    // Score each template based on keyword matches
    for (const pattern of KEYWORD_PATTERNS) {
      const matchedWords = pattern.keywords.filter(keyword => 
        words.some(word => word.includes(keyword) || keyword.includes(word))
      );

      if (matchedWords.length > 0) {
        const score = matchedWords.length * pattern.weight;
        
        for (const templateId of pattern.templateIds) {
          const currentScore = templateScores.get(templateId) || 0;
          templateScores.set(templateId, currentScore + score);
          
          const currentKeywords = matchedKeywords.get(templateId) || [];
          matchedKeywords.set(templateId, [...currentKeywords, ...matchedWords]);
        }
      }
    }

    // Convert scores to suggestions
    const suggestions: TemplateSuggestion[] = [];
    
    for (const [templateId, score] of templateScores) {
      const template = WorkflowTemplateService.getTemplate(templateId);
      if (template) {
        const confidence = this.calculateConfidence(score, words.length);
        const keywords = matchedKeywords.get(templateId) || [];
        
        suggestions.push({
          template,
          confidence,
          reason: this.generateReason(keywords, template),
          keywords: [...new Set(keywords)] // Remove duplicates
        });
      }
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Get default suggestions when no input is provided
   */
  static getDefaultSuggestions(): TemplateSuggestion[] {
    const templates = WorkflowTemplateService.getTemplates();
    
    return templates
      .filter(template => template.id !== 'custom')
      .slice(0, 3)
      .map(template => ({
        template,
        confidence: 0.3,
        reason: 'Popular choice for getting started',
        keywords: []
      }));
  }

  /**
   * Calculate confidence score based on keyword matches
   */
  private static calculateConfidence(score: number, totalWords: number): number {
    // Normalize score based on input length
    const normalizedScore = score / Math.max(totalWords, 1);
    
    // Convert to confidence percentage (0-1)
    let confidence = Math.min(normalizedScore / 2, 1.0);
    
    // Boost confidence for strong matches
    if (score >= 3) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }
    
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate human-readable reason for suggestion
   */
  private static generateReason(keywords: string[], template: WorkflowTemplate): string {
    if (keywords.length === 0) {
      return `Great for ${template.targetAudience.join(', ')}`;
    }

    const uniqueKeywords = [...new Set(keywords)].slice(0, 3);
    const keywordList = uniqueKeywords.join(', ');
    
    return `Based on keywords: ${keywordList}`;
  }

  /**
   * Get template suggestions by complexity level
   */
  static getSuggestionsByComplexity(complexity: 'beginner' | 'intermediate' | 'expert'): TemplateSuggestion[] {
    const templates = WorkflowTemplateService.getTemplatesByComplexity(complexity);
    
    return templates.map(template => ({
      template,
      confidence: 0.8,
      reason: `Perfect for ${complexity} level projects`,
      keywords: []
    }));
  }

  /**
   * Get template suggestions by target audience
   */
  static getSuggestionsByAudience(audience: string): TemplateSuggestion[] {
    const templates = WorkflowTemplateService.getTemplatesByAudience(audience);
    
    return templates.map(template => ({
      template,
      confidence: 0.8,
      reason: `Designed for ${audience}`,
      keywords: []
    }));
  }

  /**
   * Extract key themes from user input
   */
  static extractThemes(userInput: string): string[] {
    if (!userInput || userInput.trim().length === 0) {
      return [];
    }

    const input = userInput.toLowerCase();
    const themes: string[] = [];

    // Check for common themes
    if (input.includes('blog') || input.includes('content') || input.includes('articles')) {
      themes.push('content-creation');
    }
    
    if (input.includes('store') || input.includes('shop') || input.includes('sell')) {
      themes.push('e-commerce');
    }
    
    if (input.includes('saas') || input.includes('platform') || input.includes('subscription')) {
      themes.push('software-as-service');
    }
    
    if (input.includes('enterprise') || input.includes('business') || input.includes('corporate')) {
      themes.push('enterprise');
    }
    
    if (input.includes('quick') || input.includes('simple') || input.includes('basic')) {
      themes.push('quick-start');
    }

    return themes;
  }

  /**
   * Check if user input suggests custom setup
   */
  static suggestsCustomSetup(userInput: string): boolean {
    if (!userInput || userInput.trim().length === 0) {
      return false;
    }

    const input = userInput.toLowerCase();
    const customKeywords = [
      'custom', 'advanced', 'expert', 'full control', 'specific', 'unique',
      'complex', 'special', 'particular', 'detailed', 'comprehensive'
    ];

    return customKeywords.some(keyword => input.includes(keyword));
  }
} 