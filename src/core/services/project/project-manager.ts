/**
 * Project Manager Service
 * 
 * Manages project structure, initialization, and state
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PathService } from '../path/path-service.js';
import { Genome, ProjectConfig } from '@thearchitech.xyz/types';

export class ProjectManager {
  private pathHandler: PathService;
  private projectConfig: ProjectConfig;

  constructor(projectConfig: ProjectConfig) {
    this.projectConfig = projectConfig;
    this.pathHandler = new PathService(projectConfig.path, projectConfig.name);
  }

  /**
   * Get path handler instance
   */
  getPathHandler(): PathService {
    return this.pathHandler;
  }

  /**
   * Get project configuration
   */
  getProjectConfig(): ProjectConfig {
    return this.projectConfig;
  }

  /**
   * Get marketplace path
   */
  getMarketplacePath(): string {
    // For now, return a hardcoded path. In production, this should be configurable
    return '/Users/antoine/Documents/Code/architech/marketplace';
  }

  /**
   * Initialize project structure (minimal - only project root)
   */
  async initializeProject(): Promise<void> {
    console.log(`📁 Initializing project: ${this.projectConfig.name}`);
    
    // Create project directory only
    await this.pathHandler.ensureDir(this.pathHandler.getProjectRoot());
    
    console.log(`✅ Project directory created`);
  }

  /**
   * Initialize project with full structure (for monorepos or non-framework projects)
   */
  async initializeProjectWithStructure(): Promise<void> {
    console.log(`📁 Initializing project with structure: ${this.projectConfig.name}`);
    
    // Create project directory
    await this.pathHandler.ensureDir(this.pathHandler.getProjectRoot());
    
    // Create basic directory structure
    await this.createBasicStructure();
    
    console.log(`✅ Project structure initialized`);
  }

  /**
   * Create basic project structure
   */
  private async createBasicStructure(): Promise<void> {
    const directories = [
      this.pathHandler.getSrcPath(),
      this.pathHandler.getLibPath(),
      this.pathHandler.getComponentsPath(),
      this.pathHandler.getUIComponentsPath(),
      this.pathHandler.getUtilsPath(),
      this.pathHandler.getTestPath(),
      this.pathHandler.getDatabasePath(),
      this.pathHandler.getAuthPath(),
    ];

    for (const dir of directories) {
      await this.pathHandler.ensureDir(dir);
    }
  }

  /**
   * Create package.json if it doesn't exist
   */
  async ensurePackageJson(): Promise<void> {
    const packageJsonPath = this.pathHandler.getPackageJsonPath();
    
    if (!(await this.pathHandler.exists(packageJsonPath))) {
      const packageJson = {
        name: this.projectConfig.name,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {},
        devDependencies: {}
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`📦 Created package.json`);
    }
  }

  /**
   * Create tsconfig.json if it doesn't exist
   */
  async ensureTsConfig(): Promise<void> {
    const tsConfigPath = this.pathHandler.getTsConfigPath();
    
    if (!(await this.pathHandler.exists(tsConfigPath))) {
      const tsConfig = {
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "es6"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [
            {
              name: "next"
            }
          ],
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"]
          }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      };

      await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      console.log(`⚙️ Created tsconfig.json`);
    }
  }

  /**
   * Create .env.example if it doesn't exist
   */
  async ensureEnvExample(): Promise<void> {
    const envExamplePath = this.pathHandler.getEnvExamplePath();
    
    if (!(await this.pathHandler.exists(envExamplePath))) {
      const envExample = `# Environment Variables
# Copy this file to .env.local and fill in your values

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/${this.projectConfig.name}"

# Authentication
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (if using)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
`;

      await fs.writeFile(envExamplePath, envExample);
      console.log(`🔐 Created .env.example`);
    }
  }

  /**
   * Create README.md if it doesn't exist
   */
  async ensureReadme(): Promise<void> {
    const readmePath = this.pathHandler.join('README.md');
    
    if (!(await this.pathHandler.exists(readmePath))) {
      const readme = `# ${this.projectConfig.name}

Generated by The Architech

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

- \`src/app/\` - Next.js App Router pages
- \`src/components/\` - React components
- \`src/lib/\` - Utility functions and configurations
- \`src/__tests__/\` - Test files

## Tech Stack

- **Framework**: ${this.projectConfig.framework}
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Configured via adapters
- **Authentication**: Configured via adapters
`;

      await fs.writeFile(readmePath, readme);
      console.log(`📖 Created README.md`);
    }
  }

  /**
   * Initialize all basic project files
   */
  async initializeBasicFiles(): Promise<void> {
    await this.ensurePackageJson();
    await this.ensureTsConfig();
    await this.ensureEnvExample();
    await this.ensureReadme();
  }

  /**
   * Get project status
   */
  async getProjectStatus(): Promise<{
    exists: boolean;
    hasPackageJson: boolean;
    hasTsConfig: boolean;
    hasEnvExample: boolean;
    hasReadme: boolean;
  }> {
    return {
      exists: await this.pathHandler.exists(this.pathHandler.getProjectRoot()),
      hasPackageJson: await this.pathHandler.exists(this.pathHandler.getPackageJsonPath()),
      hasTsConfig: await this.pathHandler.exists(this.pathHandler.getTsConfigPath()),
      hasEnvExample: await this.pathHandler.exists(this.pathHandler.getEnvExamplePath()),
      hasReadme: await this.pathHandler.exists(this.pathHandler.join('README.md'))
    };
  }
}
