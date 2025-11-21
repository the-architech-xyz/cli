import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client Configuration
 * 
 * This is the ADAPTER layer - universal Better Auth React client.
 * Framework-specific hooks/providers are handled by connectors.
 */
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export common methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

