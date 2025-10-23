/**
 * Component Dependency Resolver Service
 *
 * Resolves component dependencies from feature manifests.
 */
import { Genome } from '@thearchitech.xyz/types';
export declare class ComponentDependencyResolver {
    /**
     * Resolve component dependencies from all features in the genome
     */
    resolveComponentDependencies(genome: Genome): Promise<Map<string, string[]>>;
}
