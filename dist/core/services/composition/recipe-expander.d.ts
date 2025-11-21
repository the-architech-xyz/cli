/**
 * Recipe Expander
 *
 * Expands business packages into technical modules using recipe books.
 * Handles recursive package dependencies and prevents infinite loops.
 */
import type { RecipeBook, PackageConfig, ModuleWithPrerequisites } from '@thearchitech.xyz/types';
export interface Logger {
    info: (msg: string, meta?: any) => void;
    debug: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
}
export declare class RecipeExpander {
    private logger;
    constructor(logger: Logger);
    /**
     * Expand packages into modules using recipe books
     *
     * @param packages - Package configurations from genome
     * @param recipeBooks - Map of marketplace name -> recipe book
     * @returns Array of modules with their prerequisites
     */
    expand(packages: Record<string, PackageConfig>, recipeBooks: Map<string, RecipeBook>): Promise<ModuleWithPrerequisites[]>;
    /**
     * Recursively expand a package and its dependencies
     */
    private expandPackageRecursive;
}
