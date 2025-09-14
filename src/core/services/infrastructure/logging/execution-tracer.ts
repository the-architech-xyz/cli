/**
 * Execution Tracer
 * 
 * Provides execution tracing capabilities for monitoring and debugging
 */

import { Logger, LogContext } from './logger.js';

/**
 * Simple UUID v4 generator
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface TraceContext {
  traceId: string;
  operation: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  parentTraceId?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalDuration: number;
  averageDuration: number;
  operationsByType: Record<string, number>;
  errorsByType: Record<string, number>;
}

export class ExecutionTracer {
  private static activeTraces: Map<string, TraceContext> = new Map();
  private static completedTraces: TraceContext[] = [];
  private static maxCompletedTraces: number = 100;

  /**
   * Start a new execution trace
   */
  static startTrace(operation: string, metadata?: Record<string, unknown>, parentTraceId?: string): string {
    const traceId = generateUUID();
    const traceContext: TraceContext = {
      traceId,
      operation,
      startTime: new Date(),
      ...(parentTraceId && { parentTraceId }),
      ...(metadata && { metadata })
    };

    this.activeTraces.set(traceId, traceContext);

    Logger.info(`Starting execution trace: ${operation}`, {
      traceId,
      operation,
      ...(metadata && { metadata })
    });

    return traceId;
  }

  /**
   * End an execution trace
   */
  static endTrace(traceId: string, success: boolean = true, error?: Error): void {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      Logger.warn(`Trace not found: ${traceId}`);
      return;
    }

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();

    // Move to completed traces
    this.activeTraces.delete(traceId);
    this.completedTraces.push(trace);

    // Trim completed traces if needed
    if (this.completedTraces.length > this.maxCompletedTraces) {
      this.completedTraces = this.completedTraces.slice(-this.maxCompletedTraces);
    }

    const logContext: LogContext = {
      traceId,
      operation: trace.operation,
      duration: trace.duration,
      ...(trace.metadata && { metadata: trace.metadata })
    };

    if (success) {
      Logger.info(`Completed execution trace: ${trace.operation}`, logContext);
    } else {
      Logger.error(`Failed execution trace: ${trace.operation}`, logContext, error);
    }
  }

  /**
   * Log an operation within a trace
   */
  static logOperation(traceId: string, message: string, metadata?: Record<string, unknown>): void {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      Logger.warn(`Trace not found for operation: ${traceId}`);
      return;
    }

    Logger.debug(message, {
      traceId,
      operation: trace.operation,
      ...(metadata && { metadata })
    });
  }

  /**
   * Create a child trace
   */
  static startChildTrace(parentTraceId: string, operation: string, metadata?: Record<string, unknown>): string {
    const parentTrace = this.activeTraces.get(parentTraceId);
    if (!parentTrace) {
      Logger.warn(`Parent trace not found: ${parentTraceId}`);
      return this.startTrace(operation, metadata);
    }

    return this.startTrace(operation, metadata, parentTraceId);
  }

  /**
   * Get active trace
   */
  static getActiveTrace(traceId: string): TraceContext | undefined {
    return this.activeTraces.get(traceId);
  }

  /**
   * Get all active traces
   */
  static getActiveTraces(): TraceContext[] {
    return Array.from(this.activeTraces.values());
  }

  /**
   * Get completed traces
   */
  static getCompletedTraces(): TraceContext[] {
    return [...this.completedTraces];
  }

  /**
   * Get traces by operation type
   */
  static getTracesByOperation(operation: string): TraceContext[] {
    return this.completedTraces.filter(trace => trace.operation === operation);
  }

  /**
   * Get execution metrics
   */
  static getExecutionMetrics(): ExecutionMetrics {
    const metrics: ExecutionMetrics = {
      totalOperations: this.completedTraces.length,
      successfulOperations: 0,
      failedOperations: 0,
      totalDuration: 0,
      averageDuration: 0,
      operationsByType: {},
      errorsByType: {}
    };

    for (const trace of this.completedTraces) {
      // Count operations by type
      metrics.operationsByType[trace.operation] = (metrics.operationsByType[trace.operation] || 0) + 1;

      // Count successful/failed operations
      if (trace.duration !== undefined) {
        metrics.totalDuration += trace.duration;
        metrics.successfulOperations++;
      } else {
        metrics.failedOperations++;
      }
    }

    metrics.averageDuration = metrics.successfulOperations > 0 
      ? metrics.totalDuration / metrics.successfulOperations 
      : 0;

    return metrics;
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    slowestOperations: Array<{ operation: string; duration: number }>;
    fastestOperations: Array<{ operation: string; duration: number }>;
    mostFrequentOperations: Array<{ operation: string; count: number }>;
  } {
    const completedTraces = this.completedTraces.filter(t => t.duration !== undefined);
    
    // Sort by duration
    const sortedByDuration = [...completedTraces].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    // Sort by frequency
    const operationCounts: Record<string, number> = {};
    for (const trace of this.completedTraces) {
      operationCounts[trace.operation] = (operationCounts[trace.operation] || 0) + 1;
    }
    
    const sortedByFrequency = Object.entries(operationCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([operation, count]) => ({ operation, count }));

    return {
      slowestOperations: sortedByDuration.slice(0, 5).map(t => ({
        operation: t.operation,
        duration: t.duration || 0
      })),
      fastestOperations: sortedByDuration.slice(-5).reverse().map(t => ({
        operation: t.operation,
        duration: t.duration || 0
      })),
      mostFrequentOperations: sortedByFrequency.slice(0, 5)
    };
  }

  /**
   * Clear all traces
   */
  static clear(): void {
    this.activeTraces.clear();
    this.completedTraces = [];
  }

  /**
   * Export traces as JSON
   */
  static exportAsJSON(): string {
    return JSON.stringify({
      activeTraces: Array.from(this.activeTraces.values()),
      completedTraces: this.completedTraces
    }, null, 2);
  }
}
