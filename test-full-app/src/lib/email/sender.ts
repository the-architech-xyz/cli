import { resend, EMAIL_CONFIG, EMAIL_TEMPLATES, EmailData, EmailResponse } from './config';
import { WelcomeEmail } from './templates/welcome-email';
import { PasswordResetEmail } from './templates/password-reset-email';
import { EmailVerificationEmail } from './templates/email-verification-email';
import { PaymentConfirmationEmail } from './templates/payment-confirmation-email';
import { SubscriptionCreatedEmail } from './templates/subscription-created-email';
import { SubscriptionCancelledEmail } from './templates/subscription-cancelled-email';

// Email template mapping
const EMAIL_TEMPLATE_COMPONENTS = {
  welcome: WelcomeEmail,
  'password-reset': PasswordResetEmail,
  'email-verification': EmailVerificationEmail,
  'payment-confirmation': PaymentConfirmationEmail,
  'subscription-created': SubscriptionCreatedEmail,
  'subscription-cancelled': SubscriptionCancelledEmail,
};

/**
 * Send email using Resend
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResponse> {
  try {
    const { to, subject, template, data } = emailData;

    // Get template component
    const TemplateComponent = EMAIL_TEMPLATE_COMPONENTS[template as keyof typeof EMAIL_TEMPLATE_COMPONENTS];
    
    if (!TemplateComponent) {
      throw new Error(\`Email template '\${template}' not found\`);
    }

    // Send email
    const { data: result, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react: TemplateComponent(data as any),
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: result?.id,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: EMAIL_TEMPLATES.welcome.subject,
    template: EMAIL_TEMPLATES.welcome.template,
    data: { name, baseUrl: EMAIL_CONFIG.baseUrl },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: EMAIL_TEMPLATES.passwordReset.subject,
    template: EMAIL_TEMPLATES.passwordReset.template,
    data: { resetUrl, baseUrl: EMAIL_CONFIG.baseUrl },
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(to: string, verificationUrl: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: EMAIL_TEMPLATES.emailVerification.subject,
    template: EMAIL_TEMPLATES.emailVerification.template,
    data: { verificationUrl, baseUrl: EMAIL_CONFIG.baseUrl },
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(to: string, amount: number, currency: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: EMAIL_TEMPLATES.paymentConfirmation.subject,
    template: EMAIL_TEMPLATES.paymentConfirmation.template,
    data: { amount, currency, baseUrl: EMAIL_CONFIG.baseUrl },
  });
}

/**
 * Send subscription created email
 */
export async function sendSubscriptionCreatedEmail(to: string, planName: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: EMAIL_TEMPLATES.subscriptionCreated.subject,
    template: EMAIL_TEMPLATES.subscriptionCreated.template,
    data: { planName, baseUrl: EMAIL_CONFIG.baseUrl },
  });
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail(to: string, planName: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: EMAIL_TEMPLATES.subscriptionCancelled.subject,
    template: EMAIL_TEMPLATES.subscriptionCancelled.template,
    data: { planName, baseUrl: EMAIL_CONFIG.baseUrl },
  });
}
