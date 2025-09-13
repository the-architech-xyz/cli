/**
 * Logger Implementation
 * 
 * Provides structured logging for agents with different verbosity levels
 * and context-aware formatting.
 */

import chalk from 'chalk';
// Simple logger types for V1
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success'
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

export class AgentLogger implements Logger {
  private verbose: boolean;
  private agentName?: string;

  constructor(verbose: boolean = false, agentName?: string) {
    this.verbose = verbose;
    if (agentName !== undefined) {
      this.agentName = agentName;
    }
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, { data });
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, { data });
  }

  error(message: string, error?: Error, data?: any): void {
    const context: LogContext = { data };
    
    if (error?.message) {
      context.error = error.message;
    }
    
    if (error?.stack) {
      context.stack = error.stack;
    }

    this.log(LogLevel.ERROR, message, context);
  }

  debug(message: string, data?: any): void {
    if (this.verbose) {
      this.log(LogLevel.DEBUG, message, { data });
    }
  }

  success(message: string, data?: any): void {
    this.log(LogLevel.SUCCESS, message, { data });
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
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

  private formatMessage(level: LogLevel, message: string): string {
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
  logStep(step: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, message, { step, data });
  }

  logProgress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    this.info(`${message} (${current}/${total} - ${percentage}%)`);
  }

  logArtifact(type: string, path: string): void {
    this.success(`Created ${type}: ${path}`);
  }

  logDependency(name: string, version?: string): void {
    const versionInfo = version ? `@${version}` : '';
    this.info(`Installed dependency: ${name}${versionInfo}`);
  }
} 