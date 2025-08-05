/**
 * Abstract Base Agent Class
 * 
 * Provides a foundation for all Architech agents with common functionality:
 * - Lifecycle management
 * - Error handling
 * - Performance monitoring
 * - State management
 * - Logging
 * - Standardized execution patterns
 */

import chalk from 'chalk';
import { performance } from 'perf_hooks';
import * as crypto from 'crypto';
import {
  IAgent,
  AgentContext,
  AgentResult,
  ValidationResult,
  AgentMetadata,
  AgentCapability,
  AgentState,
  PerformanceMetrics,
  Logger,
  LogLevel,
  LogContext,
  AgentCategory,
  CapabilityCategory,
  AGENT_ERROR_CODES,
  AGENT_INTERFACE_VERSION,
  DEFAULT_TIMEOUT,
  Artifact
} from '../../types/agents.js';
import { structureService } from '../../core/project/structure-service.js';
import * as fsExtra from 'fs-extra';
import * as path from 'path';

// Type definition for ora
interface Ora {
  start(text?: string): Ora;
  stop(): Ora;
  succeed(text?: string): Ora;
  fail(text?: string): Ora;
  warn(text?: string): Ora;
  info(text?: string): Ora;
  text: string;
  color: string;
}

// Dynamic import for ora
let oraModule: any = null;
async function getOra() {
  if (!oraModule) {
    oraModule = await import('ora');
  }
  return oraModule.default;
}

export abstract class AbstractAgent implements IAgent {
  protected spinner: Ora | null = null;
  protected startTime: number = 0;
  protected currentState: AgentState | undefined = undefined;

  constructor() {
    // No longer needs PluginSystem initialization
  }

  // ============================================================================
  // CORE EXECUTION
  // ============================================================================

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = performance.now();
    this.startTime = startTime;
    
    try {
      // Initialize logging context
      context.logger.info(`Starting agent: ${this.getMetadata().name}`, {
        agent: this.getMetadata().name,
        category: this.getMetadata().category
      });

      // Pre-execution validation
      console.log(`[AbstractAgent] About to validate agent: ${this.getMetadata().name}`);
      const validation = await this.validate(context);
      console.log(`[AbstractAgent] Validation result for ${this.getMetadata().name}:`, {
        valid: validation.valid,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      });
      
      if (!validation.valid) {
        console.log(`[AbstractAgent] Validation FAILED for ${this.getMetadata().name}:`, validation.errors);
        return this.createErrorResult(
          AGENT_ERROR_CODES.VALIDATION_FAILED,
          'Validation failed',
          validation.errors,
          startTime
        );
      }

      console.log(`[AbstractAgent] Validation PASSED for ${this.getMetadata().name}, calling executeInternal`);

      // Preparation phase
      console.log(`[AbstractAgent] About to call prepare for ${this.getMetadata().name}`);
      await this.prepare?.(context);
      console.log(`[AbstractAgent] prepare completed for ${this.getMetadata().name}`);

      // Main execution
      console.log(`[AbstractAgent] About to call executeInternal for ${this.getMetadata().name}`);
      const result = await this.executeInternal(context);
      console.log(`[AbstractAgent] executeInternal completed for ${this.getMetadata().name}`);

      // Cleanup phase
      console.log(`[AbstractAgent] About to call cleanup for ${this.getMetadata().name}`);
      await this.cleanup?.(context);
      console.log(`[AbstractAgent] cleanup completed for ${this.getMetadata().name}`);

      // Calculate metrics
      const metrics = this.calculateMetrics(startTime);

      const finalResult: AgentResult = {
        ...result,
        duration: performance.now() - startTime,
        metrics
      };

      if (this.currentState) {
        finalResult.state = this.currentState;
      }

      return finalResult;

    } catch (error) {
      console.error(`[AbstractAgent] Error in execute for ${this.getMetadata().name}:`, error);
      console.error(`[AbstractAgent] Error stack:`, error instanceof Error ? error.stack : 'No stack');
      context.logger.error(`Agent execution failed: ${this.getMetadata().name}`, error as Error);
      
      // Attempt rollback if available
      try {
        await this.rollback?.(context);
      } catch (rollbackError) {
        context.logger.error('Rollback failed', rollbackError as Error);
      }

      return this.createErrorResult(
        AGENT_ERROR_CODES.EXECUTION_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        [],
        startTime,
        error
      );
    }
  }

  // ============================================================================
  // ABSTRACT METHODS
  // ============================================================================

  protected abstract executeInternal(context: AgentContext): Promise<AgentResult>;
  protected abstract getAgentMetadata(): AgentMetadata;
  protected abstract getAgentCapabilities(): AgentCapability[];

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  async validate(context: AgentContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!context.projectName) {
      errors.push({
        field: 'projectName',
        message: 'Project name is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!context.projectPath) {
      errors.push({
        field: 'projectPath',
        message: 'Project path is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // Validate dependencies
    for (const dependency of this.getAgentMetadata().dependencies) {
      if (!context.dependencies.includes(dependency)) {
        warnings.push(`Dependency '${dependency}' is recommended but not available`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async prepare(context: AgentContext): Promise<void> {
    // Don't start spinner automatically - only during actual work
    context.logger.info(`Preparing agent: ${this.getMetadata().name}`);
  }

  async cleanup(context: AgentContext): Promise<void> {
    // Stop spinner if it's running
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }

    context.logger.info(`Cleaned up agent: ${this.getMetadata().name}`);
  }

  // ============================================================================
  // ERROR HANDLING & RECOVERY
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.warn(`Rolling back agent: ${this.getMetadata().name}`);
    
    // Default rollback behavior - can be overridden by subclasses
    if (this.currentState) {
      this.setState(this.currentState);
    }
  }

  async retry(context: AgentContext, attempt: number): Promise<AgentResult> {
    const maxRetries = 3;
    
    if (attempt >= maxRetries) {
      return this.createErrorResult(
        AGENT_ERROR_CODES.EXECUTION_FAILED,
        `Max retries (${maxRetries}) exceeded`,
        [],
        this.startTime
      );
    }

    context.logger.warn(`Retrying agent: ${this.getMetadata().name} (attempt ${attempt + 1}/${maxRetries})`);
    
    // Exponential backoff
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.execute(context);
  }

  // ============================================================================
  // METADATA & CAPABILITIES
  // ============================================================================

  getMetadata(): AgentMetadata {
    const baseMetadata = this.getAgentMetadata();
    
    return {
      ...baseMetadata,
      version: baseMetadata.version || '1.0.0',
      author: baseMetadata.author || 'The Architech Team',
      license: baseMetadata.license || 'MIT',
      requirements: baseMetadata.requirements || []
    };
  }

  getCapabilities(): AgentCapability[] {
    return this.getAgentCapabilities();
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getState(): AgentState | undefined {
    return this.currentState;
  }

  setState(state: AgentState): void {
    this.currentState = {
      ...state,
      timestamp: new Date(),
      checksum: this.calculateStateChecksum(state)
    };
  }

  protected updateState(data: Record<string, any>): void {
    const currentData = this.currentState?.data || {};
    const newData = { ...currentData, ...data };
    
    this.setState({
      version: AGENT_INTERFACE_VERSION,
      data: newData,
      timestamp: new Date(),
      checksum: this.calculateStateChecksum({ version: AGENT_INTERFACE_VERSION, data: newData })
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected createSuccessResult(
    data?: any,
    artifacts?: Artifact[],
    nextSteps?: string[]
  ): AgentResult {
    const result: AgentResult = {
      success: true,
      duration: performance.now() - this.startTime,
      errors: [],
      warnings: []
    };

    if (data !== undefined) {
      result.data = data;
    }

    if (artifacts !== undefined) {
      result.artifacts = artifacts;
    }

    if (nextSteps !== undefined) {
      result.nextSteps = nextSteps;
    }

    return result;
  }

  protected createErrorResult(
    code: string,
    message: string,
    errors: any[] = [],
    startTime: number = 0,
    originalError?: any
  ): AgentResult {
    const agentError = {
      code,
      message,
      details: originalError,
      recoverable: this.isRecoverableError(code),
      suggestion: this.getErrorSuggestion(code),
      timestamp: new Date()
    };

    return {
      success: false,
      errors: [agentError, ...errors],
      warnings: [],
      duration: performance.now() - startTime,
      artifacts: [],
      nextSteps: this.getErrorNextSteps(code)
    };
  }

  protected calculateMetrics(startTime: number): PerformanceMetrics {
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return {
      executionTime,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: 0, // Would need additional monitoring
      networkRequests: 0, // Would need to track in subclasses
      artifactsGenerated: 0, // Would need to track in subclasses
      filesCreated: 0, // Would need to track in subclasses
      dependenciesInstalled: 0 // Would need to track in subclasses
    };
  }

  protected calculateStateChecksum(state: Partial<AgentState>): string {
    const dataString = JSON.stringify(state.data || {});
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  protected isRecoverableError(code: string): boolean {
    const recoverableCodes = [
      AGENT_ERROR_CODES.VALIDATION_FAILED,
      AGENT_ERROR_CODES.DEPENDENCY_MISSING,
      AGENT_ERROR_CODES.TIMEOUT
    ] as const;
    
    return recoverableCodes.includes(code as any);
  }

  protected getErrorSuggestion(code: string): string {
    const suggestions: Record<string, string> = {
      [AGENT_ERROR_CODES.VALIDATION_FAILED]: 'Check your configuration and try again',
      [AGENT_ERROR_CODES.DEPENDENCY_MISSING]: 'Install required dependencies first',
      [AGENT_ERROR_CODES.PERMISSION_DENIED]: 'Check file permissions and try again',
      [AGENT_ERROR_CODES.TIMEOUT]: 'Try again or increase timeout settings',
      [AGENT_ERROR_CODES.ROLLBACK_FAILED]: 'Manual intervention may be required',
      [AGENT_ERROR_CODES.UNKNOWN_ERROR]: 'Check logs for more details'
    };

    return suggestions[code] || 'Please check the documentation for troubleshooting';
  }

  protected getErrorNextSteps(code: string): string[] {
    const nextSteps: Record<string, string[]> = {
      [AGENT_ERROR_CODES.VALIDATION_FAILED]: [
        'Review the validation errors above',
        'Update your configuration',
        'Run the command again'
      ],
      [AGENT_ERROR_CODES.DEPENDENCY_MISSING]: [
        'Install the missing dependencies',
        'Check your package manager configuration',
        'Verify network connectivity'
      ],
      [AGENT_ERROR_CODES.PERMISSION_DENIED]: [
        'Check file and directory permissions',
        'Run with elevated privileges if needed',
        'Verify your user has write access'
      ]
    };

    return nextSteps[code] || ['Check the logs for more information'];
  }

  // ============================================================================
  // SPINNER MANAGEMENT
  // ============================================================================

  protected async startSpinner(text: string, context: AgentContext): Promise<void> {
    if (context.options.verbose && !this.spinner) {
      this.spinner = (await getOra())({
        text: chalk.blue(text),
        color: 'blue'
      }).start();
    }
  }

  protected async stopSpinner(): Promise<void> {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  protected updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = chalk.blue(text);
    }
  }

  protected succeedSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(text));
      this.spinner = null;
    }
  }

  protected failSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(text));
      this.spinner = null;
    }
  }
} 