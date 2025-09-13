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
      console.log(message, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    if (this.level !== 'quiet') {
      console.log(`✅ ${message}`, ...args);
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
      console.log(`  🔍 ${message}`, ...args);
    }
  }

  verbose(message: string, ...args: any[]) {
    if (this.level === 'verbose') {
      console.log(`  📋 ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
