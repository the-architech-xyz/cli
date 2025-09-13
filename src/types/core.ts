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
} as const;

export type DatabaseProvider = typeof DATABASE_PROVIDERS[keyof typeof DATABASE_PROVIDERS];

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
} as const;

export type ORMLibrary = typeof ORM_LIBRARIES[keyof typeof ORM_LIBRARIES];

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
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

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
} as const;

export type UILibrary = typeof UI_LIBRARIES[keyof typeof UI_LIBRARIES];

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
} as const;

export type DeploymentPlatform = typeof DEPLOYMENT_PLATFORMS[keyof typeof DEPLOYMENT_PLATFORMS];

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
} as const;

export type EmailService = typeof EMAIL_SERVICES[keyof typeof EMAIL_SERVICES];

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
} as const;

export type TestingFramework = typeof TESTING_FRAMEWORKS[keyof typeof TESTING_FRAMEWORKS];

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
} as const;

export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];

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
} as const;

export type MonitoringService = typeof MONITORING_SERVICES[keyof typeof MONITORING_SERVICES];

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

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
  session: SessionConfig & { duration: number };
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

// ============================================================================
// FEATURE ENUMS
// ============================================================================

export enum DatabaseFeature {
  MIGRATIONS = 'migrations',
  SEEDING = 'seeding',
  BACKUP = 'backup',
  MONITORING = 'monitoring',
  REPLICATION = 'replication',
  SHARDING = 'sharding',
  CACHING = 'caching',
  ENCRYPTION = 'encryption'
}

export enum ORMOption {
  DRIZZLE = 'drizzle',
  PRISMA = 'prisma',
  TYPEORM = 'typeorm',
  KYSELY = 'kysely',
  MONGOOSE = 'mongoose',
  SEQUELIZE = 'sequelize'
}

export enum ComponentOption {
  BUTTON = 'button',
  INPUT = 'input',
  CARD = 'card',
  MODAL = 'modal',
  NAVIGATION = 'navigation',
  FORM = 'form',
  TABLE = 'table',
  CHART = 'chart',
  CALENDAR = 'calendar',
  DROPDOWN = 'dropdown',
  TOOLTIP = 'tooltip',
  BADGE = 'badge',
  AVATAR = 'avatar',
  PROGRESS = 'progress',
  ALERT = 'alert'
}

export enum ThemeOption {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

export enum StylingOption {
  TAILWIND = 'tailwind',
  CSS_MODULES = 'css-modules',
  STYLED_COMPONENTS = 'styled-components',
  EMOTION = 'emotion',
  SASS = 'sass',
  LESS = 'less'
}

export enum AuthFeature {
  EMAIL_VERIFICATION = 'email-verification',
  TWO_FACTOR = 'two-factor',
  SOCIAL_LOGIN = 'social-login',
  PASSWORD_RESET = 'password-reset',
  SESSION_MANAGEMENT = 'session-management',
  ROLE_BASED_ACCESS = 'role-based-access',
  API_KEYS = 'api-keys',
  OAUTH = 'oauth'
}

export enum SessionConfig {
  JWT = 'jwt',
  DATABASE = 'database',
  REDIS = 'redis',
  COOKIE = 'cookie'
}

export enum SecurityConfig {
  CSRF_PROTECTION = 'csrf-protection',
  RATE_LIMITING = 'rate-limiting',
  PASSWORD_POLICY = 'password-policy',
  SESSION_TIMEOUT = 'session-timeout',
  IP_WHITELIST = 'ip-whitelist'
}

export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  COMPONENT = 'component',
  API = 'api',
  VISUAL = 'visual'
}

export enum CoverageOption {
  NONE = 'none',
  BASIC = 'basic',
  FULL = 'full',
  CUSTOM = 'custom'
}

export enum ConnectionOption {
  POOL = 'pool',
  SINGLE = 'single',
  CLUSTER = 'cluster'
}

// ============================================================================
// ADDITIONAL OPTION ENUMS
// ============================================================================

export enum SessionOption {
  JWT = 'jwt',
  DATABASE = 'database',
  REDIS = 'redis',
  COOKIE = 'cookie',
  STATELESS = 'stateless',
  STATEFUL = 'stateful'
}

export enum SecurityOption {
  CSRF_PROTECTION = 'csrf-protection',
  RATE_LIMITING = 'rate-limiting',
  PASSWORD_POLICY = 'password-policy',
  SESSION_TIMEOUT = 'session-timeout',
  IP_WHITELIST = 'ip-whitelist',
  TWO_FACTOR = 'two-factor',
  ENCRYPTION = 'encryption',
  AUDIT_LOGGING = 'audit-logging'
}

export enum PaymentFeature {
  SUBSCRIPTIONS = 'subscriptions',
  ONE_TIME_PAYMENTS = 'one-time-payments',
  REFUNDS = 'refunds',
  DISPUTES = 'disputes',
  INVOICING = 'invoicing',
  TAX_CALCULATION = 'tax-calculation',
  CURRENCY_CONVERSION = 'currency-conversion',
  FRAUD_DETECTION = 'fraud-detection'
}

export enum EmailFeature {
  TEMPLATES = 'templates',
  ATTACHMENTS = 'attachments',
  SCHEDULING = 'scheduling',
  TRACKING = 'tracking',
  BOUNCE_HANDLING = 'bounce-handling',
  SPAM_PROTECTION = 'spam-protection',
  BULK_SENDING = 'bulk-sending',
  PERSONALIZATION = 'personalization'
}

export enum TemplateOption {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  NOTIFICATION = 'notification',
  MARKETING = 'marketing',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  CUSTOM = 'custom'
}

export enum AnalyticsOption {
  PAGE_VIEWS = 'page-views',
  USER_BEHAVIOR = 'user-behavior',
  PERFORMANCE = 'performance',
  ERRORS = 'errors',
  CONVERSIONS = 'conversions',
  FUNNELS = 'funnels',
  SEGMENTATION = 'segmentation',
  REAL_TIME = 'real-time'
}

export enum AlertOption {
  ERROR_RATE = 'error-rate',
  PERFORMANCE_DEGRADATION = 'performance-degradation',
  UPTIME = 'uptime',
  CUSTOM_METRICS = 'custom-metrics',
  SECURITY_EVENTS = 'security-events',
  COST_THRESHOLDS = 'cost-thresholds',
  USER_FEEDBACK = 'user-feedback'
}

export enum BlockchainNetwork {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BINANCE_SMART_CHAIN = 'bsc',
  SOLANA = 'solana',
  CARDANO = 'cardano',
  POLKADOT = 'polkadot',
  COSMOS = 'cosmos',
  ARBITRUM = 'arbitrum'
}

export enum SmartContractOption {
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  DEFI_PROTOCOLS = 'defi-protocols',
  NFT_MARKETPLACE = 'nft-marketplace',
  DAO = 'dao',
  CUSTOM = 'custom'
}

export enum WalletOption {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'wallet-connect',
  COINBASE_WALLET = 'coinbase-wallet',
  PHANTOM = 'phantom',
  TRUST_WALLET = 'trust-wallet',
  CUSTOM = 'custom'
}

export enum FrameworkOption {
  NEXTJS = 'nextjs',
  REACT = 'react',
  VUE = 'vue',
  NUXT = 'nuxt',
  SVELTE = 'svelte',
  ANGULAR = 'angular',
  EXPO = 'expo',
  REACT_NATIVE = 'react-native'
}

export enum BuildOption {
  WEBPACK = 'webpack',
  VITE = 'vite',
  TURBOPACK = 'turbopack',
  ESBUILD = 'esbuild',
  ROLLUP = 'rollup',
  PARCEL = 'parcel'
}

export enum DeploymentOption {
  STATIC = 'static',
  SSR = 'ssr',
  SSG = 'ssg',
  ISR = 'isr',
  EDGE = 'edge',
  CONTAINER = 'container',
  SERVERLESS = 'serverless'
}

// ============================================================================
// COMPATIBILITY MATRIX
// ============================================================================

export const DATABASE_ORM_COMPATIBILITY: Record<DatabaseProvider, ORMLibrary[]> = {
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
export enum ProjectType {
  NEXTJS = 'nextjs',
  REACT = 'react',
  VUE = 'vue',
  NUXT = 'nuxt',
  SVELTE = 'svelte',
  ANGULAR = 'angular',
  EXPO = 'expo',
  REACT_NATIVE = 'react-native',
  ELECTRON = 'electron',
  TAURI = 'tauri',
  NODE = 'node',
  EXPRESS = 'express',
  FASTIFY = 'fastify',
  NESTJS = 'nestjs',
  CUSTOM = 'custom'
}

/**
 * Target Platforms
 */
export enum TargetPlatform {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  SERVER = 'server',
  CLI = 'cli'
}

/**
 * Log Levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success'
}

// ============================================================================
// SHARED INTERFACES
// ============================================================================

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
  
  // Structured logging
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

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

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
} as const; 