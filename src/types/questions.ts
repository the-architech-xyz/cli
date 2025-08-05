/**
 * Question Generation Types
 * 
 * Simplified, intelligent question generation system that provides
 * contextual, progressive questions based on project type and user expertise.
 */

// ============================================================================
// CORE QUESTION TYPES
// ============================================================================

export type QuestionType = 'confirm' | 'input' | 'select' | 'multiselect' | 'path';

export interface Question {
  id: string;
  type: QuestionType;
  message: string;
  description?: string;
  default?: any;
  choices?: QuestionChoice[];
  when?: (answers: Record<string, any>) => boolean;
  validate?: (input: any) => boolean | string;
  order: number;
  category?: string;
}

export interface QuestionChoice {
  name: string;
  value: any;
  description?: string;
  recommended?: boolean;
  disabled?: boolean;
}

// ============================================================================
// PROJECT CONTEXT
// ============================================================================

export type ProjectType = 'ecommerce' | 'blog' | 'dashboard' | 'api' | 'fullstack' | 'custom';
export type UserExpertise = 'beginner' | 'intermediate' | 'expert';
export type ApproachType = 'guided' | 'selective';

export interface ProjectContext {
  type: ProjectType;
  expertise: UserExpertise;
  approach: ApproachType;
  description: string;
  features: string[];
  requirements: string[];
}

// ============================================================================
// QUESTION STRATEGIES
// ============================================================================

export interface QuestionStrategy {
  name: string;
  projectType: ProjectType;
  analyzeContext(userInput: string): ProjectContext;
  generateQuestions(context: ProjectContext): Question[];
  getRecommendations(context: ProjectContext): Recommendation[];
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export interface Recommendation {
  category: string;
  plugin: string;
  provider?: string;
  reason: string;
  confidence: number; // 0-1
  alternatives?: string[];
}

export interface RecommendationSet {
  database: Recommendation;
  auth: Recommendation;
  ui: Recommendation;
  deployment?: Recommendation;
  testing?: Recommendation;
  email?: Recommendation;
  payment?: Recommendation;
}

// ============================================================================
// PROGRESSIVE FLOW
// ============================================================================

export interface QuestionFlow {
  phase: 'discovery' | 'recommendations' | 'configuration' | 'validation';
  questions: Question[];
  currentQuestion: number;
  answers: Record<string, any>;
}

export interface FlowResult {
  success: boolean;
  configuration: Record<string, any>;
  recommendations: RecommendationSet;
  warnings: string[];
  errors: string[];
}

// ============================================================================
// PATH SELECTION
// ============================================================================

export interface PathOption {
  id: ApproachType;
  name: string;
  description: string;
  icon?: string;
  recommended?: boolean;
}

export const PATH_OPTIONS: PathOption[] = [
  {
    id: 'guided',
    name: 'Guided Setup',
    description: 'I\'ll recommend the best technologies for your project and guide you through setup',
    recommended: true
  },
  {
    id: 'selective',
    name: 'Selective Setup', 
    description: 'I\'ll let you choose each technology individually with full control'
  }
];

// ============================================================================
// VALIDATION
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
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type QuestionGenerator = (context: ProjectContext) => Question[];
export type RecommendationGenerator = (context: ProjectContext) => RecommendationSet;
export type ValidationFunction = (answers: Record<string, any>) => ValidationResult; 