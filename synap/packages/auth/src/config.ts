/**
 * Better Auth Configuration - Next.js Connector
 * 
 * Extends base Better Auth adapter configuration with Next.js specific plugins.
 * Base configuration comes from adapter, we add framework-specific wiring.
 */

import { auth as baseAuth } from '@/lib/auth/better-auth';
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Get adapter config
const adapterConfig = baseAuth.options;

// Extend with Next.js specific plugins
export const auth = betterAuth({
  ...adapterConfig,
  // CRITICAL: nextCookies must be FIRST plugin for Next.js
  plugins: [
    nextCookies(),
    ...(adapterConfig.plugins || []),
  ],
});

// Export inferred types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;

// Export auth handler for Next.js API routes
export const authHandler = auth.handler;

// Middleware helper for Next.js middleware
export async function authMiddleware(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session && request.url.includes('/dashboard')) {
    return Response.redirect(new URL('/login', request.url));
  }
  
  return null; // Continue with request
}
