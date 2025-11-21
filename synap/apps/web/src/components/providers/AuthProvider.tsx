'use client';

import { ReactNode } from 'react';
import { authClient } from '@synap/auth/client';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Better Auth Session Provider
 * 
 * Wraps the application with Better Auth session management.
 * Provides authentication context to all child components.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Better Auth client automatically provides session context via React hooks
  // No explicit provider needed - authClient.useSession() works globally
  return <>{children}</>;
}
