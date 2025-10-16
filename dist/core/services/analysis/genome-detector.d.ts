/**
 * Genome Detector Service
 *
 * Analyzes existing projects and reconstructs their architecture
 * to generate TypeScript genome files
 */
export interface DetectedGenome {
    project: {
        name: string;
        description: string;
        version: string;
        framework: string;
    };
    modules: {
        adapters: DetectedAdapter[];
        integrators: DetectedAdapter[];
        features: DetectedAdapter[];
    };
    confidence: number;
    analysis: {
        filesAnalyzed: number;
        dependenciesFound: number;
        patternsMatched: number;
        warnings: string[];
    };
}
export interface DetectedAdapter {
    id: string;
    confidence: number;
    parameters: Record<string, any>;
    evidence: string[];
    version?: string;
}
export interface ProjectAnalysis {
    packageJson: any;
    files: string[];
    imports: string[];
    configFiles: Record<string, any>;
    patterns: string[];
}
export declare class GenomeDetector {
    private logger;
    constructor();
    /**
     * Analyze a project and detect its genome
     */
    analyzeProject(projectPath: string): Promise<DetectedGenome>;
    /**
     * Analyze project structure and extract information
     */
    private analyzeProjectStructure;
    /**
     * Recursively scan files in project
     */
    private scanFiles;
    /**
     * Extract imports from code files
     */
    private extractImports;
    /**
     * Load configuration files
     */
    private loadConfigFiles;
    /**
     * Detect framework from analysis
     */
    private detectFramework;
    /**
     * Detect adapters from analysis
     */
    private detectAdapters;
    /**
     * Detect integrators from analysis using dynamic connector resolution
     */
    private detectIntegrators;
    /**
     * Extract category from adapter ID
     */
    private extractCategoryFromAdapterId;
    /**
     * Detect features from analysis
     */
    private detectFeatures;
    /**
     * Detect database provider
     */
    private detectDatabaseProvider;
    /**
     * Detect Shadcn components
     */
    private detectShadcnComponents;
    /**
     * Calculate overall confidence
     */
    private calculateConfidence;
    /**
     * Generate warnings
     */
    private generateWarnings;
    /**
     * Check if directory should be skipped
     */
    private shouldSkipDirectory;
    /**
     * Check if file is a code file
     */
    private isCodeFile;
}
