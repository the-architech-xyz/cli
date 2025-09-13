/**
 * Path Handler Service
 * 
 * Centralized path management for The Architech
 * Provides standardized file paths and structure management
 */

import * as path from 'path';

export class PathHandler {
  private projectRoot: string;
  private projectName: string;

  constructor(projectRoot: string, projectName: string) {
    this.projectRoot = path.resolve(projectRoot);
    this.projectName = projectName;
  }

  /**
   * Get project root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Get project name
   */
  getProjectName(): string {
    return this.projectName;
  }

  /**
   * Get source directory path
   */
  getSrcPath(): string {
    return path.join(this.projectRoot, 'src');
  }

  /**
   * Get app directory path (for Next.js App Router)
   */
  getAppPath(): string {
    return path.join(this.getSrcPath(), 'app');
  }

  /**
   * Get lib directory path
   */
  getLibPath(): string {
    return path.join(this.getSrcPath(), 'lib');
  }

  /**
   * Get components directory path
   */
  getComponentsPath(): string {
    return path.join(this.getSrcPath(), 'components');
  }

  /**
   * Get UI components directory path
   */
  getUIComponentsPath(): string {
    return path.join(this.getComponentsPath(), 'ui');
  }

  /**
   * Get database directory path
   */
  getDatabasePath(): string {
    return path.join(this.getLibPath(), 'db');
  }

  /**
   * Get auth directory path
   */
  getAuthPath(): string {
    return path.join(this.getLibPath(), 'auth');
  }

  /**
   * Get features directory path (for cross-adapter features)
   */
  getFeaturesPath(): string {
    return path.join(process.cwd(), 'src', 'features');
  }

  /**
   * Get adapters directory path
   */
  getAdaptersPath(): string {
    return path.join(process.cwd(), 'src', 'adapters');
  }

  /**
   * Get test directory path
   */
  getTestPath(): string {
    return path.join(this.getSrcPath(), '__tests__');
  }

  /**
   * Get utils directory path
   */
  getUtilsPath(): string {
    return path.join(this.getLibPath(), 'utils');
  }

  /**
   * Get package.json path
   */
  getPackageJsonPath(): string {
    return path.join(this.projectRoot, 'package.json');
  }

  /**
   * Get tsconfig.json path
   */
  getTsConfigPath(): string {
    return path.join(this.projectRoot, 'tsconfig.json');
  }

  /**
   * Get tailwind.config path
   */
  getTailwindConfigPath(): string {
    return path.join(this.projectRoot, 'tailwind.config.ts');
  }

  /**
   * Get .env path
   */
  getEnvPath(): string {
    return path.join(this.projectRoot, '.env');
  }

  /**
   * Get .env.example path
   */
  getEnvExamplePath(): string {
    return path.join(this.projectRoot, '.env.example');
  }

  /**
   * Get next.config path
   */
  getNextConfigPath(): string {
    return path.join(this.projectRoot, 'next.config.ts');
  }

  /**
   * Get vitest.config path
   */
  getVitestConfigPath(): string {
    return path.join(this.projectRoot, 'vitest.config.ts');
  }

  /**
   * Get components.json path (for Shadcn/ui)
   */
  getComponentsJsonPath(): string {
    return path.join(this.projectRoot, 'components.json');
  }

  /**
   * Get drizzle.config path
   */
  getDrizzleConfigPath(): string {
    return path.join(this.projectRoot, 'drizzle.config.ts');
  }

  /**
   * Get drizzle migrations path
   */
  getDrizzleMigrationsPath(): string {
    return path.join(this.projectRoot, 'drizzle');
  }

  /**
   * Resolve a path relative to project root
   */
  resolve(relativePath: string): string {
    return path.resolve(this.projectRoot, relativePath);
  }

  /**
   * Join paths relative to project root
   */
  join(...paths: string[]): string {
    return path.join(this.projectRoot, ...paths);
  }

  /**
   * Get relative path from project root
   */
  relative(targetPath: string): string {
    return path.relative(this.projectRoot, targetPath);
  }

  /**
   * Ensure directory exists
   */
  async ensureDir(dirPath: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Check if path exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
