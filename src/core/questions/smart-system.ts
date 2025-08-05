/**
 * Smart System Exports
 * 
 * Central export point for the new smart question system.
 * Isolates new system from legacy exports to prevent conflicts.
 */

// Core components
export { SmartRecommender } from './smart-recommender.js';
export { UnifiedQuestioner } from './unified-questioner.js';
export { ConfigBuilder } from './config-builder.js';
export { DynamicQuestioner } from './dynamic-questioner.js';

// Types
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
  KeywordAnalysis
} from '../../types/smart-questions.js'; 