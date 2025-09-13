/**
 * Better Auth Multi-Factor Authentication Feature
 * 
 * Adds 2FA/TOTP support to Better Auth
 */

import { Blueprint } from '../../../../types/adapter.js';

const multiFactorBlueprint: Blueprint = {
  id: 'better-auth-multi-factor',
  name: 'Better Auth Multi-Factor Authentication',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['speakeasy', 'qrcode']
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/auth/mfa.ts',
      content: `import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { auth } from './config';

// Multi-Factor Authentication utilities
export class MFAManager {
  static async generateSecret(userId: string, userEmail: string) {
    try {
      const secret = speakeasy.generateSecret({
        name: \`{{project.name}} (\${userEmail})\`,
        issuer: '{{project.name}}',
        length: 32,
      });

      // Store the secret temporarily (in production, store in database)
      // For now, we'll store it in the user's session or a temporary store
      await this.storeTemporarySecret(userId, secret.base32);

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
      };
    } catch (error) {
      console.error('MFA secret generation error:', error);
      return { success: false, error: error.message };
    }
  }

  static async verifyToken(secret: string, token: string) {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps (60 seconds) of tolerance
      });

      return { success: true, verified };
    } catch (error) {
      console.error('MFA token verification error:', error);
      return { success: false, error: error.message };
    }
  }

  static async enableMFA(userId: string, secret: string, token: string) {
    try {
      // Verify the token first
      const verification = await this.verifyToken(secret, token);
      if (!verification.success || !verification.verified) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Store the MFA secret for the user
      await this.storeMFASecret(userId, secret);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      return {
        success: true,
        backupCodes,
        message: 'MFA enabled successfully',
      };
    } catch (error) {
      console.error('MFA enable error:', error);
      return { success: false, error: error.message };
    }
  }

  static async disableMFA(userId: string, token: string) {
    try {
      const secret = await this.getMFASecret(userId);
      if (!secret) {
        return { success: false, error: 'MFA not enabled for this user' };
      }

      // Verify the token
      const verification = await this.verifyToken(secret, token);
      if (!verification.success || !verification.verified) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Remove MFA secret
      await this.removeMFASecret(userId);

      return { success: true, message: 'MFA disabled successfully' };
    } catch (error) {
      console.error('MFA disable error:', error);
      return { success: false, error: error.message };
    }
  }

  static async verifyMFA(userId: string, token: string) {
    try {
      const secret = await this.getMFASecret(userId);
      if (!secret) {
        return { success: false, error: 'MFA not enabled for this user' };
      }

      const verification = await this.verifyToken(secret, token);
      return verification;
    } catch (error) {
      console.error('MFA verification error:', error);
      return { success: false, error: error.message };
    }
  }

  private static generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  private static async storeTemporarySecret(userId: string, secret: string) {
    // In production, store in Redis or database with expiration
    // For now, we'll use a simple in-memory store
    if (!global.mfaTempSecrets) {
      global.mfaTempSecrets = new Map();
    }
    global.mfaTempSecrets.set(userId, secret);
    
    // Set expiration (5 minutes)
    setTimeout(() => {
      global.mfaTempSecrets?.delete(userId);
    }, 5 * 60 * 1000);
  }

  private static async getTemporarySecret(userId: string): Promise<string | null> {
    return global.mfaTempSecrets?.get(userId) || null;
  }

  private static async storeMFASecret(userId: string, secret: string) {
    // In production, store in database
    // For now, we'll use a simple in-memory store
    if (!global.mfaSecrets) {
      global.mfaSecrets = new Map();
    }
    global.mfaSecrets.set(userId, secret);
  }

  private static async getMFASecret(userId: string): Promise<string | null> {
    return global.mfaSecrets?.get(userId) || null;
  }

  private static async removeMFASecret(userId: string) {
    global.mfaSecrets?.delete(userId);
  }
}

// Extend global type for TypeScript
declare global {
  var mfaTempSecrets: Map<string, string> | undefined;
  var mfaSecrets: Map<string, string> | undefined;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/auth/mfa/setup/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { MFAManager } from '@/lib/auth/mfa';
import { withSession } from '@/lib/auth/session-utils';

export const POST = withSession(async (req: any, res: any) => {
  try {
    const { userId } = req.session;
    const user = await auth.api.getUser({ userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await MFAManager.generateSecret(userId, user.email);
    
    if (result.success) {
      return NextResponse.json({
        qrCode: result.qrCode,
        manualEntryKey: result.manualEntryKey,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate MFA secret' }, { status: 500 });
  }
});`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/auth/mfa/enable/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { MFAManager } from '@/lib/auth/mfa';
import { withSession } from '@/lib/auth/session-utils';

export const POST = withSession(async (req: any, res: any) => {
  try {
    const { userId } = req.session;
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    // Get the temporary secret
    const secret = await MFAManager.getTemporarySecret(userId);
    if (!secret) {
      return NextResponse.json({ error: 'MFA setup session expired. Please start over.' }, { status: 400 });
    }

    const result = await MFAManager.enableMFA(userId, secret, token);
    
    if (result.success) {
      return NextResponse.json({
        message: result.message,
        backupCodes: result.backupCodes,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enable MFA' }, { status: 500 });
  }
});`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/auth/mfa/disable/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { MFAManager } from '@/lib/auth/mfa';
import { withSession } from '@/lib/auth/session-utils';

export const POST = withSession(async (req: any, res: any) => {
  try {
    const { userId } = req.session;
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const result = await MFAManager.disableMFA(userId, token);
    
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disable MFA' }, { status: 500 });
  }
});`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/auth/mfa/verify/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { MFAManager } from '@/lib/auth/mfa';

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();
    
    if (!userId || !token) {
      return NextResponse.json({ error: 'User ID and verification code are required' }, { status: 400 });
    }

    const result = await MFAManager.verifyMFA(userId, token);
    
    if (result.success && result.verified) {
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({ verified: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify MFA' }, { status: 500 });
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/auth/MFASetup.tsx',
      content: `'use client';

import { useState } from 'react';

interface MFASetupProps {
  onComplete: (backupCodes: string[]) => void;
  onCancel: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (response.ok) {
        setQrCode(data.qrCode);
        setManualKey(data.manualEntryKey);
        setStep('verify');
      } else {
        setError(data.error || 'Failed to setup MFA');
      }
    } catch (error) {
      setError('Failed to setup MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (response.ok) {
        onComplete(data.backupCodes);
      } else {
        setError(data.error || 'Failed to enable MFA');
      }
    } catch (error) {
      setError('Failed to enable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Enable Two-Factor Authentication</h3>
          <p className="mt-2 text-sm text-gray-600">
            Add an extra layer of security to your account by enabling 2FA.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You'll need an authenticator app like Google Authenticator, Authy, or 1Password.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSetup}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Setting up...' : 'Start Setup'}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Scan QR Code</h3>
        <p className="mt-2 text-sm text-gray-600">
          Scan this QR code with your authenticator app, then enter the verification code.
        </p>
      </div>

      <div className="flex justify-center">
        {qrCode && (
          <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Or enter this key manually:</p>
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
          {manualKey}
        </code>
      </div>

      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700">
          Verification Code
        </label>
        <input
          id="token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter 6-digit code"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleVerify}
          disabled={isLoading || !token}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify & Enable'}
        </button>
        <button
          onClick={() => setStep('setup')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center">{error}</div>
      )}
    </div>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/auth/MFAVerification.tsx',
      content: `'use client';

import { useState } from 'react';

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerification({ onSuccess, onCancel }: MFAVerificationProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!token) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (response.ok && data.verified) {
        onSuccess();
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
        <p className="mt-2 text-sm text-gray-600">
          Enter the verification code from your authenticator app.
        </p>
      </div>

      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700">
          Verification Code
        </label>
        <input
          id="token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter 6-digit code"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleVerify}
          disabled={isLoading || !token}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center">{error}</div>
      )}
    </div>
  );
}`
    }
  ]
};
export default multiFactorBlueprint;
