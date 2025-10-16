/**
 * Genome Resolver Service
 *
 * Main service for resolving genome shorthands to actual file paths.
 * Supports multiple resolution strategies with fallback chain.
 *
 * Resolution order:
 * 1. Check if input is already a file path → use directly
 * 2. Try local marketplace (../marketplace/genomes/official/)
 * 3. Try NPM package (@architech/marketplace)
 * 4. Try custom sources (from config)
 * 5. Throw helpful error with suggestions
 */
import * as fs from 'fs/promises';
import * as path from 'path';
export class GenomeResolver {
    config;
    cache = new Map();
    strategies = [];
    /**
     * Default aliases mapping user-friendly names to actual file names
     */
    DEFAULT_ALIASES = {
        // Primary aliases
        'hello-world': '01-hello-world',
        'minimal': '01-hello-world',
        'blog': '02-modern-blog',
        'blog-starter': '02-modern-blog',
        'saas': '03-full-saas-platform',
        'saas-starter': '03-full-saas-platform',
        'full-saas': '03-full-saas-platform',
        'ai-app': '04-ai-powered-app',
        'ai-chat': '04-ai-powered-app',
        'ai-powered': '04-ai-powered-app',
        'web3': '05-web3-dapp',
        'dapp': '05-web3-dapp',
        'blockchain': '05-web3-dapp',
        'showcase': '06-ultimate-showcase',
        'ultimate': '06-ultimate-showcase',
        'demo': '06-ultimate-showcase',
    };
    constructor(config) {
        this.config = config;
        // Strategies will be registered dynamically
    }
    /**
     * Register a resolution strategy
     */
    registerStrategy(strategy) {
        this.strategies.push(strategy);
    }
    /**
     * Main resolution method
     * Tries all strategies in order until one succeeds
     */
    async resolve(input, options) {
        // Validate input
        if (!input || input.trim() === '') {
            throw new Error('Genome input cannot be empty');
        }
        const trimmedInput = input.trim();
        // Check cache first (unless skipCache is true)
        if (!options?.skipCache && this.cache.has(trimmedInput)) {
            if (options?.verbose) {
                console.log(`📦 Using cached resolution for: ${trimmedInput}`);
            }
            return this.cache.get(trimmedInput);
        }
        // Try each strategy in order
        for (const strategy of this.strategies) {
            try {
                if (options?.verbose) {
                    console.log(`🔍 Trying strategy: ${strategy.name}`);
                }
                const resolved = await strategy.resolve(trimmedInput);
                if (resolved) {
                    if (options?.verbose) {
                        console.log(`✅ Resolved via ${strategy.name}: ${resolved.path}`);
                    }
                    // Cache successful resolution
                    this.cache.set(trimmedInput, resolved);
                    return resolved;
                }
            }
            catch (error) {
                // Strategy failed, try next one
                if (options?.verbose) {
                    console.log(`  ✗ ${strategy.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                continue;
            }
        }
        // No strategy succeeded - throw helpful error
        throw this.createNotFoundError(trimmedInput, options);
    }
    /**
     * Check if input looks like a file path
     */
    looksLikeFilePath(input) {
        return input.includes('/') ||
            input.includes('\\') ||
            input.endsWith('.genome.ts') ||
            input.endsWith('.ts') ||
            input.startsWith('.') ||
            input.startsWith('~') ||
            path.isAbsolute(input);
    }
    /**
     * Normalize genome name using aliases
     */
    normalizeGenomeName(name) {
        const normalized = name.toLowerCase().replace(/\s+/g, '-');
        // Check user-defined aliases from config
        if (this.config?.genomeAliases?.[normalized]) {
            return this.config.genomeAliases[normalized];
        }
        // Check default aliases
        return this.DEFAULT_ALIASES[normalized] || normalized;
    }
    /**
     * Extract metadata from genome file without executing it
     */
    async extractMetadata(genomePath) {
        try {
            const content = await fs.readFile(genomePath, 'utf-8');
            // Extract from comment header
            const versionMatch = content.match(/\* (?:Stack|Version): (.+)/);
            const descMatch = content.match(/\* \n \* (.+)/);
            const frameworkMatch = content.match(/framework:\s*['"](\w+)['"]/);
            // Count modules (look for id: patterns)
            const moduleMatches = content.match(/\{\s*\n?\s*id:/g);
            const moduleCount = moduleMatches?.length || 0;
            // Determine complexity
            let complexity = 'simple';
            if (moduleCount > 8)
                complexity = 'advanced';
            else if (moduleCount > 3)
                complexity = 'intermediate';
            // Extract tags from module IDs
            const tags = new Set();
            const moduleIdMatches = Array.from(content.matchAll(/id:\s*['"]([^'"]+)['"]/g));
            for (const match of moduleIdMatches) {
                const category = match[1]?.split('/')[0];
                if (category)
                    tags.add(category);
            }
            return {
                version: versionMatch?.[1] || '1.0.0',
                description: descMatch?.[1] || 'No description available',
                framework: frameworkMatch?.[1] || 'nextjs',
                moduleCount,
                complexity,
                tags: Array.from(tags),
                estimatedTime: this.estimateGenerationTime(moduleCount)
            };
        }
        catch (error) {
            // If metadata extraction fails, return defaults
            return {
                version: '1.0.0',
                description: '',
                framework: 'unknown',
                moduleCount: 0,
                complexity: 'simple',
                tags: []
            };
        }
    }
    /**
     * Estimate generation time based on module count
     */
    estimateGenerationTime(moduleCount) {
        if (moduleCount <= 3)
            return '~30 seconds';
        if (moduleCount <= 6)
            return '~1 minute';
        if (moduleCount <= 10)
            return '~2 minutes';
        return '~3-5 minutes';
    }
    /**
     * Find similar genome names for suggestions
     */
    async findSimilarGenomes(input) {
        const allAliases = Object.keys(this.DEFAULT_ALIASES);
        const lowerInput = input.toLowerCase();
        // Find matches by substring
        const matches = allAliases.filter(alias => alias.includes(lowerInput) ||
            lowerInput.includes(alias) ||
            this.levenshteinDistance(alias, lowerInput) <= 3);
        // Return top 5 matches
        return matches.slice(0, 5);
    }
    /**
     * Simple Levenshtein distance for fuzzy matching
     */
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[b.length][a.length];
    }
    /**
     * Get all available genomes from all sources
     */
    async getAvailableGenomes() {
        const genomes = new Set();
        // Add all default aliases
        Object.keys(this.DEFAULT_ALIASES).forEach(alias => genomes.add(alias));
        // Add config aliases
        if (this.config?.genomeAliases) {
            Object.keys(this.config.genomeAliases).forEach(alias => genomes.add(alias));
        }
        return Array.from(genomes).sort();
    }
    /**
     * Create helpful error when genome not found
     */
    async createNotFoundError(input, options) {
        const suggestions = await this.findSimilarGenomes(input);
        const available = await this.getAvailableGenomes();
        const sourcesChecked = this.strategies.map(s => s.name);
        let errorMessage = `❌ Genome not found: "${input}"\n\n`;
        errorMessage += `🔍 Searched in:\n`;
        sourcesChecked.forEach(source => {
            errorMessage += `  ✗ ${source}\n`;
        });
        if (suggestions.length > 0) {
            errorMessage += `\n💡 Did you mean one of these?\n`;
            suggestions.forEach(s => {
                errorMessage += `  • architech new my-app --genome ${s}\n`;
            });
        }
        errorMessage += `\n📖 Available genomes:\n`;
        available.slice(0, 10).forEach(g => {
            errorMessage += `  • ${g}\n`;
        });
        if (available.length > 10) {
            errorMessage += `  ... and ${available.length - 10} more\n`;
        }
        errorMessage += `\n📋 List all genomes:\n`;
        errorMessage += `  architech list-genomes\n`;
        errorMessage += `\n🛠️ Or use a file path:\n`;
        errorMessage += `  architech new /path/to/my-genome.genome.ts\n`;
        return new Error(errorMessage);
    }
    /**
     * Clear resolution cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}
//# sourceMappingURL=genome-resolver.js.map