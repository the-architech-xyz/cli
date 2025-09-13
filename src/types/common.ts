/**
 * Common Types - Shared Type Definitions
 * 
 * Defines common types used across the CLI application.
 */

import { SourceFile } from 'ts-morph';

/**
 * Generic object type for flexible data structures
 */
export type GenericObject = Record<string, unknown>;

/**
 * Deep merge function parameter types
 */
export interface DeepMergeTarget {
  [key: string]: unknown;
}

export interface DeepMergeSource {
  [key: string]: unknown;
}

/**
 * TypeScript file modification function
 */
export type TsFileModifier = (sourceFile: SourceFile) => void;

/**
 * Import structure for TypeScript imports
 */
export interface ImportStructure {
  moduleSpecifier: string;
  namedImports?: string[];
  defaultImport?: string;
  namespaceImport?: string;
}

/**
 * Template context for processing
 */
export interface TemplateContext {
  [key: string]: unknown;
}

/**
 * File modification result
 */
export interface FileModificationResult {
  success: boolean;
  filePath: string;
  error?: string;
}

/**
 * Command execution result
 */
export interface CommandExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  command: string;
}

/**
 * Package information
 */
export interface PackageInfo {
  name: string;
  version: string;
  isDev?: boolean;
}

/**
 * Environment variable definition
 */
export interface EnvVarDefinition {
  key: string;
  value: string;
  description?: string;
}

/**
 * Script definition
 */
export interface ScriptDefinition {
  name: string;
  command: string;
}

/**
 * Configuration merge strategy
 */
export type MergeStrategy = 'deep-merge' | 'shallow-merge' | 'replace';

/**
 * File operation type
 */
export type FileOperation = 'create' | 'read' | 'update' | 'delete' | 'append' | 'prepend';

/**
 * Action execution context
 */
export interface ActionExecutionContext {
  actionType: string;
  moduleId: string;
  agentCategory?: string;
  filePath?: string;
  timestamp: Date;
}
