import { Resend } from 'resend';

// Initialize Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || '{{module.parameters.fromEmail}}',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@Full Stack Test App.com',
  baseUrl: process.env.APP_URL || 'http://localhost:3000',
};

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Full Stack Test App!',
    template: 'welcome',
  },
  passwordReset: {
    subject: 'Reset your password',
    template: 'password-reset',
  },
  emailVerification: {
    subject: 'Verify your email address',
    template: 'email-verification',
  },
  paymentConfirmation: {
    subject: 'Payment confirmed',
    template: 'payment-confirmation',
  },
  subscriptionCreated: {
    subject: 'Subscription activated',
    template: 'subscription-created',
  },
  subscriptionCancelled: {
    subject: 'Subscription cancelled',
    template: 'subscription-cancelled',
  },
};

// Email types
export interface EmailData {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
