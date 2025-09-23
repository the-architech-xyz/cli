/**
 * Simple logger utility with verbose/quiet modes
 */

export type LogLevel = 'quiet' | 'normal' | 'verbose';

class Logger {
  private level: LogLevel = 'normal';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  info(message: string, ...args: any[]) {
    if (this.level !== 'quiet') {
    }
  }

  success(message: string, ...args: any[]) {
    if (this.level !== 'quiet') {
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level !== 'quiet') {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (this.level === 'verbose') {
    }
  }

  verbose(message: string, ...args: any[]) {
    if (this.level === 'verbose') {
    }
  }
}

export const logger = new Logger();
