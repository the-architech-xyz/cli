/**
 * JSX Children Wrapper Modifier
 *
 * Wraps {children} in React/Next.js components with provider components.
 * This is essential for adding global providers like AuthProvider, ThemeProvider, etc.
 *
 * Example:
 * Before:
 *   <body>{children}</body>
 *
 * After:
 *   <body>
 *     <ThemeProvider attribute="class">
 *       <AuthProvider>
 *         {children}
 *       </AuthProvider>
 *     </ThemeProvider>
 *   </body>
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export interface ProviderSpec {
    component: string;
    import: {
        name: string;
        from: string;
        isDefault?: boolean;
    };
    props?: Record<string, string | boolean | number>;
}
export interface JsxChildrenWrapperParams extends ModifierParams {
    providers: ProviderSpec[];
    targetElement?: string;
}
export declare class JsxChildrenWrapperModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: JsxChildrenWrapperParams, context: ProjectContext): Promise<ModifierResult>;
    /**
     * Add import for a provider
     */
    private addProviderImport;
    /**
     * Wrap children with providers
     */
    private wrapChildren;
    /**
     * Create default Next.js layout structure when file is empty
     */
    private createDefaultNextJsLayout;
    /**
     * Build the wrapped JSX structure
     */
    private buildWrappedStructure;
    /**
     * Build props string for JSX
     */
    private buildPropsString;
}
