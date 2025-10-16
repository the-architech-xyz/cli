/**
 * Marketplace Defaults Configuration
 * 
 * Auto-includes opinionated modules for all Next.js projects
 * No conditions - just simple auto-inclusion for v1
 */

export const MARKETPLACE_DEFAULTS = {
  autoInclude: [
    'quality/eslint',
    'quality/prettier'
    // Removed opinionated defaults - TanStack Query and Zustand should only be included when explicitly needed
  ]
} as const;
