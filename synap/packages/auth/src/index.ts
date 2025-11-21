/**
 * Auth Feature - Tech Stack Layer
 * 
 * ARCHITECTURE: Tech-Agnostic with Backend Overrides
 * - Exports generic types from contract
 * - Exports Zod schemas for form validation (work with any auth SDK)
 * - Exports UI stores for state management (work with any auth SDK)
 * - Exports hooks (generic OR overwritten by backend)
 * 
 * HOOKS STRATEGY:
 * - Tech-stack provides FALLBACK fetch-based hooks (priority: 1)
 * - Backend can OVERWRITE with SDK-native hooks (priority: 2)
 * - Frontend always imports from '@/lib/auth' and gets the right hooks!
 * 
 * Examples:
 * - Better Auth backend → overwrites with authClient.useSession()
 * - Supabase backend → overwrites with Supabase hooks
 * - Custom REST API → uses these generic fetch hooks
 */

// Generic types from contract
export * from './types';

// Zod schemas for validation (work with any auth SDK)
export * from './schemas';

// UI stores (work with any auth SDK)
export * from './stores';

// Hooks (generic fallback OR overwritten by backend)
export * from './hooks';

// Server-side auth instance and client (re-exported from adapter/connector)
// Adapter creates server.ts and client.ts (generic naming)
// Connector may create config.ts for framework-specific setup
export { auth } from './server';
export { authClient } from './client';
