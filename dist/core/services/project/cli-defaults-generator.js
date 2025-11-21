/**
 * CLI Defaults Generator
 *
 * Generates universal defaults that work for any project:
 * - .gitignore
 * - Root tsconfig.json
 * - Basic package.json scripts
 *
 * These are CLI-generated (not marketplace modules) because they're universal.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../infrastructure/logging/index.js';
export class CliDefaultsGenerator {
    /**
     * Generate all universal CLI defaults
     *
     * V2 COMPLIANCE: Accepts framework and recipe books for framework-specific scripts
     */
    static async generateDefaults(projectRoot, projectName, structure, framework, recipeBooks) {
        Logger.info('📝 Generating CLI defaults...', {
            projectRoot,
            structure,
            framework
        });
        await this.generateGitignore(projectRoot);
        await this.generateRootTsconfig(projectRoot, structure);
        await this.generatePackageJsonScripts(projectRoot, structure, framework, recipeBooks);
        Logger.info('✅ CLI defaults generated');
    }
    /**
     * Generate .gitignore (universal)
     */
    static async generateGitignore(projectRoot) {
        const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.expo/
.turbo/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.temp/
`;
        const gitignorePath = path.join(projectRoot, '.gitignore');
        // Check if .gitignore already exists
        try {
            await fs.access(gitignorePath);
            Logger.debug('.gitignore already exists, skipping');
            return;
        }
        catch {
            // File doesn't exist, create it
        }
        await fs.writeFile(gitignorePath, gitignore);
        Logger.debug('✅ Generated .gitignore');
    }
    /**
     * Generate root tsconfig.json (universal base)
     */
    static async generateRootTsconfig(projectRoot, structure) {
        const tsconfig = {
            compilerOptions: {
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                isolatedModules: true,
                incremental: true,
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'bundler',
                lib: ['ES2022']
            },
            exclude: ['node_modules', 'dist', 'build', '.turbo']
        };
        const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
        // Check if tsconfig.json already exists
        try {
            await fs.access(tsconfigPath);
            Logger.debug('tsconfig.json already exists, skipping');
            return;
        }
        catch {
            // File doesn't exist, create it
        }
        await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        Logger.debug('✅ Generated tsconfig.json');
    }
    /**
     * Generate basic package.json scripts (universal)
     *
     * V2 COMPLIANCE: For monorepo, uses 'turbo' (monorepo tool, not framework-specific).
     * For single-app, framework scripts should come from framework adapter.
     *
     * @param projectRoot - Project root directory
     * @param structure - Project structure ('monorepo' | 'single-app')
     * @param framework - Optional framework name for single-app (to get framework-specific scripts)
     * @param recipeBooks - Optional recipe books for framework scripts
     */
    static async generatePackageJsonScripts(projectRoot, structure, framework, recipeBooks) {
        const pkgPath = path.join(projectRoot, 'package.json');
        // Read existing package.json
        let pkg;
        try {
            const content = await fs.readFile(pkgPath, 'utf8');
            pkg = JSON.parse(content);
        }
        catch {
            // Package.json doesn't exist, create minimal one
            pkg = {
                name: path.basename(projectRoot),
                version: '1.0.0',
                private: true
            };
        }
        // Add basic scripts if not present
        const scripts = (pkg.scripts && typeof pkg.scripts === 'object' && !Array.isArray(pkg.scripts))
            ? pkg.scripts
            : {};
        pkg.scripts = scripts;
        if (structure === 'monorepo') {
            // Monorepo scripts are tool-specific (turborepo), not framework-specific
            // This is OK - turborepo is the monorepo tool, not a framework
            if (!scripts.dev) {
                scripts.dev = 'turbo run dev';
            }
            if (!scripts.build) {
                scripts.build = 'turbo run build';
            }
            if (!scripts.lint) {
                scripts.lint = 'turbo run lint';
            }
        }
        else {
            // Single-app: Framework scripts should come from framework adapter
            // V2 COMPLIANCE: Try to get from recipe book first
            if (framework && recipeBooks && recipeBooks.size > 0) {
                const frameworkScripts = this.getFrameworkScriptsFromRecipeBook(framework, recipeBooks);
                if (frameworkScripts && Object.keys(frameworkScripts).length > 0) {
                    // Merge scripts, don't overwrite existing
                    for (const [key, value] of Object.entries(frameworkScripts)) {
                        if (!scripts[key]) {
                            scripts[key] = value;
                        }
                    }
                    pkg.scripts = scripts;
                    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
                    Logger.debug('✅ Updated package.json scripts from recipe book');
                    return;
                }
            }
            // V2 VIOLATION: Fallback hardcodes Next.js
            // TODO: Get framework from genome and use framework adapter
            Logger.warn(`Using fallback Next.js scripts for single-app. ` +
                `Framework scripts should come from framework adapter or recipe book.`, { structure, framework });
            if (!scripts.dev) {
                scripts.dev = 'next dev';
            }
            if (!scripts.build) {
                scripts.build = 'next build';
            }
            if (!scripts.lint) {
                scripts.lint = 'next lint';
            }
        }
        await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
        Logger.debug('✅ Updated package.json scripts');
    }
    /**
     * Get framework scripts from recipe book
     */
    static getFrameworkScriptsFromRecipeBook(framework, recipeBooks) {
        // Search all recipe books for framework scripts
        for (const recipeBook of Array.from(recipeBooks.values())) {
            // Check if recipe book has a frameworks section
            // Recipe books don't have frameworks section yet
            // TODO: Add frameworks section to recipe book for framework scripts
            // For now, return null to use fallback
        }
        return null;
    }
}
//# sourceMappingURL=cli-defaults-generator.js.map