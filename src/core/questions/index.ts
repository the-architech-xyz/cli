/**
 * Questions System - Main Export
 * 
 * Exports the new smart question system components.
 */

// ============================================================================
// NEW SMART SYSTEM EXPORTS
// ============================================================================

export { SmartRecommender } from './smart-recommender.js';
export { UnifiedQuestioner } from './unified-questioner.js';
export { ConfigBuilder } from './config-builder.js';
export { DynamicQuestioner } from './dynamic-questioner.js';

// ============================================================================
// TYPES
// ============================================================================

export type {
  ProjectRecommendation,
  TechStackRecommendation,
  TechRecommendation,
  ProjectContext,
  ProjectType,
  ProjectConfig,
  CustomizationQuestion,
  ValidationResult,
  ValidationError,
  KeywordAnalysis,
  FeatureMapping
} from '../../types/smart-questions.js';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  PROJECT_TYPE_KEYWORDS,
  FEATURE_KEYWORDS
} from '../../types/smart-questions.js'; 