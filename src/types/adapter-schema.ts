/**
 * Centralized Adapter Schema System
 * 
 * This file defines the standardized parameter names, dependency constraints,
 * and validation rules that all adapters must follow for V1.
 * 
 * Adapters can extend these base schemas with custom parameters,
 * but they must use the standardized names for common parameters.
 */

// ============================================================================
// STANDARDIZED PARAMETER NAMES
// ============================================================================

/**
 * Standardized parameter names that all adapters must use
 * This ensures consistency across the entire system
 */
export const STANDARD_PARAMETERS = {
  // Database parameters
  DATABASE_TYPE: 'databaseType',
  DATABASE_URL: 'databaseUrl',
  DATABASE_HOST: 'databaseHost',
  DATABASE_PORT: 'databasePort',
  DATABASE_NAME: 'databaseName',
  DATABASE_USER: 'databaseUser',
  DATABASE_PASSWORD: 'databasePassword',
  
  // Framework parameters
  FRAMEWORK_TYPE: 'frameworkType',
  FRAMEWORK_VERSION: 'frameworkVersion',
  
  // UI parameters
  UI_LIBRARY: 'uiLibrary',
  UI_THEME: 'uiTheme',
  UI_COLOR_SCHEME: 'colorScheme',
  
  // Authentication parameters
  AUTH_PROVIDER: 'authProvider',
  AUTH_SECRET: 'authSecret',
  AUTH_REDIRECT_URL: 'authRedirectUrl',
  
  // API parameters
  API_BASE_URL: 'apiBaseUrl',
  API_VERSION: 'apiVersion',
  
  // Deployment parameters
  DEPLOYMENT_PLATFORM: 'deploymentPlatform',
  DEPLOYMENT_REGION: 'deploymentRegion',
  
  // Feature flags
  ENABLE_FEATURES: 'enableFeatures',
  DISABLE_FEATURES: 'disableFeatures',
} as const;

/**
 * Standardized parameter types with validation
 */
export const STANDARD_PARAMETER_TYPES = {
  [STANDARD_PARAMETERS.DATABASE_TYPE]: {
    type: 'string',
    enum: ['postgresql', 'mysql', 'sqlite', 'mongodb'],
    default: 'postgresql',
    description: 'Type of database to use'
  },
  [STANDARD_PARAMETERS.DATABASE_URL]: {
    type: 'string',
    format: 'uri',
    description: 'Full database connection URL'
  },
  [STANDARD_PARAMETERS.FRAMEWORK_TYPE]: {
    type: 'string',
    enum: ['nextjs', 'react', 'vue', 'svelte'],
    default: 'nextjs',
    description: 'Frontend framework to use'
  },
  [STANDARD_PARAMETERS.UI_LIBRARY]: {
    type: 'string',
    enum: ['shadcn', 'tailwind', 'chakra', 'mui', 'antd'],
    default: 'shadcn',
    description: 'UI component library to use'
  },
  [STANDARD_PARAMETERS.AUTH_PROVIDER]: {
    type: 'string',
    enum: ['better-auth', 'auth0', 'firebase', 'supabase'],
    default: 'better-auth',
    description: 'Authentication provider to use'
  },
  [STANDARD_PARAMETERS.DEPLOYMENT_PLATFORM]: {
    type: 'string',
    enum: ['vercel', 'netlify', 'aws', 'docker'],
    default: 'vercel',
    description: 'Deployment platform to use'
  },
  [STANDARD_PARAMETERS.ENABLE_FEATURES]: {
    type: 'array',
    items: { type: 'string' },
    default: [],
    description: 'Features to enable'
  },
  [STANDARD_PARAMETERS.DISABLE_FEATURES]: {
    type: 'array',
    items: { type: 'string' },
    default: [],
    description: 'Features to disable'
  }
} as const;

// ============================================================================
// DEPENDENCY CONSTRAINTS
// ============================================================================

/**
 * Standardized dependency constraints that adapters can declare
 */
export interface AdapterDependencyConstraints {
  // Framework constraints
  requiredFrameworks?: string[];
  incompatibleFrameworks?: string[];
  
  // UI constraints
  requiredUILibraries?: string[];
  incompatibleUILibraries?: string[];
  
  // Database constraints
  requiredDatabases?: string[];
  incompatibleDatabases?: string[];
  
  // Node.js constraints
  minNodeVersion?: string;
  maxNodeVersion?: string;
  
  // Package constraints
  requiredPackages?: string[];
  conflictingPackages?: string[];
  
  // Environment constraints
  requiredEnvironment?: 'development' | 'production' | 'both';
  requiredPlatforms?: string[];
}

/**
 * Standardized constraint types
 */
export const STANDARD_CONSTRAINTS = {
  FRAMEWORKS: {
    NEXTJS: 'nextjs',
    REACT: 'react',
    VUE: 'vue',
    SVELTE: 'svelte'
  },
  UI_LIBRARIES: {
    SHADCN: 'shadcn',
    TAILWIND: 'tailwind',
    CHAKRA: 'chakra',
    MUI: 'mui',
    ANTD: 'antd'
  },
  DATABASES: {
    POSTGRESQL: 'postgresql',
    MYSQL: 'mysql',
    SQLITE: 'sqlite',
    MONGODB: 'mongodb'
  },
  PLATFORMS: {
    VERCEL: 'vercel',
    NETLIFY: 'netlify',
    AWS: 'aws',
    DOCKER: 'docker'
  }
} as const;

// ============================================================================
// ADAPTER SCHEMA INTERFACE
// ============================================================================

/**
 * Standardized adapter schema interface
 * All adapters must implement this interface
 */
export interface AdapterSchema {
  // Basic adapter info
  name: string;
  version: string;
  description: string;
  category: 'framework' | 'ui' | 'database' | 'auth' | 'payment' | 'email' | 'observability' | 'testing' | 'state' | 'content' | 'deployment' | 'blockchain';
  
  // Standardized parameters (must use STANDARD_PARAMETERS)
  parameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      enum?: string[];
      default?: any;
      description: string;
      required?: boolean;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        format?: string;
      };
    };
  };
  
  // Dependency constraints
  constraints?: AdapterDependencyConstraints;
  
  // Custom parameters (can be anything, but should be prefixed)
  customParameters?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description: string;
      required?: boolean;
    };
  };
  
  // Features this adapter provides
  features: string[];
  
  // Dependencies this adapter requires
  dependencies: {
    [packageName: string]: {
      version: string;
      type: 'dependency' | 'devDependency' | 'peerDependency';
      description?: string;
    };
  };
}

// ============================================================================
// VALIDATION SYSTEM
// ============================================================================

/**
 * Validates an adapter schema against the standard
 */
export class AdapterSchemaValidator {
  static validate(schema: AdapterSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!schema.name) errors.push('Adapter name is required');
    if (!schema.version) errors.push('Adapter version is required');
    if (!schema.category) errors.push('Adapter category is required');
    if (!schema.parameters) errors.push('Adapter parameters are required');
    if (!schema.features) errors.push('Adapter features are required');
    if (!schema.dependencies) errors.push('Adapter dependencies are required');
    
    // Check parameter naming consistency
    Object.keys(schema.parameters).forEach(paramName => {
      if (paramName.startsWith('database') && !Object.values(STANDARD_PARAMETERS).includes(paramName as any)) {
        errors.push(`Parameter '${paramName}' should use standardized naming. Consider using '${STANDARD_PARAMETERS.DATABASE_TYPE}' or similar.`);
      }
    });
    
    // Check dependency constraints
    if (schema.constraints) {
      if (schema.constraints.requiredFrameworks) {
        schema.constraints.requiredFrameworks.forEach(framework => {
          if (!Object.values(STANDARD_CONSTRAINTS.FRAMEWORKS).includes(framework as any)) {
            errors.push(`Unknown framework constraint: ${framework}`);
          }
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates parameter values against the schema
   */
  static validateParameters(schema: AdapterSchema, parameters: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    Object.entries(schema.parameters).forEach(([paramName, paramDef]) => {
      const value = parameters[paramName];
      
      // Check required parameters
      if (paramDef.required && (value === undefined || value === null)) {
        errors.push(`Required parameter '${paramName}' is missing`);
        return;
      }
      
      // Check type validation
      if (value !== undefined && value !== null) {
        if (paramDef.type === 'string' && typeof value !== 'string') {
          errors.push(`Parameter '${paramName}' must be a string`);
        } else if (paramDef.type === 'number' && typeof value !== 'number') {
          errors.push(`Parameter '${paramName}' must be a number`);
        } else if (paramDef.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Parameter '${paramName}' must be a boolean`);
        } else if (paramDef.type === 'array' && !Array.isArray(value)) {
          errors.push(`Parameter '${paramName}' must be an array`);
        }
        
        // Check enum validation
        if (paramDef.enum && !paramDef.enum.includes(value)) {
          errors.push(`Parameter '${paramName}' must be one of: ${paramDef.enum.join(', ')}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the standardized parameter name for a given parameter
 */
export function getStandardParameterName(parameter: string): string | null {
  const entry = Object.entries(STANDARD_PARAMETERS).find(([_, value]) => value === parameter);
  return entry ? entry[0] : null;
}

/**
 * Checks if a parameter name is standardized
 */
export function isStandardParameter(parameter: string): boolean {
  return Object.values(STANDARD_PARAMETERS).includes(parameter as any);
}

/**
 * Gets all available parameter types for a category
 */
export function getParameterTypesForCategory(category: string): string[] {
  switch (category) {
    case 'database':
      return Object.values(STANDARD_PARAMETERS).filter(p => p.startsWith('database'));
    case 'framework':
      return Object.values(STANDARD_PARAMETERS).filter(p => p.startsWith('framework'));
    case 'ui':
      return Object.values(STANDARD_PARAMETERS).filter(p => p.startsWith('ui'));
    case 'auth':
      return Object.values(STANDARD_PARAMETERS).filter(p => p.startsWith('auth'));
    default:
      return Object.values(STANDARD_PARAMETERS);
  }
}
