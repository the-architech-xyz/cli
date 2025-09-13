/**
 * Better Auth Email Verification Feature
 * 
 * Adds email verification system with templates to Better Auth
 */

import { Blueprint } from '../../../../types/adapter.js';

const emailVerificationBlueprint: Blueprint = {
  id: 'better-auth-email-verification',
  name: 'Better Auth Email Verification',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/auth/email-verification.ts',
      content: `import { auth } from './config';

// Email verification utilities for Better Auth
export class EmailVerificationManager {
  static async sendVerificationEmail(email: string, userId: string) {
    try {
      const verificationToken = await auth.api.createVerificationToken({
        email,
        userId,
      });

      // Return token for external email service integration
      return { 
        success: true, 
        token: verificationToken,
        verificationUrl: \`\${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=\${verificationToken}\`,
        userId 
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: error.message };
    }
  }

  static async verifyEmail(token: string) {
    try {
      const result = await auth.api.verifyEmail({ token });
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: error.message };
    }
  }

  static async resendVerificationEmail(userId: string) {
    try {
      const user = await auth.api.getUser({ userId });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      return await this.sendVerificationEmail(user.email, userId);
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkVerificationStatus(userId: string) {
    try {
      const user = await auth.api.getUser({ userId });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { 
        success: true, 
        emailVerified: user.emailVerified,
        email: user.email 
      };
    } catch (error) {
      console.error('Check verification status error:', error);
      return { success: false, error: error.message };
    }
  }

  static async generateVerificationToken(email: string, userId: string) {
    try {
      const token = await auth.api.createVerificationToken({
        email,
        userId,
      });

      return { success: true, token };
    } catch (error) {
      console.error('Generate verification token error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Email template utilities
export class EmailTemplateManager {
  static getVerificationEmailTemplate(data: {
    verificationUrl: string;
    userName?: string;
    projectName?: string;
  }): { subject: string; html: string; text: string } {
    const subject = \`Verify your email address\`;
    
    const html = \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Verify your email address</h1>
        <p>Hello \${data.userName || 'there'},</p>
        <p>Thank you for signing up! Please click the button below to verify your email address:</p>
        <a href="\${data.verificationUrl}" 
           style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Verify Email Address
        </a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">\${data.verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The \${data.projectName || 'Team'} Team
        </p>
      </body>
      </html>
    \`;

    const text = \`
      Verify your email address
      
      Hello \${data.userName || 'there'},
      
      Thank you for signing up! Please click the link below to verify your email address:
      
      \${data.verificationUrl}
      
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      
      Best regards,
      The \${data.projectName || 'Team'} Team
    \`;

    return { subject, html, text };
  }

  static getPasswordResetEmailTemplate(data: {
    resetUrl: string;
    userName?: string;
    projectName?: string;
  }): { subject: string; html: string; text: string } {
    const subject = \`Reset your password\`;
    
    const html = \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Reset your password</h1>
        <p>Hello \${data.userName || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="\${data.resetUrl}" 
           style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">\${data.resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The \${data.projectName || 'Team'} Team
        </p>
      </body>
      </html>
    \`;

    const text = \`
      Reset your password
      
      Hello \${data.userName || 'there'},
      
      We received a request to reset your password. Click the link below to reset it:
      
      \${data.resetUrl}
      
      This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
      
      Best regards,
      The \${data.projectName || 'Team'} Team
    \`;

    return { subject, html, text };
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'docs/integrations/better-auth-email-verification.md',
      content: `# Better Auth Email Verification Integration Guide

## Overview

This guide shows how to integrate Better Auth email verification with your email service provider.

## Prerequisites

- Better Auth configured
- Email service provider (Resend, SendGrid, etc.)
- Database for storing user data

## Basic Setup

### 1. Environment Variables

\`\`\`bash
# .env.local
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email service (example with Resend)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourapp.com"
\`\`\`

## Integration Examples

### With Resend

\`\`\`typescript
// src/lib/email/resend.ts
import { Resend } from 'resend';
import { EmailVerificationManager, EmailTemplateManager } from '@/lib/auth/email-verification';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendVerificationEmail(email: string, userId: string) {
    try {
      // Get verification data from Better Auth
      const verificationData = await EmailVerificationManager.sendVerificationEmail(email, userId);
      
      if (!verificationData.success) {
        throw new Error(verificationData.error);
      }

      // Generate email template
      const template = EmailTemplateManager.getVerificationEmailTemplate({
        verificationUrl: verificationData.verificationUrl!,
        userName: 'User', // Get from user data
        projectName: 'Your App'
      });

      // Send email with Resend
      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const resetUrl = \`\${process.env.NEXTAUTH_URL}/auth/reset-password?token=\${resetToken}\`;
      
      const template = EmailTemplateManager.getPasswordResetEmailTemplate({
        resetUrl,
        userName: 'User',
        projectName: 'Your App'
      });

      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }
  }
}
\`\`\`

### With SendGrid

\`\`\`typescript
// src/lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';
import { EmailVerificationManager, EmailTemplateManager } from '@/lib/auth/email-verification';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailService {
  static async sendVerificationEmail(email: string, userId: string) {
    try {
      const verificationData = await EmailVerificationManager.sendVerificationEmail(email, userId);
      
      if (!verificationData.success) {
        throw new Error(verificationData.error);
      }

      const template = EmailTemplateManager.getVerificationEmailTemplate({
        verificationUrl: verificationData.verificationUrl!,
        userName: 'User',
        projectName: 'Your App'
      });

      const msg = {
        to: email,
        from: process.env.FROM_EMAIL!,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await sgMail.send(msg);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }
}
\`\`\`

## API Routes

### Email Verification Route

\`\`\`typescript
// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationManager } from '@/lib/auth/email-verification';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
  }

  try {
    const result = await EmailVerificationManager.verifyEmail(token);
    
    if (result.success) {
      return NextResponse.redirect(new URL('/auth/verification-success', req.url));
    } else {
      return NextResponse.redirect(new URL(\`/auth/verification-error?error=\${encodeURIComponent(result.error)}\`, req.url));
    }
  } catch (error) {
    return NextResponse.redirect(new URL(\`/auth/verification-error?error=\${encodeURIComponent('Verification failed')}\`, req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await EmailVerificationManager.resendVerificationEmail(userId);
    
    if (result.success) {
      return NextResponse.json({ message: 'Verification email sent successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 });
  }
}
\`\`\`

## UI Components

### Email Verification Banner

\`\`\`typescript
// src/components/auth/EmailVerificationBanner.tsx
'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth/client';

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    if (!session?.user?.id) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Verification email sent! Check your inbox.');
      } else {
        setMessage(data.error || 'Failed to send verification email.');
      }
    } catch (error) {
      setMessage('Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  if (!session?.user || session.user.emailVerified) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Please verify your email address to access all features.
          </p>
          <div className="mt-2">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-sm font-medium text-yellow-700 hover:text-yellow-600 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
          {message && (
            <p className="mt-1 text-sm text-yellow-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
\`\`\`

## Best Practices

1. **Always validate tokens** before processing
2. **Set appropriate expiration times** for verification links
3. **Handle edge cases** like expired tokens and invalid users
4. **Use HTTPS** for verification links in production
5. **Implement rate limiting** for resend functionality

## Common Patterns

### Verification Status Check

\`\`\`typescript
export function isEmailVerified(user: User): boolean {
  return user.emailVerified === true;
}

export function requireEmailVerification(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await auth();
    
    if (!isEmailVerified(session.user)) {
      return NextResponse.json({ error: 'Email verification required' }, { status: 403 });
    }
    
    return handler(req, ...args);
  };
}
\`\`\`

### Automatic Email Sending

\`\`\`typescript
// src/lib/auth/email-hooks.ts
import { EmailService } from '@/lib/email/resend';

export function setupEmailHooks() {
  // Hook into Better Auth events
  auth.hooks.on('user.created', async (user) => {
    await EmailService.sendVerificationEmail(user.email, user.id);
  });

  auth.hooks.on('user.email.updated', async (user) => {
    await EmailService.sendVerificationEmail(user.email, user.id);
  });
}
\`\`\`
`
    }
  ]
};
export default emailVerificationBlueprint;
