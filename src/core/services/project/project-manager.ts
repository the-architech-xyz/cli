/**
 * Project Manager Service
 * 
 * Manages project structure, initialization, and state
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PathService } from '../path/path-service.js';
import { Genome, ProjectConfig, PathKey } from '@thearchitech.xyz/types';

export class ProjectManager {
  private pathHandler: PathService;
  private projectConfig: ProjectConfig;

  constructor(projectConfig: ProjectConfig) {
    this.projectConfig = projectConfig;
    this.pathHandler = new PathService(projectConfig.path || './', projectConfig.name);
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
   * @deprecated Use MarketplaceRegistry.getCoreMarketplacePath() instead
   */
  getMarketplacePath(): string {
    // Deprecated - kept for backward compatibility
    // The actual marketplace path is now handled by MarketplaceRegistry
    return '';
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
   * Initialize monorepo structure
   */
  async initializeMonorepoStructure(monorepoConfig: any): Promise<void> {
    console.log(`📁 Initializing monorepo structure: ${this.projectConfig.name}`);
    
    // Apply sensible defaults if packages missing or empty
    if (!monorepoConfig.packages || Object.keys(monorepoConfig.packages).length === 0) {
      monorepoConfig.packages = {
        api: 'packages/api',
        web: 'apps/web',
        mobile: 'apps/mobile',
        shared: 'packages/shared',
        ui: 'packages/ui'
      };
    }

    // Create package directories
    for (const [packageName, packagePath] of Object.entries(monorepoConfig.packages)) {
      if (packagePath && typeof packagePath === 'string') {
        const fullPath = path.join(this.pathHandler.getProjectRoot(), packagePath);
        await this.pathHandler.ensureDir(fullPath);
        console.log(`📦 Created package directory: ${packagePath}`);
      }
    }
    
    // Create root package.json for workspace
    await this.createRootPackageJson(monorepoConfig);
    
    // Generate monorepo tool configuration
    await this.generateMonorepoToolConfig(monorepoConfig);
    
    console.log(`✅ Monorepo structure initialized`);
  }

  /**
   * Create root package.json for workspace
   */
  private async createRootPackageJson(monorepoConfig: any): Promise<void> {
    const packageJsonPath = path.join(this.pathHandler.getProjectRoot(), 'package.json');
    
    // Check if package.json already exists
    try {
      await fs.access(packageJsonPath);
      console.log(`📄 Root package.json already exists, skipping creation`);
      return;
    } catch {
      // File doesn't exist, create it
    }
    
    const packageJson = {
      name: this.projectConfig.name,
      version: this.projectConfig.version || '1.0.0',
      description: this.projectConfig.description || '',
      private: true,
      workspaces: Object.values(monorepoConfig.packages).filter(Boolean),
      scripts: {
        build: 'turbo build',
        dev: 'turbo dev',
        lint: 'turbo lint',
        test: 'turbo test',
        clean: 'turbo clean'
      },
      devDependencies: {
        turbo: '^1.10.0'
      }
    };
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`📄 Created root package.json`);
  }

  /**
   * Generate monorepo tool configuration
   */
  private async generateMonorepoToolConfig(monorepoConfig: any): Promise<void> {
    const tool = monorepoConfig.tool;
    
    switch (tool) {
      case 'turborepo':
        await this.generateTurboConfig();
        break;
      case 'nx':
        await this.generateNxConfig();
        break;
      case 'pnpm-workspaces':
        await this.generatePnpmWorkspaceConfig(monorepoConfig);
        break;
      case 'yarn-workspaces':
        // Already handled in package.json workspaces
        break;
      default:
        console.log(`⚠️ Unknown monorepo tool: ${tool}, skipping config generation`);
    }
  }

  /**
   * Generate turbo.json configuration
   */
  private async generateTurboConfig(): Promise<void> {
    const turboJsonPath = path.join(this.pathHandler.getProjectRoot(), 'turbo.json');
    
    const turboConfig = {
      $schema: 'https://turbo.build/schema.json',
      globalDependencies: ['**/.env.*local'],
      globalEnv: ['NODE_ENV'],
      pipeline: {
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**', '.next/**', '!.next/cache/**']
        },
        dev: {
          cache: false,
          persistent: true
        },
        lint: {
          dependsOn: ['^lint']
        },
        test: {
          dependsOn: ['^test']
        },
        clean: {
          cache: false
        }
      }
    };
    
    await fs.writeFile(turboJsonPath, JSON.stringify(turboConfig, null, 2));
    console.log(`⚡ Created turbo.json`);
  }

  /**
   * Generate nx.json configuration
   */
  private async generateNxConfig(): Promise<void> {
    const nxJsonPath = path.join(this.pathHandler.getProjectRoot(), 'nx.json');
    
    const nxConfig = {
      $schema: './node_modules/nx/schemas/nx-schema.json',
      namedInputs: {
        default: ['{projectRoot}/**/*', 'sharedGlobals'],
        production: [
          'default',
          '!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?',
          '!{projectRoot}/tsconfig.spec.json',
          '!{projectRoot}/jest.config.[jt]s',
          '!{projectRoot}/src/test-setup.[jt]s',
          '!{projectRoot}/test-setup.[jt]s',
          '!{projectRoot}/.eslintrc.json',
          '!{projectRoot}/eslint.config.js'
        ],
        sharedGlobals: []
      },
      targetDefaults: {
        build: {
          dependsOn: ['^build'],
          inputs: ['production', '^production']
        },
        test: {
          inputs: ['default', '^production', '{workspaceRoot}/jest.preset.js']
        },
        lint: {
          inputs: ['default', '{workspaceRoot}/.eslintrc.json']
        }
      }
    };
    
    await fs.writeFile(nxJsonPath, JSON.stringify(nxConfig, null, 2));
    console.log(`🔧 Created nx.json`);
  }

  /**
   * Generate pnpm-workspace.yaml configuration
   */
  private async generatePnpmWorkspaceConfig(monorepoConfig: any): Promise<void> {
    const workspaceYamlPath = path.join(this.pathHandler.getProjectRoot(), 'pnpm-workspace.yaml');
    
    const packages = Object.values(monorepoConfig.packages).filter(Boolean);
    const workspaceConfig = `packages:
${packages.map(pkg => `  - '${pkg}'`).join('\n')}
`;
    
    await fs.writeFile(workspaceYamlPath, workspaceConfig);
    console.log(`📦 Created pnpm-workspace.yaml`);
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
    const directoryKeys: PathKey[] = [
      PathKey.APPS_WEB_SRC,
      PathKey.APPS_WEB_APP,
      PathKey.APPS_WEB_COMPONENTS,
      PathKey.APPS_WEB_MIDDLEWARE,
      PathKey.APPS_WEB_SERVER,
      PathKey.PACKAGES_SHARED_SRC,
      PathKey.PACKAGES_SHARED_COMPONENTS,
      PathKey.PACKAGES_SHARED_HOOKS,
      PathKey.PACKAGES_SHARED_PROVIDERS,
      PathKey.PACKAGES_SHARED_STORES,
      PathKey.PACKAGES_SHARED_TYPES,
      PathKey.PACKAGES_SHARED_UTILS,
      PathKey.PACKAGES_SHARED_ROUTES,
      PathKey.PACKAGES_SHARED_JOBS,
      PathKey.PACKAGES_DATABASE_SRC,
      PathKey.PACKAGES_UI_SRC,
      PathKey.WORKSPACE_SCRIPTS,
    ];

    const created = new Set<string>();
    for (const key of directoryKeys) {
      if (!this.pathHandler.hasPath(key)) {
        continue;
      }
      const dir = this.pathHandler.getPath(key);
      if (created.has(dir)) {
        continue;
      }
      await this.pathHandler.ensureDir(dir);
      created.add(dir);
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

- **Framework**: ${((this.projectConfig as any).apps && (this.projectConfig as any).apps[0]?.framework) || (this.projectConfig as any).framework || 'unknown'}
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

  /**
   * Detect monorepo structure and configuration
   */
  async detectMonorepoStructure(): Promise<MonorepoStructure> {
    const projectRoot = this.pathHandler.getProjectRoot();
    
    // Check for Turborepo
    const turboJsonPath = path.join(projectRoot, 'turbo.json');
    if (await this.pathHandler.exists(turboJsonPath)) {
      return {
        isMonorepo: true,
        tool: 'turborepo',
        packages: await this.detectTurboPackages(),
        rootDir: projectRoot
      };
    }
    
    // Check for Nx
    const nxJsonPath = path.join(projectRoot, 'nx.json');
    if (await this.pathHandler.exists(nxJsonPath)) {
      return {
        isMonorepo: true,
        tool: 'nx',
        packages: await this.detectNxPackages(),
        rootDir: projectRoot
      };
    }
    
    // Check for pnpm workspaces
    const pnpmWorkspacePath = path.join(projectRoot, 'pnpm-workspace.yaml');
    if (await this.pathHandler.exists(pnpmWorkspacePath)) {
      return {
        isMonorepo: true,
        tool: 'pnpm-workspaces',
        packages: await this.detectPnpmPackages(),
        rootDir: projectRoot
      };
    }
    
    // Check package.json workspaces (Yarn/npm workspaces)
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await this.pathHandler.exists(packageJsonPath)) {
      const packageJson = await this.readPackageJson();
      if (packageJson.workspaces) {
        return {
          isMonorepo: true,
          tool: 'yarn-workspaces',
          packages: await this.expandWorkspaceGlobs(packageJson.workspaces),
          rootDir: projectRoot
        };
      }
    }
    
    return {
      isMonorepo: false,
      tool: 'none',
      packages: [],
      rootDir: projectRoot
    };
  }

  /**
   * Detect packages in Turborepo
   */
  private async detectTurboPackages(): Promise<string[]> {
    try {
      const turboJsonPath = path.join(this.pathHandler.getProjectRoot(), 'turbo.json');
      const turboJson = JSON.parse(await fs.readFile(turboJsonPath, 'utf-8'));
      
      // Turborepo packages are typically in apps/ and packages/ directories
      const packages: string[] = [];
      
      const appsDir = path.join(this.pathHandler.getProjectRoot(), 'apps');
      const packagesDir = path.join(this.pathHandler.getProjectRoot(), 'packages');
      
      if (await this.pathHandler.exists(appsDir)) {
        const apps = await fs.readdir(appsDir);
        apps.forEach(app => packages.push(`apps/${app}`));
      }
      
      if (await this.pathHandler.exists(packagesDir)) {
        const pkg = await fs.readdir(packagesDir);
        pkg.forEach(p => packages.push(`packages/${p}`));
      }
      
      return packages;
    } catch {
      return [];
    }
  }

  /**
   * Detect packages in Nx
   */
  private async detectNxPackages(): Promise<string[]> {
    try {
      const nxJsonPath = path.join(this.pathHandler.getProjectRoot(), 'nx.json');
      const nxJson = JSON.parse(await fs.readFile(nxJsonPath, 'utf-8'));
      
      // Nx projects can be in various locations
      const packages: string[] = [];
      
      // Check common locations
      const commonDirs = ['apps', 'libs', 'packages'];
      for (const dir of commonDirs) {
        const dirPath = path.join(this.pathHandler.getProjectRoot(), dir);
        if (await this.pathHandler.exists(dirPath)) {
          const items = await fs.readdir(dirPath);
          items.forEach(item => packages.push(`${dir}/${item}`));
        }
      }
      
      return packages;
    } catch {
      return [];
    }
  }

  /**
   * Detect packages in pnpm workspaces
   */
  private async detectPnpmPackages(): Promise<string[]> {
    try {
      const workspacePath = path.join(this.pathHandler.getProjectRoot(), 'pnpm-workspace.yaml');
      const content = await fs.readFile(workspacePath, 'utf-8');
      
      const packages: string[] = [];
      
      // Parse pnpm-workspace.yaml (YAML format)
      // Simple regex-based parsing for common patterns
      const packageMatches = content.match(/['"]([^'"]+)['"]/g);
      if (packageMatches) {
        packageMatches.forEach(match => {
          const packagePath = match.replace(/['"]/g, '');
          if (packagePath.includes('apps/')) {
            packages.push(packagePath);
          }
          if (packagePath.includes('packages/')) {
            packages.push(packagePath);
          }
        });
      }
      
      return packages;
    } catch {
      return [];
    }
  }

  /**
   * Expand workspace globs to actual package paths
   */
  private async expandWorkspaceGlobs(workspaces: string | string[]): Promise<string[]> {
    const globs = Array.isArray(workspaces) ? workspaces : [workspaces];
    const packages: string[] = [];
    
    for (const glob of globs) {
      // Handle simple patterns like 'apps/*', 'packages/*'
      if (glob.includes('*')) {
        const dir = glob.replace('/*', '');
        const dirPath = path.join(this.pathHandler.getProjectRoot(), dir);
        
        if (await this.pathHandler.exists(dirPath)) {
          const items = await fs.readdir(dirPath);
          for (const item of items) {
            const itemPath = path.join(dirPath, item);
            // Check if it's a directory with package.json
            if (require('fs').statSync(itemPath).isDirectory() && 
                await this.pathHandler.exists(path.join(itemPath, 'package.json'))) {
              packages.push(`${dir}/${item}`);
            }
          }
        }
      } else {
        // Direct path
        packages.push(glob);
      }
    }
    
    return packages;
  }

  /**
   * Read package.json
   */
  private async readPackageJson(): Promise<any> {
    const packageJsonPath = path.join(this.pathHandler.getProjectRoot(), 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  }
}

// Monorepo structure interface
export interface MonorepoStructure {
  isMonorepo: boolean;
  tool: 'turborepo' | 'nx' | 'pnpm-workspaces' | 'yarn-workspaces' | 'none';
  packages: string[];
  rootDir: string;
}
