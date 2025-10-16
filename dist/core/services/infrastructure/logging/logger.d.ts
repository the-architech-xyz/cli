/**
 * Enhanced Logger Service
 *
 * Provides structured logging with execution tracing capabilities
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogContext {
    traceId?: string;
    operation?: string;
    moduleId?: string;
    agentCategory?: string;
    filePath?: string;
    duration?: number;
    metadata?: Record<string, unknown>;
    filesCreated?: number;
    modulesExecuted?: number;
    successfulModules?: number;
    totalModules?: number;
    totalExecutionTime?: number;
    vfsModules?: number;
    simpleModules?: number;
    integrationCount?: number;
    errorCount?: number;
    [key: string]: unknown;
}
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: Error;
}
export declare class Logger {
    private static level;
    private static entries;
    private static maxEntries;
    private static verbose;
    /**
     * Configure logger settings
     */
    static configure(options: {
        level?: LogLevel;
        maxEntries?: number;
        verbose?: boolean;
    }): void;
    /**
     * Set log level
     */
    static setLevel(level: LogLevel): void;
    /**
     * Set verbose mode
     */
    static setVerbose(verbose: boolean): void;
    /**
     * Get current log level
     */
    static getLevel(): LogLevel;
    /**
     * Log debug message
     */
    static debug(message: string, context?: LogContext): void;
    /**
     * Log info message
     */
    static info(message: string, context?: LogContext): void;
    /**
     * Log warning message
     */
    static warn(message: string, context?: LogContext): void;
    /**
     * Log error message
     */
    static error(message: string, context?: LogContext, error?: Error): void;
    /**
     * Internal logging method
     */
    private static log;
    /**
     * Format log message
     */
    private static formatMessage;
    /**
     * Format context object
     */
    private static formatContext;
    /**
     * Get all log entries
     */
    static getEntries(): LogEntry[];
    /**
     * Get log entries by level
     */
    static getEntriesByLevel(level: LogLevel): LogEntry[];
    /**
     * Get log entries by trace ID
     */
    static getEntriesByTrace(traceId: string): LogEntry[];
    /**
     * Clear all log entries
     */
    static clear(): void;
    /**
     * Get log statistics
     */
    static getStats(): {
        total: number;
        byLevel: Record<string, number>;
        byOperation: Record<string, number>;
        averageDuration: number;
    };
    /**
     * Export logs as JSON
     */
    static exportAsJSON(): string;
    /**
     * Export logs as text
     */
    static exportAsText(): string;
}
