/**
 * Better Auth Password Reset Feature
 * 
 * Adds secure password reset flow to Better Auth
 */

import { Blueprint } from '../../../../types/adapter.js';

const passwordResetBlueprint: Blueprint = {
  id: 'better-auth-password-reset',
  name: 'Better Auth Password Reset',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/auth/password-reset.ts',
      content: `import { auth } from './config';

// Password reset utilities
export class PasswordResetManager {
  static async requestPasswordReset(email: string) {
    try {
      const resetToken = await auth.api.createPasswordResetToken({
        email,
      });

      // In production, integrate with your email service
      await this.sendPasswordResetEmail({
        to: email,
        subject: 'Reset your password',
        template: 'password-reset',
        data: {
          resetUrl: \`\${process.env.NEXTAUTH_URL}/auth/reset-password?token=\${resetToken}\`,
          email,
        },
      });

      return { success: true, token: resetToken };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message };
    }
  }

  static async resetPassword(token: string, newPassword: string) {
    try {
      const result = await auth.api.resetPassword({
        token,
        password: newPassword,
      });
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  static async validateResetToken(token: string) {
    try {
      const isValid = await auth.api.validatePasswordResetToken({ token });
      return { success: true, valid: isValid };
    } catch (error) {
      console.error('Token validation error:', error);
      return { success: false, error: error.message };
    }
  }

  private static async sendEmail({ to, subject, template, data }: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
  }) {
    // This is a placeholder - integrate with your email service
    console.log('Sending password reset email:', { to, subject, template, data });
    
    // Example with Resend (if available)
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailContent = this.getEmailTemplate(template, data);
      
      return await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
        to,
        subject,
        html: emailContent,
      });
    }
  }

  private static getEmailTemplate(template: string, data: Record<string, any>): string {
    switch (template) {
      case 'password-reset':
        return \`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reset your password</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Reset your password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="\${data.resetUrl}" 
               style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">\${data.resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              For security reasons, this link can only be used once.
            </p>
          </body>
          </html>
        \`;
      default:
        return '<p>Email template not found</p>';
    }
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/auth/request-password-reset/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetManager } from '@/lib/auth/password-reset';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await PasswordResetManager.requestPasswordReset(email);
    
    // Always return success to prevent email enumeration
    return NextResponse.json({ 
      message: 'If an account with that email exists, we\'ve sent a password reset link.' 
    });
  } catch (error) {
    return NextResponse.json({ 
      message: 'If an account with that email exists, we\'ve sent a password reset link.' 
    });
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/auth/reset-password/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetManager } from '@/lib/auth/password-reset';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const result = await PasswordResetManager.resetPassword(token, password);
    
    if (result.success) {
      return NextResponse.json({ message: 'Password reset successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const result = await PasswordResetManager.validateResetToken(token);
    
    if (result.success && result.valid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 400 });
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/auth/forgot-password/page.tsx',
      content: `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>

          {message && (
            <div className="text-center">
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}

          <div className="text-center">
            <a
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/auth/reset-password/page.tsx',
      content: `'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password');
      return;
    }

    // Validate token
    fetch(\`/api/auth/reset-password?token=\${token}\`)
      .then(res => res.json())
      .then(data => {
        setIsValidToken(data.valid);
        if (!data.valid) {
          setMessage('Invalid or expired reset link. Please request a new one.');
        }
      })
      .catch(() => {
        setIsValidToken(false);
        setMessage('Invalid or expired reset link. Please request a new one.');
      });
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>
          <div className="mt-8">
            <a
              href="/auth/forgot-password"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          {message && (
            <div className="text-center">
              <p className={\`text-sm \${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}\`}>
                {message}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}`
    }
  ]
};
export default passwordResetBlueprint;
