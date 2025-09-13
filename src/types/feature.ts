/**
 * Feature Types - V2 Feature System
 * 
 * Types for the modular feature system
 */

export interface FeatureSpec {
  type: 'adapter-feature' | 'cross-adapter-feature';
  adapterId?: string;
  featureId: string;
  fullSpec: string;
}

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'premium' | 'integration' | 'cross-adapter';
  version: string;
  blueprint: string;
  dependencies?: string[];
  parameters?: Record<string, any>;
  compatibility?: string[];
}

export interface InstalledFeature {
  id: string;
  spec: string;
  addedAt: string;
  type: 'adapter-feature' | 'cross-adapter-feature';
  parameters?: Record<string, any>;
}

export interface FeatureExecutionResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  errors?: string[];
  warnings?: string[];
}
