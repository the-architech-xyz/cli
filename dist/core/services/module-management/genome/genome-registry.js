/**
 * Genome Registry Service
 *
 * Manages project genome templates and provides discovery functionality
 */
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import * as yaml from 'js-yaml';
export class GenomeRegistry {
    genomes = new Map();
    genomesPath;
    constructor(genomesPath = './genomes') {
        this.genomesPath = genomesPath;
        this.loadGenomes();
    }
    /**
     * Load all available genomes from the genomes directory
     */
    loadGenomes() {
        try {
            const files = readdirSync(this.genomesPath);
            for (const file of files) {
                if (extname(file) === '.yaml' || extname(file) === '.yml') {
                    const genomeId = file.replace(/\.(yaml|yml)$/, '');
                    const filePath = join(this.genomesPath, file);
                    try {
                        const genomeInfo = this.parseGenomeFile(genomeId, filePath);
                        this.genomes.set(genomeId, genomeInfo);
                    }
                    catch (error) {
                        console.warn(`Failed to load genome ${genomeId}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to load genomes directory:', error);
        }
    }
    /**
     * Parse a genome file and extract metadata
     */
    parseGenomeFile(genomeId, filePath) {
        const content = readFileSync(filePath, 'utf-8');
        const recipe = yaml.load(content);
        // Extract metadata from recipe
        const name = this.extractName(recipe, genomeId);
        const description = recipe.project?.description || 'No description available';
        const category = this.determineCategory(recipe);
        const tags = this.extractTags(recipe);
        const modules = recipe.modules?.length || 0;
        const complexity = this.determineComplexity(modules, recipe);
        return {
            id: genomeId,
            name,
            description,
            category,
            tags,
            file: filePath,
            modules,
            complexity
        };
    }
    /**
     * Extract name from recipe or use genome ID
     */
    extractName(recipe, genomeId) {
        if (recipe.project?.name && recipe.project.name !== '{{projectName}}') {
            return recipe.project.name;
        }
        // Convert genome ID to title case
        return genomeId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    /**
     * Determine category based on modules
     */
    determineCategory(recipe) {
        const categories = new Set();
        recipe.modules?.forEach((module) => {
            if (module.category) {
                categories.add(module.category);
            }
        });
        // Determine primary category
        if (categories.has('blockchain'))
            return 'blockchain';
        if (categories.has('payment'))
            return 'ecommerce';
        if (categories.has('content'))
            return 'content';
        if (categories.has('auth'))
            return 'saas';
        return 'web';
    }
    /**
     * Extract tags from modules and features
     */
    extractTags(recipe) {
        const tags = new Set();
        recipe.modules?.forEach((module) => {
            // Add category as tag
            if (module.category) {
                tags.add(module.category);
            }
            // Add specific features as tags
            if (module.parameters) {
                Object.keys(module.parameters).forEach(key => {
                    if (typeof module.parameters[key] === 'boolean' && module.parameters[key]) {
                        tags.add(key);
                    }
                });
            }
        });
        return Array.from(tags);
    }
    /**
     * Determine complexity based on modules and features
     */
    determineComplexity(modules, recipe) {
        if (modules <= 3)
            return 'simple';
        if (modules <= 6)
            return 'intermediate';
        return 'advanced';
    }
    /**
     * Get all available genomes
     */
    getAllGenomes() {
        return Array.from(this.genomes.values());
    }
    /**
     * Get genome by ID
     */
    getGenome(id) {
        return this.genomes.get(id);
    }
    /**
     * Search genomes by query
     */
    searchGenomes(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllGenomes().filter(genome => genome.id.toLowerCase().includes(lowerQuery) ||
            genome.name.toLowerCase().includes(lowerQuery) ||
            genome.description.toLowerCase().includes(lowerQuery) ||
            genome.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    /**
     * Get genomes by category
     */
    getGenomesByCategory(category) {
        return this.getAllGenomes().filter(genome => genome.category === category);
    }
    /**
     * Get genomes by complexity
     */
    getGenomesByComplexity(complexity) {
        return this.getAllGenomes().filter(genome => genome.complexity === complexity);
    }
    /**
     * Load recipe from genome
     */
    loadRecipe(genomeId) {
        const genome = this.getGenome(genomeId);
        if (!genome) {
            return null;
        }
        try {
            const content = readFileSync(genome.file, 'utf-8');
            return yaml.load(content);
        }
        catch (error) {
            console.error(`Failed to load recipe for genome ${genomeId}:`, error);
            return null;
        }
    }
    /**
     * Create recipe from genome with project name
     */
    createRecipe(genomeId, projectName) {
        const recipe = this.loadRecipe(genomeId);
        if (!recipe) {
            return null;
        }
        // Replace template variables
        const recipeString = JSON.stringify(recipe);
        const processedString = recipeString.replace(/\{\{projectName\}\}/g, projectName);
        try {
            return JSON.parse(processedString);
        }
        catch (error) {
            console.error(`Failed to process recipe for genome ${genomeId}:`, error);
            return null;
        }
    }
}
//# sourceMappingURL=genome-registry.js.map