/**
 * Marketplace Service
 *
 * Centralized service for all marketplace-related operations.
 * Handles module loading, template loading, and path resolution.
 *
 * Uses MarketplaceRegistry as the single source of truth for marketplace paths.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { PathService } from '../path/path-service.js';
import { MarketplaceRegistry } from './marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';
export class MarketplaceService {
    /**
     * Load template content from marketplace
     *
     * Supports:
     * - Convention-based UI templates: `ui/architech-welcome/welcome-page.tsx.tpl`
     * - Core marketplace templates: `templates/data-extractor.ts.tpl` or `data-extractor.ts.tpl`
     * - Absolute paths: `/absolute/path/to/template.tsx.tpl` (legacy)
     *
     * @param moduleId - Module ID (e.g., 'features/auth')
     * @param templateFile - Template path (relative or absolute)
     * @param context - Optional ProjectContext for marketplace path resolution
     */
    static async loadTemplate(moduleId, templateFile, context) {
        const uiResolved = await this.tryLoadFromUIMarketplace(templateFile, context);
        if (uiResolved !== null) {
            return uiResolved;
        }
        const moduleMetadata = context?.module;
        if (!path.isAbsolute(templateFile) && !templateFile.startsWith('ui/')) {
            const normalizedTemplate = templateFile.startsWith('templates/')
                ? templateFile.replace(/^templates\//, '')
                : templateFile;
            const moduleRootCandidates = new Set();
            if (moduleMetadata?.resolved?.root) {
                moduleRootCandidates.add(moduleMetadata.resolved.root);
            }
            const moduleMarketplaceRoot = moduleMetadata?.marketplace?.root ||
                context?.marketplace?.core ||
                (await MarketplaceRegistry.getCoreMarketplacePath());
            const sourceRoot = moduleMetadata?.source?.root;
            if (sourceRoot) {
                const sourcePath = path.isAbsolute(sourceRoot)
                    ? sourceRoot
                    : path.join(moduleMarketplaceRoot, sourceRoot);
                moduleRootCandidates.add(sourcePath);
            }
            for (const moduleRoot of moduleRootCandidates) {
                const candidatePaths = new Set();
                candidatePaths.add(path.join(moduleRoot, 'templates', normalizedTemplate));
                if (templateFile.startsWith('templates/')) {
                    candidatePaths.add(path.join(moduleRoot, templateFile));
                }
                for (const candidate of candidatePaths) {
                    try {
                        return await fs.readFile(candidate, 'utf-8');
                    }
                    catch {
                        continue;
                    }
                }
            }
        }
        // Check if templateFile is an absolute path (legacy support)
        if (path.isAbsolute(templateFile)) {
            try {
                return await fs.readFile(templateFile, 'utf-8');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                throw new Error(`Template file not found: ${templateFile}\n` +
                    `Error: ${errorMsg}`);
            }
        }
        // DEFAULT: Core marketplace (relative path)
        const marketplaceRoot = context?.marketplace?.core ||
            moduleMetadata?.marketplace?.root ||
            await MarketplaceRegistry.getCoreMarketplacePath();
        const resolvedModuleId = await PathService.resolveModuleId(moduleId);
        // Check if templateFile already includes 'templates/' prefix
        const templatePath = templateFile.startsWith('templates/')
            ? path.join(marketplaceRoot, resolvedModuleId, templateFile)
            : path.join(marketplaceRoot, resolvedModuleId, 'templates', templateFile);
        try {
            return await fs.readFile(templatePath, 'utf-8');
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.warn('Template resolution fallback triggered', {
                moduleId,
                templateFile,
                moduleResolvedRoot: moduleMetadata?.resolved?.root,
                moduleSourceRoot: moduleMetadata?.source?.root,
                marketplaceRoot,
            });
            const suggestions = await this.getTemplateSuggestions(moduleMetadata, moduleId, templateFile);
            const modulePath = moduleMetadata?.resolved?.root || path.join(marketplaceRoot, resolvedModuleId);
            throw new Error(`Template file not found: ${templatePath}\n` +
                `Module: ${moduleId}\n` +
                `Template: ${templateFile}\n` +
                `Module path: ${modulePath}\n` +
                `Error: ${errorMsg}\n` +
                `Suggestions: ${suggestions.join(', ')}\n` +
                `Run 'npm run validate:templates' to check all templates.`);
        }
    }
    static async tryLoadFromUIMarketplace(templateFile, context) {
        const uiRoot = this.getUIMarketplaceRoot(context);
        if (!uiRoot) {
            return null;
        }
        Logger.info('🎯 Resolving UI template', {
            operation: 'template_loading',
            templateFile,
            uiRoot
        });
        const normalizedRoot = uiRoot.endsWith(path.sep) ? uiRoot : `${uiRoot}${path.sep}`;
        const manifestResolved = await this.tryResolveViaUIManifest(templateFile, normalizedRoot);
        if (manifestResolved) {
            Logger.info('✅ UI template resolved via manifest', {
                operation: 'template_loading',
                templateFile,
                uiRoot
            });
            return manifestResolved;
        }
        if (templateFile.startsWith('ui/')) {
            const relativePath = templateFile.replace(/^ui\//, '');
            const directResolved = await this.readIfExists(path.join(normalizedRoot, relativePath));
            if (directResolved) {
                Logger.info('✅ UI template resolved directly from filesystem', {
                    operation: 'template_loading',
                    templateFile,
                    candidatePath: path.join(normalizedRoot, relativePath)
                });
                return directResolved;
            }
        }
        if (templateFile.startsWith('components/ui/')) {
            const relativePath = templateFile.replace(/^components\/ui\//, '');
            const directResolved = await this.readIfExists(path.join(normalizedRoot, relativePath));
            if (directResolved) {
                Logger.info('✅ UI template resolved directly from filesystem', {
                    operation: 'template_loading',
                    templateFile,
                    candidatePath: path.join(normalizedRoot, relativePath)
                });
                return directResolved;
            }
        }
        return null;
    }
    static getUIMarketplaceRoot(context) {
        const uiContext = context?.marketplace?.ui || {};
        if (typeof uiContext.root === 'string' && uiContext.root.trim()) {
            return uiContext.root;
        }
        if (typeof uiContext.path === 'string' && uiContext.path.trim()) {
            return uiContext.path;
        }
        const handler = context?.pathHandler;
        if (handler?.hasPath && typeof handler.hasPath === 'function') {
            try {
                if (handler.hasPath('ui.marketplace')) {
                    return handler.getPath('ui.marketplace');
                }
                if (handler.hasPath('ui.path')) {
                    return handler.getPath('ui.path');
                }
            }
            catch {
                // Ignore path resolution errors here; caller will provide fallback.
            }
        }
        return null;
    }
    static uiManifestCache = new Map();
    static async tryResolveViaUIManifest(templateFile, uiRoot) {
        const manifest = await this.loadUIManifest(uiRoot);
        if (!manifest?.components) {
            Logger.info('⚠️ UI manifest missing components section', {
                operation: 'template_loading',
                uiRoot
            });
            return null;
        }
        const candidateKeys = this.deriveUIComponentKeys(templateFile);
        if (candidateKeys.length === 0) {
            Logger.info('⚠️ Unable to derive UI manifest keys', {
                operation: 'template_loading',
                templateFile
            });
            return null;
        }
        const manifestDir = uiRoot.replace(/[\\/]ui[\\/]?$/, '');
        Logger.info('🔍 Searching UI manifest for template', {
            operation: 'template_loading',
            templateFile,
            manifestDir,
            candidateKeys
        });
        for (const key of candidateKeys) {
            const entry = manifest.components[key];
            if (!entry?.path) {
                continue;
            }
            const resolvedPath = path.resolve(manifestDir, entry.path.replace(/^\.\//, ''));
            const content = await this.readIfExists(resolvedPath);
            if (content) {
                Logger.info('✅ UI template resolved via manifest entry', {
                    operation: 'template_loading',
                    templateFile,
                    key,
                    resolvedPath
                });
                return content;
            }
        }
        Logger.info('⚠️ UI manifest lookup failed for all candidates', {
            operation: 'template_loading',
            templateFile,
            candidateKeys
        });
        return null;
    }
    static async loadUIManifest(uiRoot) {
        const manifestDir = uiRoot.replace(/[\\/]ui[\\/]?$/, '');
        if (this.uiManifestCache.has(manifestDir)) {
            return this.uiManifestCache.get(manifestDir);
        }
        const manifestPath = path.join(manifestDir, 'manifest.json');
        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const parsed = JSON.parse(content);
            this.uiManifestCache.set(manifestDir, parsed);
            Logger.info('✅ Loaded UI marketplace manifest', {
                operation: 'template_loading',
                manifestPath
            });
            return parsed;
        }
        catch (error) {
            Logger.debug('⚠️ UI marketplace manifest not found or invalid', {
                operation: 'template_loading',
                manifestPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            this.uiManifestCache.set(manifestDir, null);
            return null;
        }
    }
    static deriveUIComponentKeys(templateFile) {
        const normalized = templateFile.startsWith('components/ui/')
            ? templateFile.replace(/^components\/ui\//, '')
            : templateFile.startsWith('ui/')
                ? templateFile.replace(/^ui\//, '')
                : null;
        if (!normalized) {
            return [];
        }
        const parts = normalized.split('/');
        if (parts.length === 0) {
            return [];
        }
        const fileName = parts[parts.length - 1];
        if (!fileName) {
            return [];
        }
        const baseName = fileName.replace(/\.(tsx|ts|jsx|js)\.tpl$/i, '').replace(/\.tpl$/i, '');
        if (!baseName) {
            return [];
        }
        const candidateKeys = new Set();
        candidateKeys.add(baseName);
        const camelKey = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        candidateKeys.add(camelKey);
        const pascalFromKebab = baseName
            .split(/[-_]/g)
            .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join('');
        candidateKeys.add(pascalFromKebab);
        const kebabFromPascal = baseName
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/[_\s]+/g, '-')
            .toLowerCase();
        candidateKeys.add(kebabFromPascal);
        candidateKeys.add(baseName.toLowerCase());
        Logger.info('🔑 Derived UI manifest keys', {
            operation: 'template_loading',
            templateFile,
            normalized,
            candidateKeys: Array.from(candidateKeys)
        });
        return Array.from(candidateKeys);
    }
    static async readIfExists(absolutePath) {
        try {
            return await fs.readFile(absolutePath, 'utf-8');
        }
        catch (error) {
            Logger.debug('⚠️ Template not found at expected UI marketplace path', {
                operation: 'template_loading',
                absolutePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }
    /**
     * Get template suggestions for better error messages
     */
    static async getTemplateSuggestions(moduleMetadata, moduleId, templateFile) {
        let templatesDir = null;
        if (moduleMetadata?.resolved?.root) {
            templatesDir = path.join(moduleMetadata.resolved.root, 'templates');
        }
        else {
            const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
            const resolvedModuleId = await PathService.resolveModuleId(moduleId);
            templatesDir = path.join(marketplaceRoot, resolvedModuleId, 'templates');
        }
        try {
            const files = await fs.readdir(templatesDir);
            const suggestions = files
                .filter(file => file.endsWith('.tpl'))
                .slice(0, 5)
                .map(file => `templates/${file}`);
            return suggestions.length > 0 ? suggestions : ['No templates found in module'];
        }
        catch {
            return ['Templates directory not found'];
        }
    }
    /**
     * Load feature manifest (schema.json) - convenience method
     */
    static async loadFeatureManifest(module) {
        return this.loadModuleConfig(module);
    }
    /**
     * Load module configuration (schema.json)
     * All modules use schema.json regardless of type (adapter, connector, feature)
     */
    static async loadModuleConfig(module) {
        if (!module?.resolved?.manifest) {
            throw new Error(`Module ${module?.id || '<unknown>'} is missing resolved manifest metadata.`);
        }
        // Resolve manifest path
        let manifestPath = module.resolved.manifest;
        // If path is relative, resolve it using source.root
        if (!path.isAbsolute(manifestPath) && module.source?.root) {
            // Try to resolve using MarketplaceRegistry first (for core marketplace)
            if (module.source.marketplace === 'official' || !module.source.marketplace) {
                const corePath = await MarketplaceRegistry.getCoreMarketplacePath();
                manifestPath = path.join(corePath, manifestPath);
            }
            else {
                // For custom marketplaces, resolve relative to source.root
                // source.root might be relative, so we need to resolve it
                const sourceRoot = module.source.root;
                if (path.isAbsolute(sourceRoot)) {
                    manifestPath = path.join(sourceRoot, manifestPath);
                }
                else {
                    // If source.root is relative, try to resolve it
                    // This is a fallback - ideally source.root should be absolute
                    const cliRoot = PathService.getCliRoot();
                    const resolvedSourceRoot = path.resolve(cliRoot, '..', sourceRoot);
                    manifestPath = path.join(resolvedSourceRoot, manifestPath);
                }
            }
        }
        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to load module configuration for ${module.id}: ${message}. Tried path: ${manifestPath}`);
        }
    }
    /**
     * Get the absolute path to a module's blueprint file
     * This is the centralized, tested logic for blueprint path resolution.
     */
    static async getBlueprintPath(module, blueprintFileName) {
        if (!module?.resolved?.blueprint) {
            throw new Error(`Module ${module?.id || '<unknown>'} is missing resolved blueprint metadata.`);
        }
        // Resolve blueprint path (similar to manifest path resolution)
        let blueprintPath = module.resolved.blueprint;
        // If path is relative, resolve it using source.root
        if (!path.isAbsolute(blueprintPath) && module.source?.root) {
            // Try to resolve using MarketplaceRegistry first (for core marketplace)
            if (module.source.marketplace === 'official' || !module.source.marketplace) {
                const corePath = await MarketplaceRegistry.getCoreMarketplacePath();
                blueprintPath = path.join(corePath, blueprintPath);
            }
            else {
                // For custom marketplaces, resolve relative to source.root
                const sourceRoot = module.source.root;
                if (path.isAbsolute(sourceRoot)) {
                    blueprintPath = path.join(sourceRoot, blueprintPath);
                }
                else {
                    // If source.root is relative, try to resolve it
                    const cliRoot = PathService.getCliRoot();
                    const resolvedSourceRoot = path.resolve(cliRoot, '..', sourceRoot);
                    blueprintPath = path.join(resolvedSourceRoot, blueprintPath);
                }
            }
        }
        if (blueprintFileName) {
            return path.isAbsolute(blueprintFileName)
                ? blueprintFileName
                : path.join(path.dirname(blueprintPath), blueprintFileName);
        }
        return blueprintPath;
    }
    /**
     * Load module blueprint (consolidated from BlueprintLoader)
     */
    static async loadModuleBlueprint(module, blueprintFileName) {
        const blueprintPath = await this.getBlueprintPath(module, blueprintFileName);
        const result = await this.loadBlueprint(module.id, blueprintPath);
        if (!result.success) {
            throw new Error(result.error || 'Unknown blueprint loading error');
        }
        if (!result.blueprint) {
            throw new Error(`Blueprint loaded successfully but result.blueprint is ${result.blueprint}`);
        }
        return result.blueprint;
    }
    // ============================================================================
    // BLUEPRINT LOADER METHODS (consolidated from BlueprintLoader)
    // ============================================================================
    /**
     * Load and normalize a blueprint from a module
     * @private
     */
    static async loadBlueprint(moduleId, blueprintPath) {
        try {
            const blueprintModule = await this.loadModuleWithFallbacks(blueprintPath);
            const moduleName = moduleId.split('/').pop() || moduleId;
            // Try different export patterns in order of preference
            let blueprint = this.tryDefaultExport(blueprintModule);
            if (blueprint) {
                return { success: true, blueprint, exportType: 'default' };
            }
            blueprint = this.tryNamedExport(blueprintModule, moduleName);
            if (blueprint) {
                return { success: true, blueprint, exportType: 'named' };
            }
            blueprint = this.tryWrappedExport(blueprintModule, moduleName);
            if (blueprint) {
                return { success: true, blueprint, exportType: 'wrapped' };
            }
            return {
                success: false,
                error: `No blueprint found in ${blueprintPath}. Available exports: ${Object.keys(blueprintModule).join(', ')}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to load blueprint from ${blueprintPath}: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    static async loadModuleWithFallbacks(blueprintPath) {
        const attempted = [];
        const pathsToTry = this.buildCandidatePaths(blueprintPath);
        let lastError = null;
        for (const candidate of pathsToTry) {
            attempted.push(candidate);
            try {
                if (candidate.endsWith('.ts')) {
                    await this.ensureTypeScriptLoader();
                }
                const fileUrl = pathToFileURL(candidate).href;
                return await import(fileUrl);
            }
            catch (error) {
                lastError = error;
                continue;
            }
        }
        const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
        throw new Error(`Failed to load blueprint from any source. Attempted: ${attempted.join(', ')}. Last error: ${errorMessage}`);
    }
    static buildCandidatePaths(blueprintPath) {
        const candidates = new Set();
        const normalizedPath = this.normalizePath(blueprintPath);
        if (existsSync(normalizedPath)) {
            candidates.add(normalizedPath);
        }
        if (normalizedPath.endsWith('.ts')) {
            const compiledPath = normalizedPath.replace(/\.ts$/, '.js');
            if (existsSync(compiledPath)) {
                candidates.add(compiledPath);
            }
        }
        else if (normalizedPath.endsWith('.js')) {
            const sourcePath = normalizedPath.replace(/\.js$/, '.ts');
            if (existsSync(sourcePath)) {
                candidates.add(sourcePath);
            }
        }
        return Array.from(candidates);
    }
    static normalizePath(targetPath) {
        return targetPath.startsWith('file://')
            ? new URL(targetPath).pathname
            : targetPath;
    }
    static tsLoaderInitialized = false;
    static async ensureTypeScriptLoader() {
        if (this.tsLoaderInitialized) {
            return;
        }
        await import('tsx/esm');
        this.tsLoaderInitialized = true;
    }
    /**
     * Try to get blueprint from default export
     */
    static tryDefaultExport(blueprintModule) {
        if (!blueprintModule.default)
            return null;
        const defaultExport = blueprintModule.default;
        // If default export is a function, it's a dynamic blueprint (valid)
        // Return it wrapped so the preprocessor can recognize it
        if (typeof defaultExport === 'function') {
            return { default: defaultExport };
        }
        // If default export is already a blueprint (has id, name, actions)
        if (this.isBlueprint(defaultExport)) {
            return defaultExport;
        }
        // If default export is wrapped, try to extract blueprint
        if (typeof defaultExport === 'object' && !this.isBlueprint(defaultExport)) {
            const keys = Object.keys(defaultExport);
            if (keys.length === 1 && keys[0]) {
                const candidate = defaultExport[keys[0]];
                if (this.isBlueprint(candidate)) {
                    return candidate;
                }
            }
        }
        return null;
    }
    /**
     * Try to get blueprint from named export (moduleNameBlueprint)
     */
    static tryNamedExport(blueprintModule, moduleName) {
        const namedExportKey = `${moduleName}Blueprint`;
        if (blueprintModule[namedExportKey] && this.isBlueprint(blueprintModule[namedExportKey])) {
            return blueprintModule[namedExportKey];
        }
        // Try other blueprint-like exports
        const blueprintKeys = Object.keys(blueprintModule).filter(key => key.toLowerCase().includes('blueprint') &&
            !key.includes('default'));
        for (const key of blueprintKeys) {
            if (this.isBlueprint(blueprintModule[key])) {
                return blueprintModule[key];
            }
        }
        return null;
    }
    /**
     * Try to get blueprint from wrapped export
     */
    static tryWrappedExport(blueprintModule, moduleName) {
        const exports = Object.keys(blueprintModule);
        // Look for single-key objects that might contain a blueprint
        for (const key of exports) {
            const candidate = blueprintModule[key];
            if (typeof candidate === 'object' && !this.isBlueprint(candidate)) {
                const subKeys = Object.keys(candidate);
                if (subKeys.length === 1 && subKeys[0]) {
                    const subCandidate = candidate[subKeys[0]];
                    if (this.isBlueprint(subCandidate)) {
                        return subCandidate;
                    }
                }
            }
        }
        return null;
    }
    /**
     * Check if an object is a valid blueprint
     */
    static isBlueprint(obj) {
        return obj &&
            typeof obj === 'object' &&
            typeof obj.id === 'string' &&
            typeof obj.name === 'string' &&
            Array.isArray(obj.actions);
    }
    /**
     * Check if a module exists in the marketplace
     */
    static async moduleExists(moduleId) {
        try {
            const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
            const resolvedModuleId = await PathService.resolveModuleId(moduleId);
            const modulePath = path.join(marketplaceRoot, resolvedModuleId);
            const stats = await fs.stat(modulePath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=marketplace-service.js.map