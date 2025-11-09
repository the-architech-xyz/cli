/**
 * Email Management Hooks
 * 
 * Pure frontend hooks that consume the EmailService from backend.
 * NO direct API calls - all data fetching delegated to backend service.
 * 
 * This follows The Architech's contract architecture:
 * - Frontend imports ONLY from contract and backend service
 * - Frontend makes ZERO direct fetch() calls
 * - Frontend consumes backend hooks via IEmailService interface
 */

import { 
  Email, 
  EmailTemplate, 
  EmailAnalytics, 
  EmailListFilters,
  EmailSendRequest,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  EmailListResponse,
  TemplateListResponse,
  UseEmailsReturn,
  UseTemplatesReturn,
  UseEmailAnalyticsReturn
} from '@/types/emailing';
import { useEmailContext } from '@/hooks/use-email-context';
import { EmailService } from '@/lib/services/EmailService';

// Note: Query keys are managed by backend service
// Frontend just uses the hooks provided by IEmailService

/**
 * Email Management Hooks
 * 
 * Pure frontend hooks that delegate to EmailService from backend.
 * These are convenience wrappers that follow The Architech's gold standard pattern.
 */

// ============================================================================
// EMAIL HOOKS - Delegate to EmailService.useEmails()
// ============================================================================

export function useEmails(filters: EmailListFilters = {}): UseEmailsReturn {
  const { userContext, isLoading: authLoading, error: authError } = useEmailContext();

  // ✅ CORRECT: Use backend service
  const { list, get } = EmailService.useEmails();

  // Call backend hooks
  const listQuery = list(filters);

  return {
    emails: listQuery.data ?? [],
    isLoading: listQuery.isLoading || authLoading,
    error: listQuery.error || authError,
    refetch: listQuery.refetch,
    hasMore: false, // Pagination handled by backend
    loadMore: () => {}, // Pagination handled by backend
  };
}

export function useEmail(id: string) {
  // ✅ CORRECT: Use backend service
  const { get } = EmailService.useEmails();
  return get(id);
}

export function useSendEmail() {
  // ✅ CORRECT: Use backend service mutation
  const { send } = EmailService.useEmails();
  return send();
}

export function useEmailAnalytics(): UseEmailAnalyticsReturn {
  const { userContext, isLoading: authLoading, error: authError } = useEmailContext();
  
  // ✅ CORRECT: Use backend service
  const { getEmailAnalytics } = EmailService.useAnalytics();
  
  const analyticsQuery = getEmailAnalytics();

  return {
    analytics: analyticsQuery.data ?? null,
    isLoading: analyticsQuery.isLoading || authLoading,
    error: analyticsQuery.error || authError,
    refetch: analyticsQuery.refetch,
  };
}

// ============================================================================
// TEMPLATE HOOKS - Delegate to EmailService.useTemplates()
// ============================================================================

export function useTemplates(filters: { isActive?: boolean; category?: string } = {}): UseTemplatesReturn {
  // ✅ CORRECT: Use backend service
  const { list } = EmailService.useTemplates();
  
  const templatesQuery = list(filters);

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    refetch: templatesQuery.refetch,
  };
}

export function useTemplate(id: string) {
  // ✅ CORRECT: Use backend service
  const { get } = EmailService.useTemplates();
  return get(id);
}

export function useCreateTemplate() {
  // ✅ CORRECT: Use backend service mutation
  const { create } = EmailService.useTemplates();
  return create();
}

export function useUpdateTemplate() {
  // ✅ CORRECT: Use backend service mutation
  const { update } = EmailService.useTemplates();
  return update();
}

export function useDeleteTemplate() {
  // ✅ CORRECT: Use backend service mutation
  const { delete: deleteTemplate } = EmailService.useTemplates();
  return deleteTemplate();
}
