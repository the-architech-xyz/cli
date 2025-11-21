/**
 * Marketplace Defaults Configuration
 *
 * @deprecated No longer auto-included by CLI.
 * Users must explicitly add modules to their genome if desired.
 *
 * CLI now generates universal defaults (.gitignore, tsconfig.json, scripts).
 * Opinionated modules (like golden-stack) remain optional marketplace modules.
 */
export declare const MARKETPLACE_DEFAULTS: {
    readonly autoInclude: readonly ["core/golden-stack"];
};
