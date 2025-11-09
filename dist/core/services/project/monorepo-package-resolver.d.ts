/**
 * Monorepo Package Resolver
 *
 * Determines which package (apps/web, apps/api, packages/shared, etc.)
 * a module should be executed in based on:
 * - Module type and layer (frontend/backend/tech-stack/database)
 * - Module usage (frontend-only, backend-only, or full-stack)
 * - Genome structure and apps configuration
 */
import { Genome, Module } from '@thearchitech.xyz/types';
export interface ModuleUsage {
    frontend: boolean;
    backend: boolean;
}
export type ModuleLayer = 'frontend' | 'backend' | 'tech-stack' | 'database' | null;
export declare class MonorepoPackageResolver {
    /**
     * Determine which package a module should be executed in
     *
     * Priority Order (Highest to Lowest):
     * 1. Genome module targetPackage (explicit) - ALWAYS respected
     * 2. Module metadata targetPackage (if preserved during conversion)
     * 3. Module ID patterns (ui/* → packages/ui, database/* → packages/database)
     * 4. Layer-based inference (tech-stack, database, frontend, backend)
     * 5. Usage-based inference (frontend-only, backend-only, full-stack)
     * 6. Module type-based inference (framework, feature, adapter, connector)
     *
     * Strategy:
     * - UI libraries → packages/ui (reusable components)
     * - Database modules → packages/database (database logic)
     * - Frontend-only modules → apps/web (single app) or packages/shared (multiple apps)
     * - Backend-only modules → apps/api (if exists) or packages/shared
     * - Full-stack modules → packages/shared (shared between apps)
     * - Tech-stack layers → packages/shared (shared utilities)
     */
    static resolveTargetPackage(module: Module, genome: Genome): string | null;
    /**
     * Find genome module definition by module ID
     * Used to check for explicit targetPackage in genome
     */
    private static findGenomeModule;
    /**
     * Infer module layer from module ID
     */
    private static inferModuleLayer;
    /**
     * Infer module usage (frontend/backend/both) from module ID and layer
     *
     * Improved inference logic based on best practices:
     * - UI modules are ALWAYS frontend-only (reusable components)
     * - Database modules are ALWAYS backend-focused (database logic)
     * - Auth/Payment/Email adapters are typically full-stack (shared)
     * - More specific detection before defaulting to full-stack
     */
    private static inferModuleUsage;
    /**
     * Get module type from module ID
     */
    private static getModuleType;
}
