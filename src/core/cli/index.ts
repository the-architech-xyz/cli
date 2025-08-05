/**
 * CLI Utilities - Core Module
 * 
 * Consolidated CLI utilities that includes:
 * - Command execution
 * - Logging
 * - Banner display
 */

export { CommandRunner } from './command-runner.js';
export { EnhancedLogger as Logger } from './logger.js';
export { 
  displayBanner, 
  displaySuccess, 
  displayError, 
  displayWarning, 
  displayInfo 
} from './banner.js';

// Re-export types for convenience
export type {
  PackageManager,
  CommandRunnerOptions,
  CommandResult
} from './command-runner.js'; 