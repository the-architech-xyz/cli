/**
 * Resend Base Blueprint
 * 
 * Sets up Resend with minimal configuration
 * Advanced features are available as separate features
 */

import { Blueprint } from '../../../types/adapter.js';

export const resendBlueprint: Blueprint = {
  id: 'resend-base-setup',
  name: 'Resend Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['resend', '@react-email/components']
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/config.ts',
      content: `import { Resend } from 'resend';

// Initialize Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || '{{module.parameters.fromEmail}}',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@{{project.name}}.com',
  baseUrl: process.env.APP_URL || 'http://localhost:3000',
};

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to {{project.name}}!',
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
}`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/sender.ts',
      content: `import { resend, EMAIL_CONFIG, EMAIL_TEMPLATES, EmailData, EmailResponse } from './config';
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
}`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/templates/welcome-email.tsx',
      content: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  baseUrl: string;
}

export const WelcomeEmail = ({ name, baseUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {{project.name}}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Welcome to {{project.name}}!</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            Welcome to {{project.name}}! We&apos;re excited to have you on board.
          </Text>
          <Text style={text}>
            You can now start using all the features of our platform. If you have any questions, feel free to reach out to our support team.
          </Text>
          <Section style={buttonContainer}>
            <a href={baseUrl} style={button}>
              Get Started
            </a>
          </Section>
          <Text style={text}>
            Best regards,<br />
            The {{project.name}} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default WelcomeEmail;`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/templates/password-reset-email.tsx',
      content: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PasswordResetEmailProps {
  resetUrl: string;
  baseUrl: string;
}

export const PasswordResetEmail = ({ resetUrl, baseUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password for {{project.name}}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password for your {{project.name}} account.
          </Text>
          <Text style={text}>
            Click the button below to reset your password. This link will expire in 1 hour.
          </Text>
          <Section style={buttonContainer}>
            <a href={resetUrl} style={button}>
              Reset Password
            </a>
          </Section>
          <Text style={text}>
            If you didn&apos;t request this password reset, you can safely ignore this email.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The {{project.name}} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default PasswordResetEmail;`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/templates/email-verification-email.tsx',
      content: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailVerificationEmailProps {
  verificationUrl: string;
  baseUrl: string;
}

export const EmailVerificationEmail = ({ verificationUrl, baseUrl }: EmailVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for {{project.name}}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Verify your email address</Heading>
          <Text style={text}>
            Thank you for signing up for {{project.name}}!
          </Text>
          <Text style={text}>
            Please click the button below to verify your email address and complete your registration.
          </Text>
          <Section style={buttonContainer}>
            <a href={verificationUrl} style={button}>
              Verify Email
            </a>
          </Section>
          <Text style={text}>
            If you didn&apos;t create an account with us, you can safely ignore this email.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The {{project.name}} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default EmailVerificationEmail;`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/templates/payment-confirmation-email.tsx',
      content: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PaymentConfirmationEmailProps {
  amount: number;
  currency: string;
  baseUrl: string;
}

export const PaymentConfirmationEmail = ({ amount, currency, baseUrl }: PaymentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment confirmed for {{project.name}}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Payment Confirmed</Heading>
          <Text style={text}>
            Thank you for your payment!
          </Text>
          <Text style={text}>
            Your payment of <strong>{currency.toUpperCase()} {amount.toFixed(2)}</strong> has been successfully processed.
          </Text>
          <Text style={text}>
            You can view your receipt and manage your account by clicking the button below.
          </Text>
          <Section style={buttonContainer}>
            <a href={baseUrl + '/account'} style={button}>
              View Account
            </a>
          </Section>
          <Text style={text}>
            If you have any questions about this payment, please contact our support team.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The {{project.name}} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default PaymentConfirmationEmail;`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/templates/subscription-created-email.tsx',
      content: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SubscriptionCreatedEmailProps {
  planName: string;
  baseUrl: string;
}

export const SubscriptionCreatedEmail = ({ planName, baseUrl }: SubscriptionCreatedEmailProps) => (
  <Html>
    <Head />
    <Preview>Subscription activated for {{project.name}}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Subscription Activated</Heading>
          <Text style={text}>
            Congratulations! Your <strong>{planName}</strong> subscription has been activated.
          </Text>
          <Text style={text}>
            You now have access to all the features included in your plan. You can manage your subscription and view your usage in your account dashboard.
          </Text>
          <Section style={buttonContainer}>
            <a href={baseUrl + '/account/subscription'} style={button}>
              Manage Subscription
            </a>
          </Section>
          <Text style={text}>
            If you have any questions about your subscription, please contact our support team.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The {{project.name}} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default SubscriptionCreatedEmail;`,
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.email_config}}/templates/subscription-cancelled-email.tsx',
      content: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SubscriptionCancelledEmailProps {
  planName: string;
  baseUrl: string;
}

export const SubscriptionCancelledEmail = ({ planName, baseUrl }: SubscriptionCancelledEmailProps) => (
  <Html>
    <Head />
    <Preview>Subscription cancelled for {{project.name}}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Subscription Cancelled</Heading>
          <Text style={text}>
            Your <strong>{planName}</strong> subscription has been cancelled.
          </Text>
          <Text style={text}>
            You will continue to have access to your current plan features until the end of your billing period.
          </Text>
          <Text style={text}>
            If you change your mind, you can reactivate your subscription at any time from your account dashboard.
          </Text>
          <Section style={buttonContainer}>
            <a href={baseUrl + '/account/subscription'} style={button}>
              Manage Subscription
            </a>
          </Section>
          <Text style={text}>
            We&apos;re sorry to see you go! If you have any feedback or questions, please don&apos;t hesitate to contact our support team.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The {{project.name}} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default SubscriptionCancelledEmail;`,
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'RESEND_API_KEY',
      value: 're_...',
      description: 'Resend API key for sending emails'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'EMAIL_FROM',
      value: '{{module.parameters.fromEmail}}',
      description: 'Default sender email address'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'EMAIL_REPLY_TO',
      value: 'support@{{project.name}}.com',
      description: 'Reply-to email address'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'APP_URL',
      value: 'http://localhost:3000',
      description: 'Public app URL for email links'
    }
  ]
};
