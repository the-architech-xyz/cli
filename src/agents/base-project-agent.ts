/**
 * Base Project Agent - Project Foundation Orchestrator
 * 
 * Handles the initial project setup and structure creation.
 * This is the first agent that runs in the orchestration process.
 */

import { AbstractAgent } from './base/abstract-agent.js';
import { AgentContext, AgentResult, AgentMetadata, AgentCapability, AgentCategory, CapabilityCategory, ValidationResult, Artifact, ValidationError } from '../types/agents.js';
import { ProjectContext, TechRecommendation } from '../types/smart-questions.js';
import { structureService, StructureInfo } from '../core/project/structure-service.js';
import { CommandRunner } from '../core/cli/command-runner.js';
import { Logger } from '../core/cli/logger.js';
import { TemplateService, templateService } from '../core/templates/template-service.js';
import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';

export class BaseProjectAgent extends AbstractAgent {
  private runner: CommandRunner;
  private templateService: TemplateService;

  constructor() {
    super();
    this.runner = new CommandRunner();
    this.templateService = templateService;
  }

  // ============================================================================
  // AGENT METADATA
  // ============================================================================

  protected getAgentMetadata(): AgentMetadata {
    return {
      name: 'Base Project Agent',
      version: '1.0.0',
      description: 'Creates project foundation and basic structure',
      author: 'The Architech Team',
      category: AgentCategory.FOUNDATION,
      tags: ['project', 'foundation', 'structure', 'setup'],
      dependencies: [],
      requirements: []
    };
  }

  protected getAgentCapabilities(): AgentCapability[] {
    return [
      {
        id: 'project-structure',
        name: 'Project Structure Creation',
        description: 'Creates the basic project directory structure',
        category: CapabilityCategory.FOUNDATION,
        requirements: [],
        conflicts: []
      },
      {
        id: 'package-init',
        name: 'Package Initialization',
        description: 'Initializes package.json and basic configuration',
        category: CapabilityCategory.FOUNDATION,
        requirements: [],
        conflicts: []
      },
      {
        id: 'git-init',
        name: 'Git Initialization',
        description: 'Initializes Git repository and basic configuration',
        category: CapabilityCategory.FOUNDATION,
        requirements: [],
        conflicts: []
      }
    ];
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  async validate(context: AgentContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: string[] = [];

    // Check if project directory can be created
    if (await fsExtra.pathExists(context.projectPath)) {
      warnings.push(`Project directory already exists: ${context.projectPath}`);
    }

    // Check if project name is valid
    if (!context.projectName || context.projectName.length === 0) {
      errors.push({
        field: 'projectName',
        message: 'Project name is required',
        code: 'MISSING_PROJECT_NAME',
        severity: 'error'
      });
    }

    // Check if project structure is valid
    const structure = context.projectStructure;
    if (structure && structure.type === 'monorepo') {
      if (!structure.modules || structure.modules.length === 0) {
        warnings.push('Monorepo structure specified but no modules defined');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // CORE EXECUTION
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting base project setup...');

      // Step 1: Create project directory structure
      await this.createProjectStructure(context);

      // Step 2: Initialize package.json
      await this.initializePackageJson(context);

      // Step 3: Initialize Git repository (if not skipped)
      if (!context.options.skipGit) {
        await this.initializeGit(context);
      }

      // Step 4: Create basic configuration files
      await this.createBasicConfigs(context);

      // Step 5: Create README and documentation
      await this.createDocumentation(context);

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          projectPath: context.projectPath,
          projectName: context.projectName,
          structure: 'monorepo'
        },
        artifacts: [
          {
            type: 'directory',
            path: context.projectPath,
            description: 'Project root directory'
          },
          {
            type: 'file',
            path: path.join(context.projectPath, 'package.json'),
            description: 'Root package.json'
          },
          {
            type: 'file',
            path: path.join(context.projectPath, 'README.md'),
            description: 'Project README'
          }
        ],
        warnings: [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(
        'BASE_PROJECT_SETUP_FAILED',
        `Base project setup failed: ${errorMessage}`,
        [],
        startTime,
        error
      );
    }
  }

  // ============================================================================
  // PROJECT STRUCTURE CREATION
  // ============================================================================

  private async createProjectStructure(context: AgentContext): Promise<void> {
    context.logger.info('Creating project directory structure...');

    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;

    // Create root directory
    await fsExtra.ensureDir(projectPath);

    if (structure.isMonorepo) {
      // Monorepo structure
      await this.createMonorepoStructure(context);
    } else {
      // Single app structure
      await this.createSingleAppStructure(context);
    }

    context.logger.success('Project structure created successfully');
  }

  private async createMonorepoStructure(context: AgentContext): Promise<void> {
    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;
    const paths = structureService.getPaths(projectPath, structure);

    context.logger.info('Creating monorepo structure...');

    // Create root directories
    await fsExtra.ensureDir(path.join(projectPath, 'apps'));
    await fsExtra.ensureDir(path.join(projectPath, 'packages'));
    await fsExtra.ensureDir(path.join(projectPath, 'docs'));
    await fsExtra.ensureDir(path.join(projectPath, '.github', 'workflows'));

    // Create web app structure
    await fsExtra.ensureDir(paths.src);
    await fsExtra.ensureDir(paths.app);
    await fsExtra.ensureDir(paths.components);
    await fsExtra.ensureDir(paths.lib);
    await fsExtra.ensureDir(paths.types);
    await fsExtra.ensureDir(paths.public);

    // Create package directories
    for (const [pkgName, pkgPath] of Object.entries(paths.packages)) {
      await fsExtra.ensureDir(pkgPath);
    }

    context.logger.success('Monorepo structure created');
  }

  private async createSingleAppStructure(context: AgentContext): Promise<void> {
    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;
    const paths = structureService.getPaths(projectPath, structure, structure.template);

    context.logger.info('Creating single app structure...');

    // Framework-aware directory creation
    if (structure.template === 'nextjs-14' || structure.template === 'nextjs') {
      // Next.js App Router - create root directories
      await fsExtra.ensureDir(paths.app);
      await fsExtra.ensureDir(paths.components);
      await fsExtra.ensureDir(paths.lib);
      await fsExtra.ensureDir(paths.types);
      await fsExtra.ensureDir(paths.public);
    } else {
      // Other frameworks - create src structure
      await fsExtra.ensureDir(paths.src);
      await fsExtra.ensureDir(paths.app);
      await fsExtra.ensureDir(paths.components);
      await fsExtra.ensureDir(paths.lib);
      await fsExtra.ensureDir(paths.types);
      await fsExtra.ensureDir(paths.public);
    }
    
    await fsExtra.ensureDir(path.join(projectPath, '.github', 'workflows'));

    context.logger.success('Single app structure created');
  }

  // ============================================================================
  // PACKAGE INITIALIZATION
  // ============================================================================

  private async initializePackageJson(context: AgentContext): Promise<void> {
    context.logger.info('Initializing package.json...');

    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;

    if (structure.isMonorepo) {
      await this.createMonorepoPackageJson(context);
    } else {
      await this.createSingleAppPackageJson(context);
    }

    context.logger.success('Package.json initialized');
  }

  private async createMonorepoPackageJson(context: AgentContext): Promise<void> {
    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;

    const packageJson = {
      name: projectName,
      version: "0.1.0",
      private: true,
      workspaces: [
        "apps/*",
        "packages/*"
      ],
      scripts: {
        "build": "turbo run build",
        "dev": "turbo run dev",
        "lint": "turbo run lint",
        "test": "turbo run test",
        "typecheck": "turbo run typecheck",
        "clean": "turbo run clean",
        "format": "prettier --write \"**/*.{ts,tsx,md}\""
      },
      devDependencies: {
        "turbo": "^2.0.0",
        "prettier": "^3.0.0",
        "typescript": "^5.4.0"
      },
      packageManager: context.packageManager === 'bun' ? 'bun@1.0.0' : undefined
    };

    await fsExtra.writeJSON(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  }

  private async createSingleAppPackageJson(context: AgentContext): Promise<void> {
    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;

    const packageJson = {
      name: projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint",
        "typecheck": "tsc --noEmit"
      },
      dependencies: {
        "next": "^14.2.0",
        "react": "^18.3.0",
        "react-dom": "^18.3.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "@types/react": "^18.0.0",
        "@types/react-dom": "^18.0.0",
        "typescript": "^5.4.0"
      },
      packageManager: context.packageManager === 'bun' ? 'bun@1.0.0' : undefined
    };

    await fsExtra.writeJSON(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  }

  // ============================================================================
  // GIT INITIALIZATION
  // ============================================================================

  private async initializeGit(context: AgentContext): Promise<void> {
    context.logger.info('Initializing Git repository...');

    const { projectPath } = context;

    try {
      // Initialize Git repository
      await this.runner.exec('git', ['init'], projectPath);

      // Create .gitignore first
      await this.createGitignore(context);

      // Check if there are files to commit
      const hasFiles = await this.runner.exec('git', ['status', '--porcelain'], projectPath);
      
      if (hasFiles.stdout.trim()) {
        // Create initial commit only if there are files
        await this.runner.exec('git', ['add', '.'], projectPath);
        await this.runner.exec('git', ['commit', '-m', 'Initial commit - Generated by The Architech'], projectPath);
        context.logger.success('Git repository initialized with initial commit');
      } else {
        context.logger.info('No files to commit, skipping initial commit');
      }

    } catch (error) {
      context.logger.warn('Failed to initialize Git repository, continuing...');
    }
  }

  private async createGitignore(context: AgentContext): Promise<void> {
    const { projectPath } = context;

    const gitignore = `
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
build/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Turbo
.turbo

# TypeScript
*.tsbuildinfo
next-env.d.ts
`;

    await fsExtra.writeFile(path.join(projectPath, '.gitignore'), gitignore.trim());
  }

  // ============================================================================
  // BASIC CONFIGURATION FILES
  // ============================================================================

  private async createBasicConfigs(context: AgentContext): Promise<void> {
    context.logger.info('Creating basic configuration files...');

    const { projectPath } = context;
    const structure = context.projectStructure!;

    // Create TypeScript configuration
    await this.createTypeScriptConfig(context);

    // Create Turbo configuration for monorepo
    if (structure.isMonorepo) {
      await this.createTurboConfig(context);
    }

    // Create ESLint configuration
    await this.createESLintConfig(context);

    // Create Prettier configuration
    await this.createPrettierConfig(context);

    context.logger.success('Basic configuration files created');
  }

  private async createTypeScriptConfig(context: AgentContext): Promise<void> {
    const { projectPath } = context;
    const structure = context.projectStructure!;

    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        lib: ['dom', 'dom.iterable', 'es6'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next'
          }
        ],
        paths: structure.isMonorepo ? {
          '@/*': ['./src/*'],
          '@/ui/*': ['./packages/ui/*'],
          '@/db/*': ['./packages/db/*'],
          '@/auth/*': ['./packages/auth/*'],
          '@/config/*': ['./packages/config/*'],
          '@/utils/*': ['./packages/utils/*']
        } : {
          '@/*': ['./src/*']
        }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    };

    await fsExtra.writeJson(path.join(projectPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
  }

  private async createTurboConfig(context: AgentContext): Promise<void> {
    const { projectPath } = context;

    const turboConfig = {
      $schema: 'https://turbo.build/schema.json',
      globalDependencies: ['**/.env.*local'],
      pipeline: {
        build: {
          dependsOn: ['^build'],
          outputs: ['.next/**', '!.next/cache/**', 'dist/**']
        },
        lint: {
          dependsOn: ['^lint']
        },
        dev: {
          cache: false,
          persistent: true
        },
        test: {
          dependsOn: ['^build']
        },
        typecheck: {
          dependsOn: ['^typecheck']
        }
      }
    };

    await fsExtra.writeJson(path.join(projectPath, 'turbo.json'), turboConfig, { spaces: 2 });
  }

  private async createESLintConfig(context: AgentContext): Promise<void> {
    const { projectPath } = context;

    const eslintConfig = {
      extends: [
        'next/core-web-vitals',
        'eslint:recommended',
        '@typescript-eslint/recommended'
      ],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    };

    await fsExtra.writeJson(path.join(projectPath, '.eslintrc.json'), eslintConfig, { spaces: 2 });
  }

  private async createPrettierConfig(context: AgentContext): Promise<void> {
    const { projectPath } = context;

    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false
    };

    await fsExtra.writeJson(path.join(projectPath, '.prettierrc.json'), prettierConfig, { spaces: 2 });
  }

  // ============================================================================
  // DOCUMENTATION
  // ============================================================================

  private async createDocumentation(context: AgentContext): Promise<void> {
    context.logger.info('Creating documentation...');

    const { projectPath, projectName } = context;
    const structure = context.projectStructure!;

    const readme = `# ${projectName}

This project was generated by [The Architech](https://the-architech.dev) - Revolutionary AI-Powered Application Generator.

${structure.isMonorepo ? this.getMonorepoReadme() : this.getSingleAppReadme()}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Project Structure

${structure.isMonorepo ? this.getMonorepoStructure() : this.getSingleAppStructure()}

## Available Scripts

${structure.isMonorepo ? this.getMonorepoScripts() : this.getSingleAppScripts()}

## Learn More

To learn more about The Architech, check out the [documentation](https://the-architech.dev/docs).

## License

This project is licensed under the MIT License.
`;

    await fsExtra.writeFile(path.join(projectPath, 'README.md'), readme);
    context.logger.success('Documentation created');
  }

  private getMonorepoReadme(): string {
    return `
## About This Monorepo

This is a scalable monorepo built with Turborepo, featuring:

- **Apps**: Individual applications (web, admin, docs)
- **Packages**: Shared libraries and configurations
- **Turbo**: Fast, incremental builds and caching
- **TypeScript**: Full type safety across the monorepo
`;
  }

  private getSingleAppReadme(): string {
    return `
## About This Application

This is a modern web application built with:

- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful component library
`;
  }

  private getMonorepoStructure(): string {
    return `
\`\`\`
packages/
├── apps/                 # Applications
│   ├── web/             # Main web application
│   ├── admin/           # Admin dashboard
│   └── docs/            # Documentation site
├── packages/            # Shared packages
│   ├── ui/              # UI components
│   ├── db/              # Database schemas
│   ├── auth/            # Authentication
│   ├── config/          # Shared configurations
│   └── utils/           # Common utilities
├── docs/                # Project documentation
├── scripts/             # Build and utility scripts
└── config/              # Global configuration
\`\`\`
`;
  }

  private getSingleAppStructure(): string {
    return `
\`\`\`
src/
├── app/             # Next.js App Router
├── components/      # React components
├── lib/             # Utility functions
└── types/           # TypeScript types
├── public/          # Static assets
└── config/          # Configuration files
\`\`\`
`;
  }

  private getMonorepoScripts(): string {
    return `
- \`npm run dev\` - Start all development servers
- \`npm run build\` - Build all applications and packages
- \`npm run lint\` - Lint all code
- \`npm run test\` - Run tests across all packages
- \`npm run typecheck\` - Type check all TypeScript code
`;
  }

  private getSingleAppScripts(): string {
    return `
- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Lint code
- \`npm run typecheck\` - Type check TypeScript code
`;
  }
} 