/**
 * Email Management Types
 * 
 * Comprehensive type definitions for the email management system
 */

export interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  content: string;
  htmlContent?: string;
  status: EmailStatus;
  templateId?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: EmailMetadata;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  htmlContent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variables?: string[];
  category?: string;
}

export interface EmailMetadata {
  openCount?: number;
  clickCount?: number;
  bounceCount?: number;
  unsubscribeCount?: number;
  lastOpenedAt?: Date;
  lastClickedAt?: Date;
}

export type EmailStatus = 
  | 'draft'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'scheduled';

export interface EmailComposerData {
  to: string;
  from: string;
  subject: string;
  content: string;
  htmlContent?: string;
  templateId?: string;
}

export interface EmailListFilters {
  status?: EmailStatus;
  templateId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    subject: string;
    status: EmailStatus;
    sentAt: Date;
  }>;
}

export interface EmailSendRequest {
  to: string;
  from: string;
  subject: string;
  content: string;
  htmlContent?: string;
  templateId?: string;
  scheduledAt?: Date;
}

export interface EmailSendResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

export interface TemplateCreateRequest {
  name: string;
  subject: string;
  content: string;
  htmlContent?: string;
  variables?: string[];
  category?: string;
}

export interface TemplateUpdateRequest extends Partial<TemplateCreateRequest> {
  id: string;
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TemplateListResponse {
  templates: EmailTemplate[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Hook return types
export interface UseEmailsReturn {
  emails: Email[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

export interface UseTemplatesReturn {
  templates: EmailTemplate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseEmailAnalyticsReturn {
  analytics: EmailAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// API Error types
export interface EmailApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Form validation types
export interface EmailComposerFormData {
  to: string;
  from: string;
  subject: string;
  content: string;
  htmlContent?: string;
  templateId?: string;
}

export interface TemplateFormData {
  name: string;
  subject: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  category?: string;
}
