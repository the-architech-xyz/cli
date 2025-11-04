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
export var SmartPathKey;
(function (SmartPathKey) {
    // tRPC paths
    SmartPathKey["TRPC_ROUTER"] = "trpcRouter";
    SmartPathKey["TRPC_CLIENT"] = "trpcClient";
    SmartPathKey["TRPC_SERVER"] = "trpcServer";
    // Shared code paths
    SmartPathKey["SHARED_SCHEMAS"] = "sharedSchemas";
    SmartPathKey["SHARED_TYPES"] = "sharedTypes";
    SmartPathKey["SHARED_UTILS"] = "sharedUtils";
    // Auth paths
    SmartPathKey["AUTH_CONFIG"] = "authConfig";
    SmartPathKey["AUTH_HOOKS"] = "authHooks";
    SmartPathKey["AUTH_TYPES"] = "authTypes";
    // Payment paths
    SmartPathKey["PAYMENT_CONFIG"] = "paymentConfig";
    SmartPathKey["PAYMENT_HOOKS"] = "paymentHooks";
    SmartPathKey["PAYMENT_TYPES"] = "paymentTypes";
    // Teams paths
    SmartPathKey["TEAMS_CONFIG"] = "teamsConfig";
    SmartPathKey["TEAMS_HOOKS"] = "teamsHooks";
    SmartPathKey["TEAMS_TYPES"] = "teamsTypes";
    // Email paths
    SmartPathKey["EMAIL_CONFIG"] = "emailConfig";
    SmartPathKey["EMAIL_HOOKS"] = "emailHooks";
    SmartPathKey["EMAIL_TYPES"] = "emailTypes";
    // Database paths
    SmartPathKey["DATABASE_CONFIG"] = "databaseConfig";
    SmartPathKey["DATABASE_SCHEMA"] = "databaseSchema";
    SmartPathKey["DATABASE_CLIENT"] = "databaseClient";
    // State management paths
    SmartPathKey["STATE_STORES"] = "stateStores";
    SmartPathKey["STATE_PROVIDERS"] = "stateProviders";
    // API paths
    SmartPathKey["API_ROUTES"] = "apiRoutes";
    SmartPathKey["API_HANDLERS"] = "apiHandlers";
    SmartPathKey["API_MIDDLEWARE"] = "apiMiddleware";
})(SmartPathKey || (SmartPathKey = {}));
