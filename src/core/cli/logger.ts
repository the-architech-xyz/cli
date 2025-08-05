/**
 * Enhanced Logger - Better User Experience
 * 
 * Provides structured logging with progress indicators, 
 * estimated time remaining, and clear success/error states.
 */

import chalk from 'chalk';
import ora from 'ora';
import { LogLevel, LogContext } from '../../types/core.js';

export interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
  debug(message: string, data?: any): void;
  success(message: string, data?: any): void;
  log(level: LogLevel, message: string, context?: LogContext): void;
  
  // Enhanced UX methods
  startProgress(message: string): ProgressSpinner;
  step(message: string): void;
  complete(message: string): void;
  estimate(remainingSteps: number): void;
}

export interface ProgressSpinner {
  start(message: string): void;
  succeed(message: string): void;
  fail(message: string): void;
  update(message: string): void;
}

export class EnhancedLogger implements Logger {
  private verbose: boolean;
  private startTime: number;
  private stepCount: number = 0;
  private totalSteps: number = 0;
  private currentSpinner: ora.Ora | null = null;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  info(message: string, data?: any): void {
    console.log(chalk.blue(`ℹ️  ${message}`));
    if (this.verbose && data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  warn(message: string, data?: any): void {
    console.log(chalk.yellow(`⚠️  ${message}`));
    if (this.verbose && data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  error(message: string, error?: Error, data?: any): void {
    console.error(chalk.red(`❌ ${message}`));
    if (error) {
      console.error(chalk.red(error.message));
    }
    if (this.verbose && data) {
      console.error(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  debug(message: string, data?: any): void {
    if (this.verbose) {
      console.log(chalk.gray(`🔍 ${message}`));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  success(message: string, data?: any): void {
    console.log(chalk.green(`✅ ${message}`));
    if (this.verbose && data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    
    switch (level) {
      case 'info':
        this.info(message);
        break;
      case 'warn':
        this.warn(message);
        break;
      case 'error':
        this.error(message);
        break;
      case 'debug':
        this.debug(message);
        break;
      case 'success':
        this.success(message);
        break;
    }
  }

  // Enhanced UX methods
  startProgress(message: string): ProgressSpinner {
    this.currentSpinner = ora(message).start();
    return {
      start: (msg: string) => this.currentSpinner?.start(msg),
      succeed: (msg: string) => this.currentSpinner?.succeed(msg),
      fail: (msg: string) => this.currentSpinner?.fail(msg),
      update: (msg: string) => {
        if (this.currentSpinner) {
          this.currentSpinner.text = msg;
        }
      }
    };
  }

  step(message: string): void {
    this.stepCount++;
    const progress = this.totalSteps > 0 ? `(${this.stepCount}/${this.totalSteps})` : '';
    console.log(chalk.blue(`📋 ${progress} ${message}`));
  }

  complete(message: string): void {
    const duration = Date.now() - this.startTime;
    const durationStr = duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`;
    console.log(chalk.green(`🎉 ${message} (completed in ${durationStr})`));
  }

  estimate(remainingSteps: number): void {
    this.totalSteps = this.stepCount + remainingSteps;
    const elapsed = Date.now() - this.startTime;
    const avgTimePerStep = this.stepCount > 0 ? elapsed / this.stepCount : 5000;
    const estimatedRemaining = remainingSteps * avgTimePerStep;
    
    if (estimatedRemaining > 5000) {
      console.log(chalk.yellow(`⏱️  Estimated time remaining: ${(estimatedRemaining / 1000).toFixed(1)}s`));
    }
  }
} 