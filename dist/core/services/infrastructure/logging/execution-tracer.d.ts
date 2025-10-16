/**
 * Execution Tracer
 *
 * Provides execution tracing capabilities for monitoring and debugging
 */
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
export declare class ExecutionTracer {
    private static activeTraces;
    private static completedTraces;
    private static maxCompletedTraces;
    /**
     * Start a new execution trace
     */
    static startTrace(operation: string, metadata?: Record<string, unknown>, parentTraceId?: string): string;
    /**
     * End an execution trace
     */
    static endTrace(traceId: string, success?: boolean, error?: Error): void;
    /**
     * Log an operation within a trace
     */
    static logOperation(traceId: string, message: string, metadata?: Record<string, unknown>): void;
    /**
     * Create a child trace
     */
    static startChildTrace(parentTraceId: string, operation: string, metadata?: Record<string, unknown>): string;
    /**
     * Get active trace
     */
    static getActiveTrace(traceId: string): TraceContext | undefined;
    /**
     * Get all active traces
     */
    static getActiveTraces(): TraceContext[];
    /**
     * Get completed traces
     */
    static getCompletedTraces(): TraceContext[];
    /**
     * Get traces by operation type
     */
    static getTracesByOperation(operation: string): TraceContext[];
    /**
     * Get execution metrics
     */
    static getExecutionMetrics(): ExecutionMetrics;
    /**
     * Get performance summary
     */
    static getPerformanceSummary(): {
        slowestOperations: Array<{
            operation: string;
            duration: number;
        }>;
        fastestOperations: Array<{
            operation: string;
            duration: number;
        }>;
        mostFrequentOperations: Array<{
            operation: string;
            count: number;
        }>;
    };
    /**
     * Clear all traces
     */
    static clear(): void;
    /**
     * Export traces as JSON
     */
    static exportAsJSON(): string;
}
