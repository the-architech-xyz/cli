/**
 * Enhanced Logger for Beautiful CLI Output
 * 
 * Provides a clean, phase-oriented experience for users while preserving
 * detailed debugging information for verbose mode.
 */

import chalk from 'chalk';

export interface LoggerOptions {
  verbose: boolean;
  quiet: boolean;
}

export interface PhaseInfo {
  name: string;
  description: string;
  emoji: string;
}

export class EnhancedLogger {
  private verbose: boolean;
  private quiet: boolean;
  private currentPhase: string | null = null;
  private phaseStartTime: number = 0;
  private totalModules: number = 0;
  private completedModules: number = 0;

  // Phase definitions
  private static readonly PHASES: Record<string, PhaseInfo> = {
    'validating': {
      name: 'Validating Genome',
      description: 'Checking project configuration and dependencies',
      emoji: '🔍'
    },
    'planning': {
      name: 'Planning Execution',
      description: 'Analyzing dependencies and creating execution plan',
      emoji: '📋'
    },
    'framework': {
      name: 'Setting Up Framework',
      description: 'Installing and configuring the base framework',
      emoji: '🏗️'
    },
    'adapters': {
      name: 'Installing Adapters',
      description: 'Adding core functionality modules',
      emoji: '🔧'
    },
    'integrations': {
      name: 'Configuring Integrations',
      description: 'Connecting modules and enabling features',
      emoji: '🔗'
    },
    'finalizing': {
      name: 'Finalizing Project',
      description: 'Installing dependencies and completing setup',
      emoji: '✨'
    }
  };

  constructor(options: LoggerOptions) {
    this.verbose = options.verbose;
    this.quiet = options.quiet;
  }

  /**
   * Start a new phase
   */
  startPhase(phaseKey: string): void {
    if (this.quiet) return;
    
    const phase = EnhancedLogger.PHASES[phaseKey];
    if (!phase) return;

    this.currentPhase = phaseKey;
    this.phaseStartTime = Date.now();
    
    console.log();
    console.log(chalk.blue.bold(`${phase.emoji} ${phase.name}`));
    console.log(chalk.gray(`   ${phase.description}`));
  }

  /**
   * Complete the current phase
   */
  completePhase(): void {
    if (this.quiet || !this.currentPhase) return;
    
    const phase = EnhancedLogger.PHASES[this.currentPhase];
    const duration = Date.now() - this.phaseStartTime;
    
    console.log(chalk.green(`   ✅ Completed in ${duration}ms`));
    this.currentPhase = null;
  }

  /**
   * Set total module count for progress tracking
   */
  setTotalModules(count: number): void {
    this.totalModules = count;
    this.completedModules = 0;
  }

  /**
   * Log module progress
   */
  logModuleProgress(moduleId: string, status: 'installing' | 'configuring' | 'completed' | 'failed'): void {
    if (this.quiet) return;

    this.completedModules++;
    const progress = `[${this.completedModules}/${this.totalModules}]`;
    
    switch (status) {
      case 'installing':
        console.log(chalk.cyan(`   ${progress} Installing: ${moduleId}...`));
        break;
      case 'configuring':
        console.log(chalk.yellow(`   ${progress} Configuring: ${moduleId}...`));
        break;
      case 'completed':
        console.log(chalk.green(`   ${progress} ✅ ${moduleId}`));
        break;
      case 'failed':
        console.log(chalk.red(`   ${progress} ❌ ${moduleId}`));
        break;
    }
  }

  /**
   * Log success message
   */
  success(message: string): void {
    if (this.quiet) return;
    console.log(chalk.green.bold(`\n🎉 ${message}`));
  }

  /**
   * Log error message
   */
  error(message: string): void {
    console.error(chalk.red.bold(`\n❌ ${message}`));
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    if (this.quiet) return;
    console.log(chalk.yellow(`\n⚠️  ${message}`));
  }

  /**
   * Log info message
   */
  info(message: string): void {
    if (this.quiet) return;
    console.log(chalk.blue(`\nℹ️  ${message}`));
  }

  /**
   * Log next steps after successful completion
   */
  logNextSteps(projectPath: string, projectName: string): void {
    if (this.quiet) return;
    
    console.log();
    console.log(chalk.green.bold('🚀 Your project is ready!'));
    console.log();
    console.log(chalk.white('Next steps:'));
    console.log(chalk.gray(`  cd ${projectPath}`));
    console.log(chalk.gray(`  npm install`));
    console.log(chalk.gray(`  npm run dev`));
    console.log();
    console.log(chalk.blue(`Happy coding! 🎉`));
  }

  /**
   * Log debug information (verbose mode only)
   */
  debug(message: string, data?: any): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`  🔍 DEBUG: ${message}`));
    if (data) {
      console.log(chalk.gray('  Context:'), JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log verbose information (verbose mode only)
   */
  logVerbose(message: string, data?: any): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`  📋 ${message}`));
    if (data) {
      console.log(chalk.gray('  Data:'), JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log action details (verbose mode only)
   */
  logAction(action: string, details: string): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`    ${action}: ${details}`));
  }

  /**
   * Log VFS operations (verbose mode only)
   */
  logVFS(operation: string, file: string): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`    📁 VFS: ${operation} ${file}`));
  }

  /**
   * Log template processing (verbose mode only)
   */
  logTemplate(template: string, result: string): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`    📝 Template: ${template} → ${result}`));
  }

  /**
   * Log modifier usage (verbose mode only)
   */
  logModifier(modifier: string, file: string): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`    🔧 Modifier: ${modifier} on ${file}`));
  }

  /**
   * Log package installation (verbose mode only)
   */
  logPackageInstall(packages: string[]): void {
    if (!this.verbose) return;
    console.log(chalk.gray(`    📦 Installing: ${packages.join(', ')}`));
  }

  /**
   * Log environment variable (verbose mode only)
   */
  logEnvVar(key: string, value: string): void {
    if (!this.verbose) return;
    const displayValue = value ? `${value.substring(0, 20)}...` : '(empty)';
    console.log(chalk.gray(`    🔐 Env: ${key}=${displayValue}`));
  }
}
