/**
 * Better Auth API Route
 * 
 * Provided by: connectors/auth/better-auth-nextjs
 * 
 * This catch-all route handles ALL auth endpoints automatically via Better Auth.
 * Better Auth creates 50+ routes based on your config and plugins.
 */

import { auth } from '@/lib/auth/config';

export const { GET, POST } = auth.handler;