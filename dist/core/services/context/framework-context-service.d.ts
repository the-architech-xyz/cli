/**
 * Framework Context Service
 *
 * Loads framework-specific context configurations from the marketplace
 * and creates dynamic ProjectContext based on framework and user parameters.
 *
 * This service is framework-agnostic and relies entirely on marketplace data.
 */
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Genome, Module } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
export interface FrameworkContextConfig {
    pathResolution: {
        basePaths: Record<string, string>;
        parameterBased: Record<string, string>;
    };
    environment: {
        default: Record<string, string>;
        frameworkSpecific: Record<string, string>;
    };
    conventions: {
        fileExtensions: string[];
        importStyle: 'relative' | 'absolute' | 'alias';
        aliasPrefix: string;
        [key: string]: any;
    };
}
export declare class FrameworkContextService {
    /**
     * Create dynamic ProjectContext based on framework and parameters
     */
    static createProjectContext(genome: Genome, module: Module, pathHandler: PathService, modulesRecord: Record<string, Module>): Promise<ProjectContext>;
    /**
     * Load framework configuration from marketplace
     */
    private static loadFrameworkConfig;
    /**
     * Resolve framework-specific paths
     */
    private static resolveFrameworkPaths;
    /**
     * Resolve path template with parameter substitution
     */
    private static resolvePathTemplate;
    /**
     * Evaluate conditional expressions like "srcDir ? 'src/' : ''"
     */
    private static evaluateConditionalExpression;
    /**
     * Create environment context
     */
    private static createEnvironmentContext;
    /**
     * Create fallback context when framework config is not available
     */
    private static createFallbackContext;
}
