/**
 * Email Context Hook
 * 
 * Provides user context for email operations by integrating with auth
 */

import { useSession } from '@/lib/auth/client';  // Better Auth native
import { UserContext } from '@/lib/emailing';  // ✅ Import from tech-stack, not backend!

export function useEmailContext(): {
  userContext: UserContext | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  canSendEmails: boolean;
  canManageTemplates: boolean;
  canManageCampaigns: boolean;
  canViewAnalytics: boolean;
  canSendBulkEmails: boolean;
  canManageOrgSettings: boolean;
} {
  const { data: session, isPending: isLoading, error } = useSession();  // Better Auth native

  // Build user context from auth session
  const userContext: UserContext | null = session ? {
    userId: session.user.id,
    <% if (module.parameters.hasOrganizations) { %>
    organizationId: session.user.organizationId as string | undefined,
    role: session.user.role as 'owner' | 'admin' | 'member' | undefined,
    <% } %>
    <% if (module.parameters.hasTeams) { %>
    teamId: session.user.teamId as string | undefined,
    teamRole: session.user.teamRole as 'owner' | 'admin' | 'member' | undefined
    <% } %>
  } : null;

  // Check permissions
  const canSendEmails = userContext ? true : false; // All authenticated users can send emails
  const canManageTemplates = userContext ? 
    (userContext.role === 'owner' || userContext.role === 'admin' || !userContext.organizationId) : false;
  const canManageCampaigns = userContext ? 
    (userContext.role === 'owner' || userContext.role === 'admin') : false;
  const canViewAnalytics = userContext ? 
    (userContext.role === 'owner' || userContext.role === 'admin') : false;
  const canSendBulkEmails = userContext ? 
    (userContext.role === 'owner' || userContext.role === 'admin') : false;
  const canManageOrgSettings = userContext ? 
    (userContext.role === 'owner') : false;

  return {
    userContext,
    isLoading,
    error: error as Error | null,
    isAuthenticated: !!session,
    canSendEmails,
    canManageTemplates,
    canManageCampaigns,
    canViewAnalytics,
    canSendBulkEmails,
    canManageOrgSettings
  };
}
