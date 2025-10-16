/**
 * Genome Registry Service
 *
 * Manages project genome templates and provides discovery functionality
 */
import { Genome } from '@thearchitech.xyz/types';
export interface GenomeInfo {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    file: string;
    modules: number;
    complexity: 'simple' | 'intermediate' | 'advanced';
}
export declare class GenomeRegistry {
    private genomes;
    private genomesPath;
    constructor(genomesPath?: string);
    /**
     * Load all available genomes from the genomes directory
     */
    private loadGenomes;
    /**
     * Parse a genome file and extract metadata
     */
    private parseGenomeFile;
    /**
     * Extract name from recipe or use genome ID
     */
    private extractName;
    /**
     * Determine category based on modules
     */
    private determineCategory;
    /**
     * Extract tags from modules and features
     */
    private extractTags;
    /**
     * Determine complexity based on modules and features
     */
    private determineComplexity;
    /**
     * Get all available genomes
     */
    getAllGenomes(): GenomeInfo[];
    /**
     * Get genome by ID
     */
    getGenome(id: string): GenomeInfo | undefined;
    /**
     * Search genomes by query
     */
    searchGenomes(query: string): GenomeInfo[];
    /**
     * Get genomes by category
     */
    getGenomesByCategory(category: string): GenomeInfo[];
    /**
     * Get genomes by complexity
     */
    getGenomesByComplexity(complexity: 'simple' | 'intermediate' | 'advanced'): GenomeInfo[];
    /**
     * Load recipe from genome
     */
    loadRecipe(genomeId: string): Genome | null;
    /**
     * Create recipe from genome with project name
     */
    createRecipe(genomeId: string, projectName: string): Genome | null;
}
