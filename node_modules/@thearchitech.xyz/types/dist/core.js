/**
 * Core Types - Single Source of Truth
 *
 * Fundamental types and enums used across the entire Architech system.
 * This is the foundation that both agents and plugins build upon.
 */
// ============================================================================
// SHARED ENUMS - Single Source of Truth
// ============================================================================
/**
 * Database Providers (Infrastructure Layer)
 */
export const DATABASE_PROVIDERS = {
    // PostgreSQL-based
    NEON: 'neon',
    SUPABASE: 'supabase',
    VERCEL_POSTGRES: 'vercel-postgres',
    PLANETSCALE: 'planetscale',
    // Document databases
    MONGODB: 'mongodb',
    MONGODB_ATLAS: 'mongodb-atlas',
    // SQLite-based
    TURSO: 'turso',
    SQLITE: 'sqlite',
    // MySQL-based
    MYSQL: 'mysql',
    PLANETSCALE_MYSQL: 'planetscale-mysql',
    // Local development
    LOCAL_POSTGRES: 'local-postgres',
    LOCAL_MYSQL: 'local-mysql',
    LOCAL_SQLITE: 'local-sqlite'
};
/**
 * ORM Libraries (Data Access Layer)
 */
export const ORM_LIBRARIES = {
    // SQL ORMs
    DRIZZLE: 'drizzle',
    PRISMA: 'prisma',
    TYPEORM: 'typeorm',
    KYSELY: 'kysely',
    SEQUELIZE: 'sequelize',
    // MongoDB ODMs
    MONGOOSE: 'mongoose',
    PRISMA_MONGO: 'prisma-mongo',
    // Edge/Serverless
    D1: 'd1',
    UPSTASH_REDIS: 'upstash-redis',
    // Query Builders
    KNEX: 'knex'
};
/**
 * Authentication Providers
 */
export const AUTH_PROVIDERS = {
    EMAIL: 'email',
    GITHUB: 'github',
    GOOGLE: 'google',
    DISCORD: 'discord',
    TWITTER: 'twitter',
    FACEBOOK: 'facebook',
    APPLE: 'apple',
    MICROSOFT: 'microsoft',
    LINKEDIN: 'linkedin',
    GITLAB: 'gitlab',
    BITBUCKET: 'bitbucket',
    TWITCH: 'twitch',
    SPOTIFY: 'spotify',
    SLACK: 'slack',
    NOTION: 'notion',
    LINEAR: 'linear',
    FIGMA: 'figma',
    CUSTOM: 'custom'
};
/**
 * UI Libraries
 */
export const UI_LIBRARIES = {
    SHADCN_UI: 'shadcn-ui',
    CHAKRA_UI: 'chakra-ui',
    MATERIAL_UI: 'mui',
    ANT_DESIGN: 'antd',
    RADIX_UI: 'radix',
    MANTINE: 'mantine',
    HEADLESS_UI: 'headless-ui',
    ARIANE: 'ariane',
    NEXT_UI: 'next-ui',
    DAISY_UI: 'daisy-ui',
    TAMAGUI: 'tamagui',
    EMOTION: 'emotion',
    STYLED_COMPONENTS: 'styled-components',
    TAILWIND: 'tailwind',
    CSS_MODULES: 'css-modules'
};
/**
 * Deployment Platforms
 */
export const DEPLOYMENT_PLATFORMS = {
    VERCEL: 'vercel',
    RAILWAY: 'railway',
    NETLIFY: 'netlify',
    AWS: 'aws',
    GCP: 'gcp',
    AZURE: 'azure',
    DIGITAL_OCEAN: 'digitalocean',
    HEROKU: 'heroku',
    FLY: 'fly',
    RENDER: 'render',
    CLOUDFLARE: 'cloudflare',
    DOCKER: 'docker',
    KUBERNETES: 'kubernetes'
};
/**
 * Email Services
 */
export const EMAIL_SERVICES = {
    RESEND: 'resend',
    SENDGRID: 'sendgrid',
    MAILGUN: 'mailgun',
    SES: 'ses',
    POSTMARK: 'postmark',
    MAILCHIMP: 'mailchimp',
    CONVERTKIT: 'convertkit',
    CUSTOM: 'custom'
};
/**
 * Testing Frameworks
 */
export const TESTING_FRAMEWORKS = {
    VITEST: 'vitest',
    JEST: 'jest',
    PLAYWRIGHT: 'playwright',
    CYPRESS: 'cypress',
    TESTING_LIBRARY: 'testing-library',
    MSW: 'msw',
    HAPPY_DOM: 'happy-dom',
    JSDOM: 'jsdom'
};
/**
 * Payment Providers
 */
export const PAYMENT_PROVIDERS = {
    STRIPE: 'stripe',
    PAYPAL: 'paypal',
    SQUARE: 'square',
    PADDLE: 'paddle',
    CHARGEBEE: 'chargebee',
    RECURLY: 'recurly',
    CUSTOM: 'custom'
};
/**
 * Monitoring Services
 */
export const MONITORING_SERVICES = {
    SENTRY: 'sentry',
    VERCEL_ANALYTICS: 'vercel-analytics',
    GOOGLE_ANALYTICS: 'google-analytics',
    POSTHOG: 'posthog',
    MIXPANEL: 'mixpanel',
    AMPLITUDE: 'amplitude',
    HOTJAR: 'hotjar',
    CUSTOM: 'custom'
};
// ============================================================================
// FEATURE ENUMS
// ============================================================================
export var DatabaseFeature;
(function (DatabaseFeature) {
    DatabaseFeature["MIGRATIONS"] = "migrations";
    DatabaseFeature["SEEDING"] = "seeding";
    DatabaseFeature["BACKUP"] = "backup";
    DatabaseFeature["MONITORING"] = "monitoring";
    DatabaseFeature["REPLICATION"] = "replication";
    DatabaseFeature["SHARDING"] = "sharding";
    DatabaseFeature["CACHING"] = "caching";
    DatabaseFeature["ENCRYPTION"] = "encryption";
})(DatabaseFeature || (DatabaseFeature = {}));
export var ORMOption;
(function (ORMOption) {
    ORMOption["DRIZZLE"] = "drizzle";
    ORMOption["PRISMA"] = "prisma";
    ORMOption["TYPEORM"] = "typeorm";
    ORMOption["KYSELY"] = "kysely";
    ORMOption["MONGOOSE"] = "mongoose";
    ORMOption["SEQUELIZE"] = "sequelize";
})(ORMOption || (ORMOption = {}));
export var ComponentOption;
(function (ComponentOption) {
    ComponentOption["BUTTON"] = "button";
    ComponentOption["INPUT"] = "input";
    ComponentOption["CARD"] = "card";
    ComponentOption["MODAL"] = "modal";
    ComponentOption["NAVIGATION"] = "navigation";
    ComponentOption["FORM"] = "form";
    ComponentOption["TABLE"] = "table";
    ComponentOption["CHART"] = "chart";
    ComponentOption["CALENDAR"] = "calendar";
    ComponentOption["DROPDOWN"] = "dropdown";
    ComponentOption["TOOLTIP"] = "tooltip";
    ComponentOption["BADGE"] = "badge";
    ComponentOption["AVATAR"] = "avatar";
    ComponentOption["PROGRESS"] = "progress";
    ComponentOption["ALERT"] = "alert";
})(ComponentOption || (ComponentOption = {}));
export var ThemeOption;
(function (ThemeOption) {
    ThemeOption["LIGHT"] = "light";
    ThemeOption["DARK"] = "dark";
    ThemeOption["SYSTEM"] = "system";
    ThemeOption["CUSTOM"] = "custom";
})(ThemeOption || (ThemeOption = {}));
export var StylingOption;
(function (StylingOption) {
    StylingOption["TAILWIND"] = "tailwind";
    StylingOption["CSS_MODULES"] = "css-modules";
    StylingOption["STYLED_COMPONENTS"] = "styled-components";
    StylingOption["EMOTION"] = "emotion";
    StylingOption["SASS"] = "sass";
    StylingOption["LESS"] = "less";
})(StylingOption || (StylingOption = {}));
export var AuthFeature;
(function (AuthFeature) {
    AuthFeature["EMAIL_VERIFICATION"] = "email-verification";
    AuthFeature["TWO_FACTOR"] = "two-factor";
    AuthFeature["SOCIAL_LOGIN"] = "social-login";
    AuthFeature["PASSWORD_RESET"] = "password-reset";
    AuthFeature["SESSION_MANAGEMENT"] = "session-management";
    AuthFeature["ROLE_BASED_ACCESS"] = "role-based-access";
    AuthFeature["API_KEYS"] = "api-keys";
    AuthFeature["OAUTH"] = "oauth";
})(AuthFeature || (AuthFeature = {}));
export var SessionConfig;
(function (SessionConfig) {
    SessionConfig["JWT"] = "jwt";
    SessionConfig["DATABASE"] = "database";
    SessionConfig["REDIS"] = "redis";
    SessionConfig["COOKIE"] = "cookie";
})(SessionConfig || (SessionConfig = {}));
export var SecurityConfig;
(function (SecurityConfig) {
    SecurityConfig["CSRF_PROTECTION"] = "csrf-protection";
    SecurityConfig["RATE_LIMITING"] = "rate-limiting";
    SecurityConfig["PASSWORD_POLICY"] = "password-policy";
    SecurityConfig["SESSION_TIMEOUT"] = "session-timeout";
    SecurityConfig["IP_WHITELIST"] = "ip-whitelist";
})(SecurityConfig || (SecurityConfig = {}));
export var TestType;
(function (TestType) {
    TestType["UNIT"] = "unit";
    TestType["INTEGRATION"] = "integration";
    TestType["E2E"] = "e2e";
    TestType["COMPONENT"] = "component";
    TestType["API"] = "api";
    TestType["VISUAL"] = "visual";
})(TestType || (TestType = {}));
export var CoverageOption;
(function (CoverageOption) {
    CoverageOption["NONE"] = "none";
    CoverageOption["BASIC"] = "basic";
    CoverageOption["FULL"] = "full";
    CoverageOption["CUSTOM"] = "custom";
})(CoverageOption || (CoverageOption = {}));
export var ConnectionOption;
(function (ConnectionOption) {
    ConnectionOption["POOL"] = "pool";
    ConnectionOption["SINGLE"] = "single";
    ConnectionOption["CLUSTER"] = "cluster";
})(ConnectionOption || (ConnectionOption = {}));
// ============================================================================
// ADDITIONAL OPTION ENUMS
// ============================================================================
export var SessionOption;
(function (SessionOption) {
    SessionOption["JWT"] = "jwt";
    SessionOption["DATABASE"] = "database";
    SessionOption["REDIS"] = "redis";
    SessionOption["COOKIE"] = "cookie";
    SessionOption["STATELESS"] = "stateless";
    SessionOption["STATEFUL"] = "stateful";
})(SessionOption || (SessionOption = {}));
export var SecurityOption;
(function (SecurityOption) {
    SecurityOption["CSRF_PROTECTION"] = "csrf-protection";
    SecurityOption["RATE_LIMITING"] = "rate-limiting";
    SecurityOption["PASSWORD_POLICY"] = "password-policy";
    SecurityOption["SESSION_TIMEOUT"] = "session-timeout";
    SecurityOption["IP_WHITELIST"] = "ip-whitelist";
    SecurityOption["TWO_FACTOR"] = "two-factor";
    SecurityOption["ENCRYPTION"] = "encryption";
    SecurityOption["AUDIT_LOGGING"] = "audit-logging";
})(SecurityOption || (SecurityOption = {}));
export var PaymentFeature;
(function (PaymentFeature) {
    PaymentFeature["SUBSCRIPTIONS"] = "subscriptions";
    PaymentFeature["ONE_TIME_PAYMENTS"] = "one-time-payments";
    PaymentFeature["REFUNDS"] = "refunds";
    PaymentFeature["DISPUTES"] = "disputes";
    PaymentFeature["INVOICING"] = "invoicing";
    PaymentFeature["TAX_CALCULATION"] = "tax-calculation";
    PaymentFeature["CURRENCY_CONVERSION"] = "currency-conversion";
    PaymentFeature["FRAUD_DETECTION"] = "fraud-detection";
})(PaymentFeature || (PaymentFeature = {}));
export var EmailFeature;
(function (EmailFeature) {
    EmailFeature["TEMPLATES"] = "templates";
    EmailFeature["ATTACHMENTS"] = "attachments";
    EmailFeature["SCHEDULING"] = "scheduling";
    EmailFeature["TRACKING"] = "tracking";
    EmailFeature["BOUNCE_HANDLING"] = "bounce-handling";
    EmailFeature["SPAM_PROTECTION"] = "spam-protection";
    EmailFeature["BULK_SENDING"] = "bulk-sending";
    EmailFeature["PERSONALIZATION"] = "personalization";
})(EmailFeature || (EmailFeature = {}));
export var TemplateOption;
(function (TemplateOption) {
    TemplateOption["WELCOME"] = "welcome";
    TemplateOption["PASSWORD_RESET"] = "password-reset";
    TemplateOption["EMAIL_VERIFICATION"] = "email-verification";
    TemplateOption["NOTIFICATION"] = "notification";
    TemplateOption["MARKETING"] = "marketing";
    TemplateOption["INVOICE"] = "invoice";
    TemplateOption["RECEIPT"] = "receipt";
    TemplateOption["CUSTOM"] = "custom";
})(TemplateOption || (TemplateOption = {}));
export var AnalyticsOption;
(function (AnalyticsOption) {
    AnalyticsOption["PAGE_VIEWS"] = "page-views";
    AnalyticsOption["USER_BEHAVIOR"] = "user-behavior";
    AnalyticsOption["PERFORMANCE"] = "performance";
    AnalyticsOption["ERRORS"] = "errors";
    AnalyticsOption["CONVERSIONS"] = "conversions";
    AnalyticsOption["FUNNELS"] = "funnels";
    AnalyticsOption["SEGMENTATION"] = "segmentation";
    AnalyticsOption["REAL_TIME"] = "real-time";
})(AnalyticsOption || (AnalyticsOption = {}));
export var AlertOption;
(function (AlertOption) {
    AlertOption["ERROR_RATE"] = "error-rate";
    AlertOption["PERFORMANCE_DEGRADATION"] = "performance-degradation";
    AlertOption["UPTIME"] = "uptime";
    AlertOption["CUSTOM_METRICS"] = "custom-metrics";
    AlertOption["SECURITY_EVENTS"] = "security-events";
    AlertOption["COST_THRESHOLDS"] = "cost-thresholds";
    AlertOption["USER_FEEDBACK"] = "user-feedback";
})(AlertOption || (AlertOption = {}));
export var BlockchainNetwork;
(function (BlockchainNetwork) {
    BlockchainNetwork["ETHEREUM"] = "ethereum";
    BlockchainNetwork["POLYGON"] = "polygon";
    BlockchainNetwork["BINANCE_SMART_CHAIN"] = "bsc";
    BlockchainNetwork["SOLANA"] = "solana";
    BlockchainNetwork["CARDANO"] = "cardano";
    BlockchainNetwork["POLKADOT"] = "polkadot";
    BlockchainNetwork["COSMOS"] = "cosmos";
    BlockchainNetwork["ARBITRUM"] = "arbitrum";
})(BlockchainNetwork || (BlockchainNetwork = {}));
export var SmartContractOption;
(function (SmartContractOption) {
    SmartContractOption["ERC20"] = "erc20";
    SmartContractOption["ERC721"] = "erc721";
    SmartContractOption["ERC1155"] = "erc1155";
    SmartContractOption["DEFI_PROTOCOLS"] = "defi-protocols";
    SmartContractOption["NFT_MARKETPLACE"] = "nft-marketplace";
    SmartContractOption["DAO"] = "dao";
    SmartContractOption["CUSTOM"] = "custom";
})(SmartContractOption || (SmartContractOption = {}));
export var WalletOption;
(function (WalletOption) {
    WalletOption["METAMASK"] = "metamask";
    WalletOption["WALLET_CONNECT"] = "wallet-connect";
    WalletOption["COINBASE_WALLET"] = "coinbase-wallet";
    WalletOption["PHANTOM"] = "phantom";
    WalletOption["TRUST_WALLET"] = "trust-wallet";
    WalletOption["CUSTOM"] = "custom";
})(WalletOption || (WalletOption = {}));
export var FrameworkOption;
(function (FrameworkOption) {
    FrameworkOption["NEXTJS"] = "nextjs";
    FrameworkOption["REACT"] = "react";
    FrameworkOption["VUE"] = "vue";
    FrameworkOption["NUXT"] = "nuxt";
    FrameworkOption["SVELTE"] = "svelte";
    FrameworkOption["ANGULAR"] = "angular";
    FrameworkOption["EXPO"] = "expo";
    FrameworkOption["REACT_NATIVE"] = "react-native";
})(FrameworkOption || (FrameworkOption = {}));
export var BuildOption;
(function (BuildOption) {
    BuildOption["WEBPACK"] = "webpack";
    BuildOption["VITE"] = "vite";
    BuildOption["TURBOPACK"] = "turbopack";
    BuildOption["ESBUILD"] = "esbuild";
    BuildOption["ROLLUP"] = "rollup";
    BuildOption["PARCEL"] = "parcel";
})(BuildOption || (BuildOption = {}));
export var DeploymentOption;
(function (DeploymentOption) {
    DeploymentOption["STATIC"] = "static";
    DeploymentOption["SSR"] = "ssr";
    DeploymentOption["SSG"] = "ssg";
    DeploymentOption["ISR"] = "isr";
    DeploymentOption["EDGE"] = "edge";
    DeploymentOption["CONTAINER"] = "container";
    DeploymentOption["SERVERLESS"] = "serverless";
})(DeploymentOption || (DeploymentOption = {}));
// ============================================================================
// COMPATIBILITY MATRIX
// ============================================================================
export const DATABASE_ORM_COMPATIBILITY = {
    // PostgreSQL-based databases
    [DATABASE_PROVIDERS.NEON]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.SUPABASE]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.VERCEL_POSTGRES]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.LOCAL_POSTGRES]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    // MySQL-based databases
    [DATABASE_PROVIDERS.PLANETSCALE]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.PLANETSCALE_MYSQL]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.MYSQL]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.LOCAL_MYSQL]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.TYPEORM, ORM_LIBRARIES.KYSELY],
    // SQLite-based databases
    [DATABASE_PROVIDERS.TURSO]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.SQLITE]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.KYSELY],
    [DATABASE_PROVIDERS.LOCAL_SQLITE]: [ORM_LIBRARIES.DRIZZLE, ORM_LIBRARIES.PRISMA, ORM_LIBRARIES.KYSELY],
    // Document databases
    [DATABASE_PROVIDERS.MONGODB]: [ORM_LIBRARIES.MONGOOSE, ORM_LIBRARIES.PRISMA_MONGO],
    [DATABASE_PROVIDERS.MONGODB_ATLAS]: [ORM_LIBRARIES.MONGOOSE, ORM_LIBRARIES.PRISMA_MONGO]
};
// ============================================================================
// SHARED ENUMS
// ============================================================================
/**
 * Project Types
 */
export var ProjectType;
(function (ProjectType) {
    ProjectType["NEXTJS"] = "nextjs";
    ProjectType["REACT"] = "react";
    ProjectType["VUE"] = "vue";
    ProjectType["NUXT"] = "nuxt";
    ProjectType["SVELTE"] = "svelte";
    ProjectType["ANGULAR"] = "angular";
    ProjectType["EXPO"] = "expo";
    ProjectType["REACT_NATIVE"] = "react-native";
    ProjectType["ELECTRON"] = "electron";
    ProjectType["TAURI"] = "tauri";
    ProjectType["NODE"] = "node";
    ProjectType["EXPRESS"] = "express";
    ProjectType["FASTIFY"] = "fastify";
    ProjectType["NESTJS"] = "nestjs";
    ProjectType["CUSTOM"] = "custom";
})(ProjectType || (ProjectType = {}));
/**
 * Target Platforms
 */
export var TargetPlatform;
(function (TargetPlatform) {
    TargetPlatform["WEB"] = "web";
    TargetPlatform["MOBILE"] = "mobile";
    TargetPlatform["DESKTOP"] = "desktop";
    TargetPlatform["SERVER"] = "server";
    TargetPlatform["CLI"] = "cli";
})(TargetPlatform || (TargetPlatform = {}));
/**
 * Log Levels
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["SUCCESS"] = "success";
})(LogLevel || (LogLevel = {}));
/**
 * Standardized Path Keys - Framework-Agnostic Path Resolution
 *
 * These semantic path keys are used in blueprints with {{paths.key}} syntax
 * to create framework-agnostic file paths. Each framework adapter must provide
 * concrete implementations for all these path keys in their adapter.json.
 */
export var PathKey;
(function (PathKey) {
    // Core Framework Paths
    PathKey["SOURCE_ROOT"] = "source_root";
    PathKey["APP_ROOT"] = "app_root";
    PathKey["PAGES_ROOT"] = "pages_root";
    // Library and Utility Paths
    PathKey["SHARED_LIBRARY"] = "shared_library";
    PathKey["UTILS"] = "utils";
    PathKey["TYPES"] = "types";
    PathKey["HOOKS"] = "hooks";
    PathKey["STORES"] = "stores";
    // Component Paths
    PathKey["COMPONENTS"] = "components";
    PathKey["UI_COMPONENTS"] = "ui_components";
    PathKey["LAYOUTS"] = "layouts";
    PathKey["PROVIDERS"] = "providers";
    // API and Route Paths
    PathKey["API_ROUTES"] = "api_routes";
    PathKey["API_HANDLERS"] = "api_handlers";
    PathKey["MIDDLEWARE"] = "middleware";
    // Configuration Paths
    PathKey["CONFIG"] = "config";
    PathKey["ENV"] = "env";
    PathKey["SCRIPTS"] = "scripts";
    // Feature-Specific Configuration Paths
    PathKey["DATABASE_CONFIG"] = "database_config";
    PathKey["AUTH_CONFIG"] = "auth_config";
    PathKey["PAYMENT_CONFIG"] = "payment_config";
    PathKey["EMAIL_CONFIG"] = "email_config";
    PathKey["OBSERVABILITY_CONFIG"] = "observability_config";
    PathKey["STATE_CONFIG"] = "state_config";
    PathKey["TESTING_CONFIG"] = "testing_config";
    PathKey["DEPLOYMENT_CONFIG"] = "deployment_config";
    PathKey["CONTENT_CONFIG"] = "content_config";
    PathKey["BLOCKCHAIN_CONFIG"] = "blockchain_config";
    // Asset and Static Paths
    PathKey["ASSETS"] = "assets";
    PathKey["PUBLIC"] = "public";
    PathKey["STATIC"] = "static";
    PathKey["STYLES"] = "styles";
    // Testing Paths
    PathKey["TESTS"] = "tests";
    PathKey["TEST_UTILS"] = "test_utils";
    PathKey["MOCKS"] = "mocks";
    // Build and Output Paths
    PathKey["BUILD"] = "build";
    PathKey["DIST"] = "dist";
    PathKey["OUT"] = "out";
    // Documentation Paths
    PathKey["DOCS"] = "docs";
    PathKey["README"] = "readme";
})(PathKey || (PathKey = {}));
// ============================================================================
// CONSTANTS
// ============================================================================
export const DEFAULT_TIMEOUT = 300000; // 5 minutes
export const SUPPORTED_PROJECT_TYPES = Object.values(ProjectType);
export const SUPPORTED_TARGET_PLATFORMS = Object.values(TargetPlatform);
export const ERROR_CODES = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    EXECUTION_FAILED: 'EXECUTION_FAILED',
    DEPENDENCY_MISSING: 'DEPENDENCY_MISSING',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    TIMEOUT: 'TIMEOUT',
    ROLLBACK_FAILED: 'ROLLBACK_FAILED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};
