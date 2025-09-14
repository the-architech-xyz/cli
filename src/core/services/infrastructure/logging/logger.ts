/**
 * Enhanced Logger Service
 * 
 * Provides structured logging with execution tracing capabilities
 */

export enum LogLevel {
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
  // Additional common fields
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

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static entries: LogEntry[] = [];
  private static maxEntries: number = 1000;

  /**
   * Configure logger settings
   */
  static configure(options: {
    level?: LogLevel;
    maxEntries?: number;
  }): void {
    if (options.level !== undefined) {
      this.level = options.level;
    }
    if (options.maxEntries !== undefined) {
      this.maxEntries = options.maxEntries;
    }
  }

  /**
   * Set log level
   */
  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  static getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Log debug message
   */
  static debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  static info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  static warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  static error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Internal logging method
   */
  private static log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...(context && { context }),
      ...(error && { error })
    };

    // Store entry
    this.entries.push(entry);
    
    // Trim entries if we exceed max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Format and output
    const formattedMessage = this.formatMessage(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error(error.stack);
        }
        break;
    }
  }

  /**
   * Format log message
   */
  private static formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` [${this.formatContext(entry.context)}]` : '';
    
    return `[${timestamp}] ${levelName}${contextStr}: ${entry.message}`;
  }

  /**
   * Format context object
   */
  private static formatContext(context: LogContext): string {
    const parts: string[] = [];
    
    if (context.traceId) {
      parts.push(`trace=${context.traceId}`);
    }
    if (context.operation) {
      parts.push(`op=${context.operation}`);
    }
    if (context.moduleId) {
      parts.push(`module=${context.moduleId}`);
    }
    if (context.agentCategory) {
      parts.push(`agent=${context.agentCategory}`);
    }
    if (context.filePath) {
      parts.push(`file=${context.filePath}`);
    }
    if (context.duration !== undefined) {
      parts.push(`duration=${context.duration}ms`);
    }
    
    return parts.join(' ');
  }

  /**
   * Get all log entries
   */
  static getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get log entries by level
   */
  static getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  /**
   * Get log entries by trace ID
   */
  static getEntriesByTrace(traceId: string): LogEntry[] {
    return this.entries.filter(entry => entry.context?.traceId === traceId);
  }

  /**
   * Clear all log entries
   */
  static clear(): void {
    this.entries = [];
  }

  /**
   * Get log statistics
   */
  static getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byOperation: Record<string, number>;
    averageDuration: number;
  } {
    const stats = {
      total: this.entries.length,
      byLevel: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      averageDuration: 0
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const entry of this.entries) {
      // Count by level
      const levelName = LogLevel[entry.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;

      // Count by operation
      if (entry.context?.operation) {
        stats.byOperation[entry.context.operation] = (stats.byOperation[entry.context.operation] || 0) + 1;
      }

      // Calculate average duration
      if (entry.context?.duration !== undefined) {
        totalDuration += entry.context.duration;
        durationCount++;
      }
    }

    stats.averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  }

  /**
   * Export logs as JSON
   */
  static exportAsJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Export logs as text
   */
  static exportAsText(): string {
    return this.entries.map(entry => this.formatMessage(entry)).join('\n');
  }
}
