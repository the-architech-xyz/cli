'use client';

// Forgot Password Page Component

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { authClient } from '@/lib/auth/client';  // Better Auth native
import { ResetPasswordSchema } from '@/lib/auth';  // Generic schema from tech-stack

interface ForgotPasswordPageProps {
  onSuccess?: () => void;
  className?: string;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onSuccess,
  className = '',
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Better Auth native password reset
      await authClient.forgetPassword({ email, redirectTo: '/reset-password' });
      
      setIsEmailSent(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  if (isEmailSent) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent you a password reset link
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Email sent successfully
                  </h3>
                  <p className="text-sm text-gray-600">
                    We've sent a password reset link to{' '}
                    <span className="font-medium text-gray-900">{email}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Please check your email and click the link to reset your password.
                    The link will expire in 1 hour.
                  </p>
                  
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEmail('');
                        // Reset the hook state
                        window.location.reload();
                      }}
                    >
                      Send another email
                    </Button>
                    
                    <Link href="/auth/login">
                      <Button variant="ghost" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No worries, we'll send you reset instructions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            If you don't receive an email within a few minutes, check your spam folder.
            The reset link will expire in 1 hour for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
};