/**
 * JavaScript Export Wrapper Modifier
 *
 * Wraps module.exports or export default with a higher-order function.
 * This is essential for integrating services like Sentry, Bundle Analyzer, etc.
 *
 * Example:
 * Before:
 *   const nextConfig = {...};
 *   module.exports = nextConfig;
 *
 * After:
 *   const withSentryConfig = require('@sentry/nextjs');
 *   const nextConfig = {...};
 *   module.exports = withSentryConfig(nextConfig, options);
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export interface JsExportWrapperParams extends ModifierParams {
    wrapperFunction: string;
    wrapperImport: {
        name: string;
        from: string;
        isDefault?: boolean;
    };
    wrapperOptions?: Record<string, any>;
}
export declare class JsExportWrapperModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: JsExportWrapperParams, context: ProjectContext): Promise<ModifierResult>;
    /**
     * Add import statement
     */
    private addImport;
    /**
     * Wrap the export statement
     */
    private wrapExport;
}
