/**
 * Auth Hooks - Generic Fallback
 * 
 * ARCHITECTURE NOTE:
 * These are FALLBACK hooks for auth backends without native client hooks.
 * 
 * If you're using Better Auth, Clerk, or Supabase:
 *   → These are OVERWRITTEN by the backend adapter's optimized hooks
 *   → priority: 2 in backend blueprint overwrites priority: 1 here
 * 
 * If you're using a custom REST API or backend-only solution:
 *   → These generic fetch-based hooks are used
 *   → They call your API routes via fetch
 * 
 * This provides a working baseline for ANY auth backend.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// ============================================================================
// SESSION HOOKS
// ============================================================================

/**
 * Get current session (generic fetch-based)
 */
export const useSession = (options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session');
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch session');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options
  });
};

/**
 * Sign in (generic fetch-based)
 */
export const useSignIn = (options?: UseMutationOptions<any, any, { email: string; password: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Failed to sign in');
      return res.json();
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      options?.onSuccess?.(...args);
    },
    ...options
  });
};

/**
 * Sign up (generic fetch-based)
 */
export const useSignUp = (options?: UseMutationOptions<any, any, { email: string; password: string; name?: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to sign up');
      return res.json();
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      options?.onSuccess?.(...args);
    },
    ...options
  });
};

/**
 * Sign out (generic fetch-based)
 */
export const useSignOut = (options?: UseMutationOptions<any, any, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/signout', {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to sign out');
      return res.json();
    },
    onSuccess: (...args) => {
      queryClient.setQueryData(['session'], null);
      queryClient.invalidateQueries({ queryKey: ['session'] });
      options?.onSuccess?.(...args);
    },
    ...options
  });
};

/**
 * Password management (generic fetch-based)
 */
export const usePassword = () => {
  const queryClient = useQueryClient();
  
  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to send reset email');
      return res.json();
    }
  });

  return { resetPassword };
};

/**
 * Convenience hook combining common auth operations
 */
export const useAuth = () => {
  const session = useSession();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signOut = useSignOut();
  
  return {
    session: session.data,
    user: session.data?.user,
    isLoading: session.isPending || signIn.isPending || signUp.isPending,
    isAuthenticated: !!session.data,
    signIn,
    signUp,
    signOut,
  };
};

