/**
 * Enhanced Logger Service
 *
 * Provides structured logging with execution tracing capabilities
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static level = LogLevel.INFO;
    static entries = [];
    static maxEntries = 1000;
    static verbose = false;
    /**
     * Configure logger settings
     */
    static configure(options) {
        if (options.level !== undefined) {
            this.level = options.level;
        }
        if (options.maxEntries !== undefined) {
            this.maxEntries = options.maxEntries;
        }
        if (options.verbose !== undefined) {
            this.verbose = options.verbose;
        }
    }
    /**
     * Set log level
     */
    static setLevel(level) {
        this.level = level;
    }
    /**
     * Set verbose mode
     */
    static setVerbose(verbose) {
        this.verbose = verbose;
    }
    /**
     * Get current log level
     */
    static getLevel() {
        return this.level;
    }
    /**
     * Log debug message
     */
    static debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    /**
     * Log info message
     */
    static info(message, context) {
        // Only show info messages in verbose mode
        if (!this.verbose) {
            return;
        }
        this.log(LogLevel.INFO, message, context);
    }
    /**
     * Log warning message
     */
    static warn(message, context) {
        // Only show warnings in verbose mode
        if (!this.verbose) {
            return;
        }
        this.log(LogLevel.WARN, message, context);
    }
    /**
     * Log error message
     */
    static error(message, context, error) {
        this.log(LogLevel.ERROR, message, context, error);
    }
    /**
     * Internal logging method
     */
    static log(level, message, context, error) {
        if (level < this.level) {
            return;
        }
        const entry = {
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
    static formatMessage(entry) {
        const timestamp = entry.timestamp.toISOString();
        const levelName = LogLevel[entry.level];
        const contextStr = entry.context ? ` [${this.formatContext(entry.context)}]` : '';
        return `[${timestamp}] ${levelName}${contextStr}: ${entry.message}`;
    }
    /**
     * Format context object
     */
    static formatContext(context) {
        const parts = [];
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
    static getEntries() {
        return [...this.entries];
    }
    /**
     * Get log entries by level
     */
    static getEntriesByLevel(level) {
        return this.entries.filter(entry => entry.level === level);
    }
    /**
     * Get log entries by trace ID
     */
    static getEntriesByTrace(traceId) {
        return this.entries.filter(entry => entry.context?.traceId === traceId);
    }
    /**
     * Clear all log entries
     */
    static clear() {
        this.entries = [];
    }
    /**
     * Get log statistics
     */
    static getStats() {
        const stats = {
            total: this.entries.length,
            byLevel: {},
            byOperation: {},
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
    static exportAsJSON() {
        return JSON.stringify(this.entries, null, 2);
    }
    /**
     * Export logs as text
     */
    static exportAsText() {
        return this.entries.map(entry => this.formatMessage(entry)).join('\n');
    }
}
//# sourceMappingURL=logger.js.map