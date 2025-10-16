/**
 * Genome Detector Service
 *
 * Analyzes existing projects and reconstructs their architecture
 * to generate TypeScript genome files
 */
import { readFile, readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { Logger } from '../infrastructure/logging/logger.js';
import { DynamicConnectorResolver } from '../connector/dynamic-connector-resolver.js';
export class GenomeDetector {
    logger;
    constructor() {
        this.logger = new Logger();
    }
    /**
     * Analyze a project and detect its genome
     */
    async analyzeProject(projectPath) {
        Logger.info(`🔍 Analyzing project: ${projectPath}`);
        try {
            // 1. Analyze project structure and dependencies
            const analysis = await this.analyzeProjectStructure(projectPath);
            // 2. Detect framework
            const framework = this.detectFramework(analysis);
            // 3. Detect adapters
            const adapters = this.detectAdapters(analysis);
            // 4. Detect integrators
            const integrators = await this.detectIntegrators(analysis, adapters);
            // 5. Detect features
            const features = this.detectFeatures(analysis, adapters, integrators);
            // 6. Calculate confidence
            const confidence = this.calculateConfidence(analysis, adapters, integrators, features);
            // 7. Generate warnings
            const warnings = this.generateWarnings(analysis, adapters, integrators, features);
            const detectedGenome = {
                project: {
                    name: analysis.packageJson.name || basename(projectPath),
                    description: analysis.packageJson.description || 'Detected project',
                    version: analysis.packageJson.version || '1.0.0',
                    framework: framework.id
                },
                modules: {
                    adapters: adapters,
                    integrators: integrators,
                    features: features
                },
                confidence,
                analysis: {
                    filesAnalyzed: analysis.files.length,
                    dependenciesFound: Object.keys(analysis.packageJson.dependencies || {}).length,
                    patternsMatched: analysis.patterns.length,
                    warnings
                }
            };
            Logger.info(`✅ Analysis complete. Confidence: ${confidence}%`);
            return detectedGenome;
        }
        catch (error) {
            Logger.error(`❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    /**
     * Analyze project structure and extract information
     */
    async analyzeProjectStructure(projectPath) {
        const analysis = {
            packageJson: {},
            files: [],
            imports: [],
            configFiles: {},
            patterns: []
        };
        try {
            // Read package.json
            const packageJsonPath = join(projectPath, 'package.json');
            try {
                const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
                analysis.packageJson = JSON.parse(packageJsonContent);
            }
            catch (error) {
                Logger.warn('No package.json found');
            }
            // Scan files recursively
            await this.scanFiles(projectPath, analysis);
            // Load config files
            await this.loadConfigFiles(projectPath, analysis);
            return analysis;
        }
        catch (error) {
            Logger.error(`Failed to analyze project structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    /**
     * Recursively scan files in project
     */
    async scanFiles(dirPath, analysis) {
        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                // Skip node_modules, .git, and other common directories
                if (this.shouldSkipDirectory(entry.name)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    await this.scanFiles(fullPath, analysis);
                }
                else {
                    analysis.files.push(fullPath);
                    // Extract imports from TypeScript/JavaScript files
                    if (this.isCodeFile(entry.name)) {
                        await this.extractImports(fullPath, analysis);
                    }
                }
            }
        }
        catch (error) {
            // Ignore permission errors
            if (error instanceof Error && !error.message.includes('EACCES')) {
                Logger.warn(`Failed to scan directory ${dirPath}: ${error.message}`);
            }
        }
    }
    /**
     * Extract imports from code files
     */
    async extractImports(filePath, analysis) {
        try {
            const content = await readFile(filePath, 'utf-8');
            // Extract import statements
            const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                if (match[1]) {
                    analysis.imports.push(match[1]);
                }
            }
            // Extract require statements
            const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
            while ((match = requireRegex.exec(content)) !== null) {
                if (match[1]) {
                    analysis.imports.push(match[1]);
                }
            }
        }
        catch (error) {
            // Ignore file read errors
        }
    }
    /**
     * Load configuration files
     */
    async loadConfigFiles(projectPath, analysis) {
        const configFiles = [
            'tsconfig.json',
            'next.config.js',
            'next.config.ts',
            'tailwind.config.js',
            'tailwind.config.ts',
            'drizzle.config.ts',
            'prisma/schema.prisma',
            'vitest.config.ts',
            'jest.config.js',
            'eslint.config.js',
            '.eslintrc.js',
            'prettier.config.js'
        ];
        for (const configFile of configFiles) {
            try {
                const configPath = join(projectPath, configFile);
                const content = await readFile(configPath, 'utf-8');
                if (configFile.endsWith('.json')) {
                    analysis.configFiles[configFile] = JSON.parse(content);
                }
                else {
                    analysis.configFiles[configFile] = content;
                }
            }
            catch (error) {
                // Config file doesn't exist, continue
            }
        }
    }
    /**
     * Detect framework from analysis
     */
    detectFramework(analysis) {
        const dependencies = analysis.packageJson.dependencies || {};
        const devDependencies = analysis.packageJson.devDependencies || {};
        const allDeps = { ...dependencies, ...devDependencies };
        // Next.js detection
        if (allDeps.next) {
            const hasAppRouter = analysis.files.some(f => f.includes('/app/'));
            const hasPagesRouter = analysis.files.some(f => f.includes('/pages/'));
            const hasTailwind = allDeps.tailwindcss || analysis.configFiles['tailwind.config.js'] || analysis.configFiles['tailwind.config.ts'];
            return {
                id: 'framework/nextjs',
                confidence: 95,
                parameters: {
                    appRouter: hasAppRouter,
                    pagesRouter: hasPagesRouter,
                    tailwind: !!hasTailwind,
                    typescript: !!allDeps.typescript
                },
                evidence: [
                    `next@${allDeps.next}`,
                    hasAppRouter ? 'App Router detected' : 'Pages Router detected',
                    hasTailwind ? 'Tailwind CSS detected' : 'No Tailwind CSS'
                ],
                version: allDeps.next
            };
        }
        // React detection
        if (allDeps.react && !allDeps.next) {
            return {
                id: 'framework/react',
                confidence: 80,
                parameters: {
                    typescript: !!allDeps.typescript
                },
                evidence: [`react@${allDeps.react}`],
                version: allDeps.react
            };
        }
        // Vue detection
        if (allDeps.vue) {
            return {
                id: 'framework/vue',
                confidence: 85,
                parameters: {
                    typescript: !!allDeps.typescript
                },
                evidence: [`vue@${allDeps.vue}`],
                version: allDeps.vue
            };
        }
        // Svelte detection
        if (allDeps.svelte) {
            return {
                id: 'framework/svelte',
                confidence: 85,
                parameters: {
                    typescript: !!allDeps.typescript
                },
                evidence: [`svelte@${allDeps.svelte}`],
                version: allDeps.svelte
            };
        }
        // Default to generic
        return {
            id: 'framework/generic',
            confidence: 30,
            parameters: {},
            evidence: ['No specific framework detected']
        };
    }
    /**
     * Detect adapters from analysis
     */
    detectAdapters(analysis) {
        const adapters = [];
        const dependencies = analysis.packageJson.dependencies || {};
        const devDependencies = analysis.packageJson.devDependencies || {};
        const allDeps = { ...dependencies, ...devDependencies };
        // Database adapters
        if (allDeps.drizzle) {
            adapters.push({
                id: 'database/drizzle',
                confidence: 90,
                parameters: {
                    provider: this.detectDatabaseProvider(analysis),
                    migrations: analysis.files.some(f => f.includes('drizzle/'))
                },
                evidence: [`drizzle@${allDeps.drizzle}`, 'Drizzle config detected'],
                version: allDeps.drizzle
            });
        }
        if (allDeps.prisma) {
            adapters.push({
                id: 'database/prisma',
                confidence: 90,
                parameters: {
                    provider: this.detectDatabaseProvider(analysis)
                },
                evidence: [`prisma@${allDeps.prisma}`, 'Prisma schema detected'],
                version: allDeps.prisma
            });
        }
        // UI adapters
        if (allDeps['@radix-ui/react-slot'] || analysis.imports.some(i => i.includes('@radix-ui'))) {
            adapters.push({
                id: 'ui/shadcn-ui',
                confidence: 85,
                parameters: {
                    components: this.detectShadcnComponents(analysis)
                },
                evidence: ['Radix UI components detected', 'Shadcn/UI pattern detected']
            });
        }
        if (allDeps['@mui/material']) {
            adapters.push({
                id: 'ui/mui',
                confidence: 90,
                parameters: {},
                evidence: [`@mui/material@${allDeps['@mui/material']}`],
                version: allDeps['@mui/material']
            });
        }
        // Auth adapters
        if (allDeps['better-auth']) {
            adapters.push({
                id: 'auth/better-auth',
                confidence: 90,
                parameters: {},
                evidence: [`better-auth@${allDeps['better-auth']}`],
                version: allDeps['better-auth']
            });
        }
        if (allDeps['next-auth']) {
            adapters.push({
                id: 'auth/next-auth',
                confidence: 90,
                parameters: {},
                evidence: [`next-auth@${allDeps['next-auth']}`],
                version: allDeps['next-auth']
            });
        }
        // Payment adapters
        if (allDeps.stripe) {
            adapters.push({
                id: 'payment/stripe',
                confidence: 90,
                parameters: {},
                evidence: [`stripe@${allDeps.stripe}`],
                version: allDeps.stripe
            });
        }
        // Testing adapters
        if (allDeps.vitest) {
            adapters.push({
                id: 'testing/vitest',
                confidence: 90,
                parameters: {},
                evidence: [`vitest@${allDeps.vitest}`],
                version: allDeps.vitest
            });
        }
        if (allDeps.jest) {
            adapters.push({
                id: 'testing/jest',
                confidence: 90,
                parameters: {},
                evidence: [`jest@${allDeps.jest}`],
                version: allDeps.jest
            });
        }
        // Data fetching adapters
        if (allDeps['@tanstack/react-query']) {
            adapters.push({
                id: 'data-fetching/tanstack-query',
                confidence: 90,
                parameters: {},
                evidence: [`@tanstack/react-query@${allDeps['@tanstack/react-query']}`],
                version: allDeps['@tanstack/react-query']
            });
        }
        // State management adapters
        if (allDeps.zustand) {
            adapters.push({
                id: 'state/zustand',
                confidence: 90,
                parameters: {},
                evidence: [`zustand@${allDeps.zustand}`],
                version: allDeps.zustand
            });
        }
        return adapters;
    }
    /**
     * Detect integrators from analysis using dynamic connector resolution
     */
    async detectIntegrators(analysis, adapters) {
        const integrators = [];
        try {
            // Convert adapters to modules for connector resolution
            const currentModules = adapters.map(adapter => ({
                id: adapter.id,
                category: this.extractCategoryFromAdapterId(adapter.id),
                parameters: adapter.parameters || {},
                features: {},
                externalFiles: [],
                config: undefined
            }));
            // Use dynamic connector resolver
            const connectorResolver = new DynamicConnectorResolver();
            const connectorMatches = await connectorResolver.findMatchingConnectors(currentModules);
            // Convert matches to DetectedAdapter format
            for (const match of connectorMatches) {
                integrators.push({
                    id: match.connectorId,
                    confidence: match.confidence,
                    parameters: match.parameters,
                    evidence: match.evidence
                });
            }
            Logger.info(`🎯 Dynamic connector resolution found ${integrators.length} connectors`, {
                connectors: integrators.map(i => i.id)
            });
        }
        catch (error) {
            Logger.warn(`Failed to resolve connectors dynamically: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Fallback to empty array if dynamic resolution fails
        }
        return integrators;
    }
    /**
     * Extract category from adapter ID
     */
    extractCategoryFromAdapterId(adapterId) {
        const parts = adapterId.split('/');
        return parts[0] || 'unknown';
    }
    /**
     * Detect features from analysis
     */
    detectFeatures(analysis, adapters, integrators) {
        const features = [];
        const adapterIds = adapters.map(a => a.id);
        // Auth features
        if (adapterIds.includes('auth/better-auth') && adapterIds.includes('ui/shadcn-ui')) {
            features.push({
                id: 'features/auth-ui/shadcn',
                confidence: 80,
                parameters: {},
                evidence: ['Auth UI components detected']
            });
        }
        // Dashboard features
        if (analysis.files.some(f => f.includes('dashboard') || f.includes('admin'))) {
            features.push({
                id: 'features/admin-dashboard/nextjs-shadcn',
                confidence: 70,
                parameters: {},
                evidence: ['Dashboard/admin pages detected']
            });
        }
        // API features
        if (analysis.files.some(f => f.includes('/api/') || f.includes('/routes/'))) {
            features.push({
                id: 'features/api-routes/nextjs',
                confidence: 85,
                parameters: {},
                evidence: ['API routes detected']
            });
        }
        return features;
    }
    /**
     * Detect database provider
     */
    detectDatabaseProvider(analysis) {
        const envVars = analysis.packageJson.scripts || {};
        const scripts = Object.values(envVars).join(' ');
        if (scripts.includes('postgres') || analysis.imports.some(i => i.includes('postgres'))) {
            return 'postgresql';
        }
        if (scripts.includes('mysql') || analysis.imports.some(i => i.includes('mysql'))) {
            return 'mysql';
        }
        if (scripts.includes('sqlite') || analysis.imports.some(i => i.includes('sqlite'))) {
            return 'sqlite';
        }
        return 'postgresql'; // Default
    }
    /**
     * Detect Shadcn components
     */
    detectShadcnComponents(analysis) {
        const components = [];
        const componentFiles = analysis.files.filter(f => f.includes('/components/ui/'));
        for (const file of componentFiles) {
            const componentName = basename(file, extname(file));
            components.push(componentName);
        }
        return components;
    }
    /**
     * Calculate overall confidence
     */
    calculateConfidence(analysis, adapters, integrators, features) {
        const adapterConfidence = adapters.reduce((sum, a) => sum + a.confidence, 0) / Math.max(adapters.length, 1);
        const integratorConfidence = integrators.reduce((sum, i) => sum + i.confidence, 0) / Math.max(integrators.length, 1);
        const featureConfidence = features.reduce((sum, f) => sum + f.confidence, 0) / Math.max(features.length, 1);
        return Math.round((adapterConfidence + integratorConfidence + featureConfidence) / 3);
    }
    /**
     * Generate warnings
     */
    generateWarnings(analysis, adapters, integrators, features) {
        const warnings = [];
        if (analysis.files.length < 10) {
            warnings.push('Very few files detected - analysis may be incomplete');
        }
        if (Object.keys(analysis.packageJson.dependencies || {}).length === 0) {
            warnings.push('No dependencies found - project may not be fully analyzed');
        }
        if (adapters.length === 0) {
            warnings.push('No adapters detected - project may use unrecognized technologies');
        }
        return warnings;
    }
    /**
     * Check if directory should be skipped
     */
    shouldSkipDirectory(name) {
        const skipDirs = [
            'node_modules',
            '.git',
            '.next',
            '.nuxt',
            'dist',
            'build',
            'coverage',
            '.vscode',
            '.idea',
            'logs'
        ];
        return skipDirs.includes(name) || name.startsWith('.');
    }
    /**
     * Check if file is a code file
     */
    isCodeFile(name) {
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
        return codeExtensions.includes(extname(name));
    }
}
//# sourceMappingURL=genome-detector.js.map