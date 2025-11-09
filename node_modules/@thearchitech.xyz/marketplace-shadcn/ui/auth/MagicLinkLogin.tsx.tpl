'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authClient, useSession } from '@/lib/auth/client';  // Better Auth native
import type { MagicLinkData } from '@/lib/auth/types';  // From tech-stack

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

interface MagicLinkLoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

export function MagicLinkLogin({ onSuccess, onBack, className }: MagicLinkLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { useAuthentication } = useAuthService();
  const { magicLinkSignIn } = useAuthentication();

  const form = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);
    setError(null);
    setEmail(data.email);

    try {
      const result = await magicLinkSignIn.mutateAsync({
        email: data.email,
        redirectTo: window.location.origin + '/dashboard',
      });

      if (result.success) {
        setIsSent(true);
        setResendCooldown(60); // 60 seconds cooldown
        startCooldown();
      } else {
        setError(result.message || 'Failed to send magic link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await magicLinkSignIn.mutateAsync({
        email: email,
        redirectTo: window.location.origin + '/dashboard',
      });

      if (result.success) {
        setResendCooldown(60);
        startCooldown();
      } else {
        setError(result.message || 'Failed to resend magic link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBack = () => {
    setIsSent(false);
    setError(null);
    setEmail('');
    setResendCooldown(0);
    form.reset();
    onBack?.();
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card>
        <CardHeader className="text-center">
          <motion.div
            initial=${ scale: 0.8 }
            animate=${ scale: 1 }
            transition=${ delay: 0.2, type: "spring", stiffness: 200 }
            className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
          >
            <Mail className="w-6 h-6 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold">
            {isSent ? 'Check Your Email' : 'Magic Link Login'}
          </CardTitle>
          <CardDescription>
            {isSent 
              ? 'We sent you a secure login link'
              : 'Enter your email to receive a secure login link'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="form"
                initial=${ opacity: 0, x: 20 }
                animate=${ opacity: 1, x: 0 }
                exit=${ opacity: 0, x: -20 }
                className="space-y-6"
              >
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        placeholder="Enter your email address"
                        disabled={isLoading}
                        className="pl-10 h-11"
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Magic Link...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Magic Link
                        </>
                      )}
                    </Button>

                    {onBack && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleBack}
                        disabled={isLoading}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sign In
                      </Button>
                    )}
                  </div>
                </form>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    We'll send you a secure link that you can use to sign in without a password.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial=${ opacity: 0, scale: 0.8 }
                animate=${ opacity: 1, scale: 1 }
                exit=${ opacity: 0, scale: 0.8 }
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Magic Link Sent!</h3>
                    <p className="text-sm text-muted-foreground">
                      We sent a secure login link to{' '}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Next steps:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the "Sign In" button in the email</li>
                        <li>You'll be automatically signed in</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the email?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResend}
                      disabled={isLoading || resendCooldown > 0}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend in {resendCooldown}s
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend Magic Link
                        </>
                      )}
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Try Different Email
                    </Button>
                    <Button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Page
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
