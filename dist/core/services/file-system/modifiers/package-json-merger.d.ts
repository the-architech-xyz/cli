/**
 * Package.json Merger Modifier
 *
 * Merges dependencies, scripts, and other package.json properties.
 * This is a core modifier for adding packages and scripts to existing projects.
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export declare class PackageJsonMergerModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
    private mergePackageJson;
    private mergeDependencies;
    private mergeScripts;
    private mergeEngines;
    private mergeBrowserslist;
}
