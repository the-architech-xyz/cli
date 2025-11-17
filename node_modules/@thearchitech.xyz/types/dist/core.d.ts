/**
 * Core Types - Single Source of Truth
 *
 * Fundamental types and enums used across the entire Architech system.
 * This is the foundation that both agents and plugins build upon.
 */
/**
 * Database Providers (Infrastructure Layer)
 */
export declare const DATABASE_PROVIDERS: {
    readonly NEON: "neon";
    readonly SUPABASE: "supabase";
    readonly VERCEL_POSTGRES: "vercel-postgres";
    readonly PLANETSCALE: "planetscale";
    readonly MONGODB: "mongodb";
    readonly MONGODB_ATLAS: "mongodb-atlas";
    readonly TURSO: "turso";
    readonly SQLITE: "sqlite";
    readonly MYSQL: "mysql";
    readonly PLANETSCALE_MYSQL: "planetscale-mysql";
    readonly LOCAL_POSTGRES: "local-postgres";
    readonly LOCAL_MYSQL: "local-mysql";
    readonly LOCAL_SQLITE: "local-sqlite";
};
export type DatabaseProvider = typeof DATABASE_PROVIDERS[keyof typeof DATABASE_PROVIDERS];
/**
 * ORM Libraries (Data Access Layer)
 */
export declare const ORM_LIBRARIES: {
    readonly DRIZZLE: "drizzle";
    readonly PRISMA: "prisma";
    readonly TYPEORM: "typeorm";
    readonly KYSELY: "kysely";
    readonly SEQUELIZE: "sequelize";
    readonly MONGOOSE: "mongoose";
    readonly PRISMA_MONGO: "prisma-mongo";
    readonly D1: "d1";
    readonly UPSTASH_REDIS: "upstash-redis";
    readonly KNEX: "knex";
};
export type ORMLibrary = typeof ORM_LIBRARIES[keyof typeof ORM_LIBRARIES];
/**
 * Authentication Providers
 */
export declare const AUTH_PROVIDERS: {
    readonly EMAIL: "email";
    readonly GITHUB: "github";
    readonly GOOGLE: "google";
    readonly DISCORD: "discord";
    readonly TWITTER: "twitter";
    readonly FACEBOOK: "facebook";
    readonly APPLE: "apple";
    readonly MICROSOFT: "microsoft";
    readonly LINKEDIN: "linkedin";
    readonly GITLAB: "gitlab";
    readonly BITBUCKET: "bitbucket";
    readonly TWITCH: "twitch";
    readonly SPOTIFY: "spotify";
    readonly SLACK: "slack";
    readonly NOTION: "notion";
    readonly LINEAR: "linear";
    readonly FIGMA: "figma";
    readonly CUSTOM: "custom";
};
export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];
/**
 * UI Libraries
 */
export declare const UI_LIBRARIES: {
    readonly SHADCN_UI: "shadcn-ui";
    readonly CHAKRA_UI: "chakra-ui";
    readonly MATERIAL_UI: "mui";
    readonly ANT_DESIGN: "antd";
    readonly RADIX_UI: "radix";
    readonly MANTINE: "mantine";
    readonly HEADLESS_UI: "headless-ui";
    readonly ARIANE: "ariane";
    readonly NEXT_UI: "next-ui";
    readonly DAISY_UI: "daisy-ui";
    readonly TAMAGUI: "tamagui";
    readonly EMOTION: "emotion";
    readonly STYLED_COMPONENTS: "styled-components";
    readonly TAILWIND: "tailwind";
    readonly CSS_MODULES: "css-modules";
};
export type UILibrary = typeof UI_LIBRARIES[keyof typeof UI_LIBRARIES];
/**
 * Deployment Platforms
 */
export declare const DEPLOYMENT_PLATFORMS: {
    readonly VERCEL: "vercel";
    readonly RAILWAY: "railway";
    readonly NETLIFY: "netlify";
    readonly AWS: "aws";
    readonly GCP: "gcp";
    readonly AZURE: "azure";
    readonly DIGITAL_OCEAN: "digitalocean";
    readonly HEROKU: "heroku";
    readonly FLY: "fly";
    readonly RENDER: "render";
    readonly CLOUDFLARE: "cloudflare";
    readonly DOCKER: "docker";
    readonly KUBERNETES: "kubernetes";
};
export type DeploymentPlatform = typeof DEPLOYMENT_PLATFORMS[keyof typeof DEPLOYMENT_PLATFORMS];
/**
 * Email Services
 */
export declare const EMAIL_SERVICES: {
    readonly RESEND: "resend";
    readonly SENDGRID: "sendgrid";
    readonly MAILGUN: "mailgun";
    readonly SES: "ses";
    readonly POSTMARK: "postmark";
    readonly MAILCHIMP: "mailchimp";
    readonly CONVERTKIT: "convertkit";
    readonly CUSTOM: "custom";
};
export type EmailService = typeof EMAIL_SERVICES[keyof typeof EMAIL_SERVICES];
/**
 * Testing Frameworks
 */
export declare const TESTING_FRAMEWORKS: {
    readonly VITEST: "vitest";
    readonly JEST: "jest";
    readonly PLAYWRIGHT: "playwright";
    readonly CYPRESS: "cypress";
    readonly TESTING_LIBRARY: "testing-library";
    readonly MSW: "msw";
    readonly HAPPY_DOM: "happy-dom";
    readonly JSDOM: "jsdom";
};
export type TestingFramework = typeof TESTING_FRAMEWORKS[keyof typeof TESTING_FRAMEWORKS];
/**
 * Payment Providers
 */
export declare const PAYMENT_PROVIDERS: {
    readonly STRIPE: "stripe";
    readonly PAYPAL: "paypal";
    readonly SQUARE: "square";
    readonly PADDLE: "paddle";
    readonly CHARGEBEE: "chargebee";
    readonly RECURLY: "recurly";
    readonly CUSTOM: "custom";
};
export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];
/**
 * Monitoring Services
 */
export declare const MONITORING_SERVICES: {
    readonly SENTRY: "sentry";
    readonly VERCEL_ANALYTICS: "vercel-analytics";
    readonly GOOGLE_ANALYTICS: "google-analytics";
    readonly POSTHOG: "posthog";
    readonly MIXPANEL: "mixpanel";
    readonly AMPLITUDE: "amplitude";
    readonly HOTJAR: "hotjar";
    readonly CUSTOM: "custom";
};
export type MonitoringService = typeof MONITORING_SERVICES[keyof typeof MONITORING_SERVICES];
/**
 * Database Plugin Configuration
 */
export interface DatabasePluginConfig {
    provider: DatabaseProvider;
    connectionString?: string;
    connection?: {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        database?: string;
        ssl?: boolean;
    };
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
    features: DatabaseFeature[];
    ormType: ORMOption;
    orm?: ORMOption;
}
export interface NeonConfig extends DatabasePluginConfig {
    provider: 'neon';
    connectionString: string;
}
export interface SupabaseConfig extends DatabasePluginConfig {
    provider: 'supabase';
    connectionString: string;
}
export interface MongoDBConfig extends DatabasePluginConfig {
    provider: 'mongodb';
    connectionString: string;
}
export interface LocalConfig extends DatabasePluginConfig {
    provider: 'local-sqlite' | 'local-postgres' | 'local-mysql';
    database: string;
}
/**
 * UI Plugin Configuration
 */
export interface UIPluginConfig {
    library: UILibrary;
    theme: ThemeOption;
    styling: StylingOption;
    components: ComponentOption[];
    customizations?: Record<string, any>;
}
export interface ShadcnUIConfig extends UIPluginConfig {
    library: 'shadcn-ui';
    components: ComponentOption[];
    theme: ThemeOption.LIGHT | ThemeOption.DARK | ThemeOption.SYSTEM;
}
export interface ChakraUIConfig extends UIPluginConfig {
    library: 'chakra-ui';
    theme: ThemeOption.LIGHT | ThemeOption.DARK | ThemeOption.SYSTEM;
}
export interface MUIConfig extends UIPluginConfig {
    library: 'mui';
    theme: ThemeOption.LIGHT | ThemeOption.DARK | ThemeOption.SYSTEM;
}
/**
 * Auth Plugin Configuration
 */
export interface AuthPluginConfig {
    providers: AuthProvider[];
    session: SessionConfig;
    security: SecurityConfig;
    features: AuthFeature[];
}
export interface BetterAuthConfig extends AuthPluginConfig {
    providers: AuthProvider[];
    session: SessionConfig;
}
export interface NextAuthConfig extends AuthPluginConfig {
    providers: AuthProvider[];
    session: SessionConfig & {
        duration: number;
    };
}
/**
 * Testing Plugin Configuration
 */
export interface TestingPluginConfig {
    framework: TestingFramework;
    types: TestType[];
    coverage: CoverageOption;
    environment: 'jsdom' | 'happy-dom' | 'node';
}
export declare enum DatabaseFeature {
    MIGRATIONS = "migrations",
    SEEDING = "seeding",
    BACKUP = "backup",
    MONITORING = "monitoring",
    REPLICATION = "replication",
    SHARDING = "sharding",
    CACHING = "caching",
    ENCRYPTION = "encryption"
}
export declare enum ORMOption {
    DRIZZLE = "drizzle",
    PRISMA = "prisma",
    TYPEORM = "typeorm",
    KYSELY = "kysely",
    MONGOOSE = "mongoose",
    SEQUELIZE = "sequelize"
}
export declare enum ComponentOption {
    BUTTON = "button",
    INPUT = "input",
    CARD = "card",
    MODAL = "modal",
    NAVIGATION = "navigation",
    FORM = "form",
    TABLE = "table",
    CHART = "chart",
    CALENDAR = "calendar",
    DROPDOWN = "dropdown",
    TOOLTIP = "tooltip",
    BADGE = "badge",
    AVATAR = "avatar",
    PROGRESS = "progress",
    ALERT = "alert"
}
export declare enum ThemeOption {
    LIGHT = "light",
    DARK = "dark",
    SYSTEM = "system",
    CUSTOM = "custom"
}
export declare enum StylingOption {
    TAILWIND = "tailwind",
    CSS_MODULES = "css-modules",
    STYLED_COMPONENTS = "styled-components",
    EMOTION = "emotion",
    SASS = "sass",
    LESS = "less"
}
export declare enum AuthFeature {
    EMAIL_VERIFICATION = "email-verification",
    TWO_FACTOR = "two-factor",
    SOCIAL_LOGIN = "social-login",
    PASSWORD_RESET = "password-reset",
    SESSION_MANAGEMENT = "session-management",
    ROLE_BASED_ACCESS = "role-based-access",
    API_KEYS = "api-keys",
    OAUTH = "oauth"
}
export declare enum SessionConfig {
    JWT = "jwt",
    DATABASE = "database",
    REDIS = "redis",
    COOKIE = "cookie"
}
export declare enum SecurityConfig {
    CSRF_PROTECTION = "csrf-protection",
    RATE_LIMITING = "rate-limiting",
    PASSWORD_POLICY = "password-policy",
    SESSION_TIMEOUT = "session-timeout",
    IP_WHITELIST = "ip-whitelist"
}
export declare enum TestType {
    UNIT = "unit",
    INTEGRATION = "integration",
    E2E = "e2e",
    COMPONENT = "component",
    API = "api",
    VISUAL = "visual"
}
export declare enum CoverageOption {
    NONE = "none",
    BASIC = "basic",
    FULL = "full",
    CUSTOM = "custom"
}
export declare enum ConnectionOption {
    POOL = "pool",
    SINGLE = "single",
    CLUSTER = "cluster"
}
export declare enum SessionOption {
    JWT = "jwt",
    DATABASE = "database",
    REDIS = "redis",
    COOKIE = "cookie",
    STATELESS = "stateless",
    STATEFUL = "stateful"
}
export declare enum SecurityOption {
    CSRF_PROTECTION = "csrf-protection",
    RATE_LIMITING = "rate-limiting",
    PASSWORD_POLICY = "password-policy",
    SESSION_TIMEOUT = "session-timeout",
    IP_WHITELIST = "ip-whitelist",
    TWO_FACTOR = "two-factor",
    ENCRYPTION = "encryption",
    AUDIT_LOGGING = "audit-logging"
}
export declare enum PaymentFeature {
    SUBSCRIPTIONS = "subscriptions",
    ONE_TIME_PAYMENTS = "one-time-payments",
    REFUNDS = "refunds",
    DISPUTES = "disputes",
    INVOICING = "invoicing",
    TAX_CALCULATION = "tax-calculation",
    CURRENCY_CONVERSION = "currency-conversion",
    FRAUD_DETECTION = "fraud-detection"
}
export declare enum EmailFeature {
    TEMPLATES = "templates",
    ATTACHMENTS = "attachments",
    SCHEDULING = "scheduling",
    TRACKING = "tracking",
    BOUNCE_HANDLING = "bounce-handling",
    SPAM_PROTECTION = "spam-protection",
    BULK_SENDING = "bulk-sending",
    PERSONALIZATION = "personalization"
}
export declare enum TemplateOption {
    WELCOME = "welcome",
    PASSWORD_RESET = "password-reset",
    EMAIL_VERIFICATION = "email-verification",
    NOTIFICATION = "notification",
    MARKETING = "marketing",
    INVOICE = "invoice",
    RECEIPT = "receipt",
    CUSTOM = "custom"
}
export declare enum AnalyticsOption {
    PAGE_VIEWS = "page-views",
    USER_BEHAVIOR = "user-behavior",
    PERFORMANCE = "performance",
    ERRORS = "errors",
    CONVERSIONS = "conversions",
    FUNNELS = "funnels",
    SEGMENTATION = "segmentation",
    REAL_TIME = "real-time"
}
export declare enum AlertOption {
    ERROR_RATE = "error-rate",
    PERFORMANCE_DEGRADATION = "performance-degradation",
    UPTIME = "uptime",
    CUSTOM_METRICS = "custom-metrics",
    SECURITY_EVENTS = "security-events",
    COST_THRESHOLDS = "cost-thresholds",
    USER_FEEDBACK = "user-feedback"
}
export declare enum BlockchainNetwork {
    ETHEREUM = "ethereum",
    POLYGON = "polygon",
    BINANCE_SMART_CHAIN = "bsc",
    SOLANA = "solana",
    CARDANO = "cardano",
    POLKADOT = "polkadot",
    COSMOS = "cosmos",
    ARBITRUM = "arbitrum"
}
export declare enum SmartContractOption {
    ERC20 = "erc20",
    ERC721 = "erc721",
    ERC1155 = "erc1155",
    DEFI_PROTOCOLS = "defi-protocols",
    NFT_MARKETPLACE = "nft-marketplace",
    DAO = "dao",
    CUSTOM = "custom"
}
export declare enum WalletOption {
    METAMASK = "metamask",
    WALLET_CONNECT = "wallet-connect",
    COINBASE_WALLET = "coinbase-wallet",
    PHANTOM = "phantom",
    TRUST_WALLET = "trust-wallet",
    CUSTOM = "custom"
}
export declare enum FrameworkOption {
    NEXTJS = "nextjs",
    REACT = "react",
    VUE = "vue",
    NUXT = "nuxt",
    SVELTE = "svelte",
    ANGULAR = "angular",
    EXPO = "expo",
    REACT_NATIVE = "react-native"
}
export declare enum BuildOption {
    WEBPACK = "webpack",
    VITE = "vite",
    TURBOPACK = "turbopack",
    ESBUILD = "esbuild",
    ROLLUP = "rollup",
    PARCEL = "parcel"
}
export declare enum DeploymentOption {
    STATIC = "static",
    SSR = "ssr",
    SSG = "ssg",
    ISR = "isr",
    EDGE = "edge",
    CONTAINER = "container",
    SERVERLESS = "serverless"
}
export declare const DATABASE_ORM_COMPATIBILITY: Record<DatabaseProvider, ORMLibrary[]>;
/**
 * Project Types
 */
export declare enum ProjectType {
    NEXTJS = "nextjs",
    REACT = "react",
    VUE = "vue",
    NUXT = "nuxt",
    SVELTE = "svelte",
    ANGULAR = "angular",
    EXPO = "expo",
    REACT_NATIVE = "react-native",
    ELECTRON = "electron",
    TAURI = "tauri",
    NODE = "node",
    EXPRESS = "express",
    FASTIFY = "fastify",
    NESTJS = "nestjs",
    CUSTOM = "custom"
}
/**
 * Target Platforms
 */
export declare enum TargetPlatform {
    WEB = "web",
    MOBILE = "mobile",
    DESKTOP = "desktop",
    SERVER = "server",
    CLI = "cli"
}
/**
 * Log Levels
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    SUCCESS = "success"
}
/**
 * Standardized Path Keys - Framework-Agnostic Path Resolution
 *
 * These semantic path keys are used in blueprints with {{paths.key}} syntax
 * to create framework-agnostic file paths. Each framework adapter must provide
 * concrete implementations for all these path keys in their adapter.json.
 */
export declare enum PathKey {
    WORKSPACE_ROOT = "workspace.root",
    WORKSPACE_SCRIPTS = "workspace.scripts",
    WORKSPACE_DOCS = "workspace.docs",
    WORKSPACE_ENV = "workspace.env",
    WORKSPACE_CONFIG = "workspace.config",
    APPS_WEB_ROOT = "apps.web.root",
    APPS_WEB_SRC = "apps.web.src",
    APPS_WEB_APP = "apps.web.app",
    APPS_WEB_COMPONENTS = "apps.web.components",
    APPS_WEB_PUBLIC = "apps.web.public",
    APPS_WEB_MIDDLEWARE = "apps.web.middleware",
    APPS_WEB_SERVER = "apps.web.server",
    APPS_WEB_COLLECTIONS = "apps.web.collections",
    APPS_API_ROOT = "apps.api.root",
    APPS_API_SRC = "apps.api.src",
    APPS_API_ROUTES = "apps.api.routes",
    PACKAGES_SHARED_ROOT = "packages.shared.root",
    PACKAGES_SHARED_SRC = "packages.shared.src",
    PACKAGES_SHARED_COMPONENTS = "packages.shared.src.components",
    PACKAGES_SHARED_HOOKS = "packages.shared.src.hooks",
    PACKAGES_SHARED_PROVIDERS = "packages.shared.src.providers",
    PACKAGES_SHARED_STORES = "packages.shared.src.stores",
    PACKAGES_SHARED_TYPES = "packages.shared.src.types",
    PACKAGES_SHARED_UTILS = "packages.shared.src.utils",
    PACKAGES_SHARED_SCRIPTS = "packages.shared.src.scripts",
    PACKAGES_SHARED_ROUTES = "packages.shared.src.routes",
    PACKAGES_SHARED_JOBS = "packages.shared.src.jobs",
    PACKAGES_DATABASE_ROOT = "packages.database.root",
    PACKAGES_DATABASE_SRC = "packages.database.src",
    PACKAGES_UI_ROOT = "packages.ui.root",
    PACKAGES_UI_SRC = "packages.ui.src"
}
import type { MarketplacePathKeyDefinition, MarketplacePathKeys as MarketplacePathKeysSchema } from './path-keys.js';
export type PathKeyDefinition = MarketplacePathKeyDefinition;
export type MarketplacePathKeys = MarketplacePathKeysSchema;
/**
 * Validation Result - Used by both agents and plugins
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
    suggestions?: string[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
}
/**
 * Artifact - Generated by both agents and plugins
 */
export interface Artifact {
    type: 'file' | 'directory' | 'config' | 'script' | 'template';
    path: string;
    content?: string;
    metadata?: Record<string, any>;
    size?: number;
    checksum?: string;
    description?: string;
}
/**
 * Logger - Used throughout the system
 */
export interface Logger {
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error, data?: any): void;
    debug(message: string, data?: any): void;
    success(message: string, data?: any): void;
    log(level: LogLevel, message: string, context?: LogContext): void;
}
export interface LogContext {
    agent?: string;
    step?: string;
    duration?: number;
    data?: any;
    error?: string;
    stack?: string;
}
/**
 * Environment Information
 */
export interface EnvironmentInfo {
    nodeVersion: string;
    platform: string;
    arch: string;
    cwd: string;
    env: Record<string, string>;
}
/**
 * User Context
 */
export interface UserContext {
    id?: string;
    preferences?: Record<string, any>;
    permissions?: string[];
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export declare const DEFAULT_TIMEOUT = 300000;
export declare const SUPPORTED_PROJECT_TYPES: ProjectType[];
export declare const SUPPORTED_TARGET_PLATFORMS: TargetPlatform[];
export declare const ERROR_CODES: {
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly EXECUTION_FAILED: "EXECUTION_FAILED";
    readonly DEPENDENCY_MISSING: "DEPENDENCY_MISSING";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly TIMEOUT: "TIMEOUT";
    readonly ROLLBACK_FAILED: "ROLLBACK_FAILED";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
