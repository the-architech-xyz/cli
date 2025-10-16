/**
 * Execution Tracer
 *
 * Provides execution tracing capabilities for monitoring and debugging
 */
import { Logger } from './logger.js';
/**
 * Simple UUID v4 generator
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export class ExecutionTracer {
    static activeTraces = new Map();
    static completedTraces = [];
    static maxCompletedTraces = 100;
    /**
     * Start a new execution trace
     */
    static startTrace(operation, metadata, parentTraceId) {
        const traceId = generateUUID();
        const traceContext = {
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
    static endTrace(traceId, success = true, error) {
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
        const logContext = {
            traceId,
            operation: trace.operation,
            duration: trace.duration,
            ...(trace.metadata && { metadata: trace.metadata })
        };
        if (success) {
            Logger.info(`Completed execution trace: ${trace.operation}`, logContext);
        }
        else {
            Logger.error(`Failed execution trace: ${trace.operation}`, logContext, error);
        }
    }
    /**
     * Log an operation within a trace
     */
    static logOperation(traceId, message, metadata) {
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
    static startChildTrace(parentTraceId, operation, metadata) {
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
    static getActiveTrace(traceId) {
        return this.activeTraces.get(traceId);
    }
    /**
     * Get all active traces
     */
    static getActiveTraces() {
        return Array.from(this.activeTraces.values());
    }
    /**
     * Get completed traces
     */
    static getCompletedTraces() {
        return [...this.completedTraces];
    }
    /**
     * Get traces by operation type
     */
    static getTracesByOperation(operation) {
        return this.completedTraces.filter(trace => trace.operation === operation);
    }
    /**
     * Get execution metrics
     */
    static getExecutionMetrics() {
        const metrics = {
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
            }
            else {
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
    static getPerformanceSummary() {
        const completedTraces = this.completedTraces.filter(t => t.duration !== undefined);
        // Sort by duration
        const sortedByDuration = [...completedTraces].sort((a, b) => (b.duration || 0) - (a.duration || 0));
        // Sort by frequency
        const operationCounts = {};
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
    static clear() {
        this.activeTraces.clear();
        this.completedTraces = [];
    }
    /**
     * Export traces as JSON
     */
    static exportAsJSON() {
        return JSON.stringify({
            activeTraces: Array.from(this.activeTraces.values()),
            completedTraces: this.completedTraces
        }, null, 2);
    }
}
//# sourceMappingURL=execution-tracer.js.map