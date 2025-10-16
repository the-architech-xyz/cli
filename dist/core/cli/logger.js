/**
 * Logger Implementation
 *
 * Provides structured logging for agents with different verbosity levels
 * and context-aware formatting.
 */
import chalk from 'chalk';
// Simple logger types for V1
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["SUCCESS"] = "success";
})(LogLevel || (LogLevel = {}));
export class AgentLogger {
    verbose;
    agentName;
    constructor(verbose = false, agentName) {
        this.verbose = verbose;
        if (agentName !== undefined) {
            this.agentName = agentName;
        }
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, { data });
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, { data });
    }
    error(message, error, data) {
        const context = { data };
        if (error?.message) {
            context.error = error.message;
        }
        if (error?.stack) {
            context.stack = error.stack;
        }
        this.log(LogLevel.ERROR, message, context);
    }
    debug(message, data) {
        if (this.verbose) {
            this.log(LogLevel.DEBUG, message, { data });
        }
    }
    // Enhanced debug logging with structured data
    debugStructured(message, data) {
        if (this.verbose) {
            this.log(LogLevel.DEBUG, message, { data });
        }
    }
    success(message, data) {
        this.log(LogLevel.SUCCESS, message, { data });
    }
    log(level, message, context) {
        const timestamp = new Date().toISOString();
        const agent = context?.agent || this.agentName;
        const step = context?.step;
        const duration = context?.duration;
        // Format the message based on level
        let formattedMessage = this.formatMessage(level, message);
        // Add context information
        if (agent) {
            formattedMessage = `[${agent}] ${formattedMessage}`;
        }
        if (step) {
            formattedMessage = `${formattedMessage} (${step})`;
        }
        if (duration) {
            formattedMessage = `${formattedMessage} (${duration}ms)`;
        }
        // Add timestamp for verbose mode
        if (this.verbose) {
            formattedMessage = `[${timestamp}] ${formattedMessage}`;
        }
        // Output the message
        console.log(formattedMessage);
        // Log additional context data in verbose mode
        if (this.verbose && context?.data) {
            console.log(chalk.gray('  Context:'), JSON.stringify(context.data, null, 2));
        }
    }
    formatMessage(level, message) {
        switch (level) {
            case LogLevel.DEBUG:
                return chalk.gray(`🔍 DEBUG: ${message}`);
            case LogLevel.INFO:
                return chalk.blue(`ℹ️  INFO: ${message}`);
            case LogLevel.WARN:
                return chalk.yellow(`⚠️  WARN: ${message}`);
            case LogLevel.ERROR:
                return chalk.red(`❌ ERROR: ${message}`);
            case LogLevel.SUCCESS:
                return chalk.green(`✅ SUCCESS: ${message}`);
            default:
                return message;
        }
    }
    // Utility methods for common logging patterns
    logStep(step, message, data) {
        this.log(LogLevel.INFO, message, { step, data });
    }
    logProgress(current, total, message) {
        const percentage = Math.round((current / total) * 100);
        this.info(`${message} (${current}/${total} - ${percentage}%)`);
    }
    logArtifact(type, path) {
        this.success(`Created ${type}: ${path}`);
    }
    logDependency(name, version) {
        const versionInfo = version ? `@${version}` : '';
        this.info(`Installed dependency: ${name}${versionInfo}`);
    }
}
//# sourceMappingURL=logger.js.map