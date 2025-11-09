'use client';

// Forgot Password Form Component

"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: string;
  onBackToLogin?: () => void;
  className?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  success,
  onBackToLogin,
  className = '',
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch('email', '');

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await onSubmit(data);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  };

  if (isSubmitted && success) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent password reset instructions to your email address
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              If an account with the email <strong>{email}</strong> exists, 
              you will receive password reset instructions shortly.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Try Different Email
              </Button>
              
              {onBackToLogin && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onBackToLogin}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && !isSubmitted && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="pl-10"
                {...register('email')}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
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
                Sending Reset Link...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reset Link
              </>
            )}
          </Button>
        </form>

        {/* Additional Help */}
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            <p>Remember your password?</p>
            {onBackToLogin && (
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:underline"
                onClick={onBackToLogin}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Button>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              Having trouble? Contact our{' '}
              <a href="/support" className="text-blue-600 hover:underline">
                support team
              </a>{' '}
              for assistance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
