/**
 * Logger Implementation
 *
 * Provides structured logging for agents with different verbosity levels
 * and context-aware formatting.
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    SUCCESS = "success"
}
export interface LogContext {
    agent?: string;
    step?: string;
    duration?: number;
    data?: any;
    error?: string;
    stack?: string;
}
export interface Logger {
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error, data?: any): void;
    debug(message: string, data?: any): void;
    success(message: string, data?: any): void;
    log(level: LogLevel, message: string, context?: LogContext): void;
}
export declare class AgentLogger implements Logger {
    private verbose;
    private agentName?;
    constructor(verbose?: boolean, agentName?: string);
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error, data?: any): void;
    debug(message: string, data?: any): void;
    debugStructured(message: string, data: any): void;
    success(message: string, data?: any): void;
    log(level: LogLevel, message: string, context?: LogContext): void;
    private formatMessage;
    logStep(step: string, message: string, data?: any): void;
    logProgress(current: number, total: number, message: string): void;
    logArtifact(type: string, path: string): void;
    logDependency(name: string, version?: string): void;
}
