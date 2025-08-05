/**
 * Smart Questions Types
 * 
 * Types for the simplified, intelligent question system.
 * Replaces the complex dual system with a unified approach.
 */

// ============================================================================
// CORE RECOMMENDATION TYPES
// ============================================================================

export interface ProjectRecommendation {
  projectType: string;
  features: string[];
  techStack: TechStackRecommendation;
  estimatedTime: string;
  questionsRemaining: number;
  confidence: number;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface TechStackRecommendation {
  database: TechRecommendation;
  auth: TechRecommendation;
  ui: TechRecommendation;
  deployment?: TechRecommendation;
  testing?: TechRecommendation;
  email?: TechRecommendation;
  payment?: TechRecommendation;
  monitoring?: TechRecommendation;
}

export interface TechRecommendation {
  name: string;
  reason: string;
  confidence: number;
  alternatives?: string[];
  features?: string[];
}

// ============================================================================
// PROJECT CONTEXT
// ============================================================================

export interface ProjectContext {
  type: ProjectType;
  complexity: 'simple' | 'medium' | 'complex';
  features: string[];
  requirements: string[];
  description: string;
  userExpertise: 'beginner' | 'intermediate' | 'expert';
}

export type ProjectType = 
  | 'blog' 
  | 'ecommerce' 
  | 'dashboard' 
  | 'api' 
  | 'fullstack' 
  | 'saas' 
  | 'portfolio' 
  | 'landing-page' 
  | 'custom';

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ProjectConfig {
  projectName: string;
  projectType: string;
  features: string[];
  techStack: Record<string, any>;
  customizations: Record<string, any>;
  plugins: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
}

export interface CustomizationQuestion {
  id: string;
  type: 'confirm' | 'select' | 'checkbox' | 'input';
  message: string;
  description?: string;
  default?: any;
  choices?: Array<{ name: string; value: any; description?: string }>;
  when?: (answers: Record<string, any>) => boolean;
  category: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface KeywordAnalysis {
  projectType: ProjectType;
  confidence: number;
  keywords: string[];
  features: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

export interface FeatureMapping {
  [key: string]: {
    required: boolean;
    recommended: boolean;
    alternatives: string[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROJECT_TYPE_KEYWORDS: Record<ProjectType, string[]> = {
  blog: ['blog', 'content', 'articles', 'writing', 'publishing', 'seo', 'marketing', 'newsletter', 'posts'],
  ecommerce: ['store', 'shop', 'sell', 'products', 'payments', 'cart', 'commerce', 'retail', 'buy', 'purchase', 'checkout', 'inventory', 'e-commerce', 'ecommerce', 'online store', 'digital store'],
  dashboard: ['dashboard', 'admin', 'analytics', 'metrics', 'reports', 'data', 'management', 'control-panel'],
  api: ['api', 'backend', 'server', 'rest', 'graphql', 'endpoints', 'services'],
  fullstack: ['fullstack', 'full-stack', 'complete', 'application', 'app', 'website'],
  saas: ['saas', 'subscription', 'business', 'service', 'platform', 'software', 'tool'],
  portfolio: ['portfolio', 'personal', 'showcase', 'resume', 'cv', 'work', 'projects'],
  'landing-page': ['landing', 'page', 'marketing', 'conversion', 'lead', 'sales'],
  custom: ['custom', 'special', 'unique', 'specific']
};

export const FEATURE_KEYWORDS: Record<string, string[]> = {
  authentication: ['auth', 'login', 'signup', 'users', 'accounts', 'authentication', 'authorization', 'security'],
  payments: ['payment', 'pay', 'money', 'billing', 'stripe', 'paypal', 'credit card', 'subscription', 'monetize', 'checkout', 'purchase', 'buy'],
  database: ['database', 'data', 'storage', 'persistent', 'users', 'accounts', 'profiles'],
  email: ['email', 'mail', 'newsletter', 'notifications', 'smtp', 'sendgrid', 'resend'],
  monitoring: ['analytics', 'tracking', 'monitoring', 'performance', 'errors', 'logs', 'metrics'],
  testing: ['test', 'testing', 'unit', 'integration', 'e2e', 'coverage', 'jest', 'vitest'],
  deployment: ['deploy', 'hosting', 'server', 'cloud', 'vercel', 'netlify', 'railway'],
  ui: ['ui', 'design', 'interface', 'components', 'modern', 'beautiful', 'responsive']
};

// ============================================================================
// AGENT-DRIVEN RECOMMENDATIONS
// ============================================================================

// Note: Tech stack recommendations are now generated dynamically by agents
// based on the current plugin registry and project context.
// This eliminates hardcoded knowledge and makes the system truly dynamic. 