/**
 * Framework Compatibility Utilities
 *
 * Provides framework compatibility checking to prevent framework-specific modules
 * from executing in incompatible apps (e.g., Next.js module in Hono app).
 */
import { Module, ResolvedGenome } from '@thearchitech.xyz/types';
/**
 * Extract framework requirement from module
 *
 * Priority:
 * 1. Module metadata `requires` array (explicit: "framework/nextjs")
 * 2. Module ID pattern (implicit: "backend/nextjs", "connectors/auth/better-auth-nextjs")
 * 3. Module config prerequisites (future)
 *
 * @param module - Module to check
 * @returns Framework name (e.g., "nextjs", "hono", "express") or null if framework-agnostic
 */
export declare function extractFrameworkRequirement(module: Module): string | null;
/**
 * Filter apps by framework and app type compatibility
 *
 * Only returns apps that match both:
 * - Module's framework requirement (if specified)
 * - Module's app type requirement (if specified)
 *
 * If module has no requirements, returns all apps.
 *
 * @param appIds - Array of app IDs to filter
 * @param module - Module with potential framework/app type requirements
 * @param genome - Genome containing app definitions
 * @param frameworkRequirement - Optional explicit framework requirement (from recipe book or extracted)
 * @param requiredAppTypes - Optional explicit app type requirements (from recipe book)
 * @returns Filtered array of compatible app IDs
 */
export declare function filterAppsByFramework(appIds: string[], module: Module, genome: ResolvedGenome, frameworkRequirement?: string | null, requiredAppTypes?: ('web' | 'mobile' | 'api' | 'desktop' | 'worker')[]): string[];
/**
 * Validate framework and app type compatibility before execution
 *
 * Double-check that app framework and type match module requirements.
 * This is a safety check in addition to filtering.
 *
 * @param module - Module to execute
 * @param appId - App ID to execute in
 * @param genome - Genome containing app definitions
 * @param frameworkRequirement - Optional explicit framework requirement (from recipe book)
 * @param requiredAppTypes - Optional explicit app type requirements (from recipe book)
 * @returns true if compatible, false otherwise
 */
export declare function validateFrameworkCompatibility(module: Module, appId: string, genome: ResolvedGenome, frameworkRequirement?: string | null, requiredAppTypes?: ('web' | 'mobile' | 'api' | 'desktop' | 'worker')[]): {
    compatible: boolean;
    error?: string;
};
