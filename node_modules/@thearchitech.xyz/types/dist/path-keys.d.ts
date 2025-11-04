/**
 * Path Keys for Template Import Resolution
 *
 * Extensible path keys system with override support.
 * Allows both standardized keys (enum) and custom keys (string).
 */
/**
 * Smart path keys for common import patterns
 *
 * These keys are pre-computed in FrameworkContextService and available
 * in templates via `paths.{key}` and `importPath(paths.{key})`.
 */
export declare enum SmartPathKey {
    TRPC_ROUTER = "trpcRouter",
    TRPC_CLIENT = "trpcClient",
    TRPC_SERVER = "trpcServer",
    SHARED_SCHEMAS = "sharedSchemas",
    SHARED_TYPES = "sharedTypes",
    SHARED_UTILS = "sharedUtils",
    AUTH_CONFIG = "authConfig",
    AUTH_HOOKS = "authHooks",
    AUTH_TYPES = "authTypes",
    PAYMENT_CONFIG = "paymentConfig",
    PAYMENT_HOOKS = "paymentHooks",
    PAYMENT_TYPES = "paymentTypes",
    TEAMS_CONFIG = "teamsConfig",
    TEAMS_HOOKS = "teamsHooks",
    TEAMS_TYPES = "teamsTypes",
    EMAIL_CONFIG = "emailConfig",
    EMAIL_HOOKS = "emailHooks",
    EMAIL_TYPES = "emailTypes",
    DATABASE_CONFIG = "databaseConfig",
    DATABASE_SCHEMA = "databaseSchema",
    DATABASE_CLIENT = "databaseClient",
    STATE_STORES = "stateStores",
    STATE_PROVIDERS = "stateProviders",
    API_ROUTES = "apiRoutes",
    API_HANDLERS = "apiHandlers",
    API_MIDDLEWARE = "apiMiddleware"
}
/**
 * Smart path key type - allows both standard enum values and custom strings
 */
export type SmartPath = SmartPathKey | string;
/**
 * Smart path override configuration
 *
 * Allows frameworks, adapters, or users to override path values.
 * Warnings are issued when overrides occur.
 */
export interface SmartPathOverride {
    key: SmartPath;
    value: string;
    source: 'user' | 'framework' | 'adapter' | 'genome';
    reason?: string;
}
/**
 * Smart path registry for managing overrides
 */
export interface SmartPathRegistry {
    paths: Record<string, string>;
    overrides: SmartPathOverride[];
}
