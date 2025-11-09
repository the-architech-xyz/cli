'use client';

// Verify Email Page Component

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useEmailVerification } from './use-email-verification';

interface VerifyEmailPageProps {
  onSuccess?: () => void;
  className?: string;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  onSuccess,
  className = '',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerification, isLoading, error, isVerified } = useEmailVerification();
  
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    } else {
      setIsVerifying(false);
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams, verifyEmail]);

  const handleResendVerification = async () => {
    if (email) {
      try {
        await resendVerification(email);
      } catch (err) {
        // Error is handled by the useEmailVerification hook
      }
    }
  };

  if (isVerifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Email verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified
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
                    Verification successful
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your email address has been verified. You can now access all features of your account.
                  </p>
                </div>

                <div className="space-y-2">
                  <Link href="/dashboard">
                    <Button className="w-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                  
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              There was a problem verifying your email
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Verification failed
                  </h3>
                  <p className="text-sm text-gray-600">
                    The verification link is invalid or has expired. 
                    Please request a new verification email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleResendVerification}
                    disabled={isLoading || !email}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend verification email
                      </>
                    )}
                  </Button>
                  
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Button>
                  </Link>
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
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent you a verification link
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address
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

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Verification email sent
                </h3>
                <p className="text-sm text-gray-600">
                  Please check your email and click the verification link to activate your account.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or request a new one.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleResendVerification}
                    disabled={isLoading || !email}
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend verification email
                      </>
                    )}
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

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            The verification link will expire in 24 hours. If you don't receive an email within a few minutes, check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};