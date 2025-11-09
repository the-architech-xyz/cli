'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { authClient, useSession } from '@/lib/auth/client';  // Better Auth native
import type { TwoFactorSetupData, TwoFactorVerifyData } from '@/lib/auth/types';  // From tech-stack

const setupSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const verifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type SetupFormData = z.infer<typeof setupSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function TwoFactorSetup({ onSuccess, onCancel, className }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'recovery' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const { useSecurity } = useAuthService();
  const { setupTwoFactor, verifyTwoFactor } = useSecurity();

  const setupForm = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      password: '',
    },
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  // Setup 2FA
  const handleSetup = async (data: SetupFormData) => {
    try {
      setError(null);
      const result = await setupTwoFactor.mutateAsync({ password: data.password });
      
      if (result.success) {
        setQrCode(result.qrCode || '');
        setSecret(result.secret || '');
        setRecoveryCodes(result.recoveryCodes || []);
        setStep('verify');
      } else {
        setError(result.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    }
  };

  // Verify 2FA
  const handleVerify = async (data: VerifyFormData) => {
    try {
      setError(null);
      const result = await verifyTwoFactor.mutateAsync({ code: data.code });
      
      if (result.success) {
        setStep('recovery');
      } else {
        setError(result.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  // Complete setup
  const handleComplete = () => {
    setStep('complete');
    setTimeout(() => {
      onSuccess?.();
    }, 2000);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download recovery codes
  const downloadRecoveryCodes = () => {
    const content = recoveryCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Card>
        <CardHeader className="text-center">
          <motion.div
            initial=${ scale: 0.8 }
            animate=${ scale: 1 }
            transition=${ delay: 0.2, type: "spring", stiffness: 200 }
            className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
          Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <motion.div
                key="setup"
                initial=${ opacity: 0, x: 20 }
                animate=${ opacity: 1, x: 0 }
                exit=${ opacity: 0, x: -20 }
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Step 1: Verify Your Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your current password to begin setting up 2FA
        </p>
      </div>

                <form onSubmit={setupForm.handleSubmit(handleSetup)} className="space-y-4">
                  <div>
                    <Label htmlFor="password">Current Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...setupForm.register('password')}
                      placeholder="Enter your current password"
                      disabled={setupTwoFactor.isPending}
                    />
                    {setupForm.formState.errors.password && (
                      <p className="text-sm text-red-500 mt-1">
                        {setupForm.formState.errors.password.message}
                      </p>
                    )}
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
                      onClick={onCancel}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={setupTwoFactor.isPending}
                      className="flex-1"
                    >
                      {setupTwoFactor.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div
                key="verify"
                initial=${ opacity: 0, x: 20 }
                animate=${ opacity: 1, x: 0 }
                exit=${ opacity: 0, x: -20 }
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Step 2: Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Use your authenticator app to scan this QR code
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 text-center">
                      {qrCode ? (
                        <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
              </div>
                      )}
            </div>
            
            <div className="space-y-2">
              <Label>Manual Entry Key</Label>
                      <div className="flex gap-2">
              <Input
                          value={secret}
                readOnly
                className="font-mono text-sm"
              />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(secret, 'secret')}
                        >
                          {copied === 'secret' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
            </div>

                  <div className="flex-1 space-y-4">
            <div className="space-y-2">
                      <Label>Supported Apps</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Badge variant="outline" className="justify-center">
                          <Smartphone className="w-3 h-3 mr-1" />
                          Google Authenticator
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          <Smartphone className="w-3 h-3 mr-1" />
                          Authy
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          <Smartphone className="w-3 h-3 mr-1" />
                          1Password
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          <Smartphone className="w-3 h-3 mr-1" />
                          Microsoft Authenticator
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-4">
                      <div>
                        <Label htmlFor="code">Verification Code</Label>
              <Input
                          id="code"
                          {...verifyForm.register('code')}
                          placeholder="Enter 6-digit code"
                maxLength={6}
                          className="text-center text-lg font-mono tracking-widest"
              />
                        {verifyForm.formState.errors.code && (
                          <p className="text-sm text-red-500 mt-1">
                            {verifyForm.formState.errors.code.message}
                          </p>
                        )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={verifyTwoFactor.isPending}
                      >
                        {verifyTwoFactor.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Continue'
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'recovery' && (
              <motion.div
                key="recovery"
                initial=${ opacity: 0, x: 20 }
                animate=${ opacity: 1, x: 0 }
                exit=${ opacity: 0, x: -20 }
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Step 3: Save Recovery Codes</h3>
                  <p className="text-sm text-muted-foreground">
                    Save these recovery codes in a safe place. You can use them to access your account if you lose your device.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Recovery Codes</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                      >
                        {showRecoveryCodes ? (
                          <EyeOff className="w-4 h-4 mr-1" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        {showRecoveryCodes ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'recovery')}
                      >
                        {copied === 'recovery' ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadRecoveryCodes}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {recoveryCodes.map((code, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-muted-foreground">{index + 1}.</span>
                          <span className={showRecoveryCodes ? 'text-foreground' : 'text-transparent bg-gray-300 dark:bg-gray-600 rounded'}>
                            {showRecoveryCodes ? code : '••••••••••••'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Each recovery code can only be used once. 
                      Store them in a safe place and don't share them with anyone.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex gap-2">
              <Button
                    type="button"
                variant="outline"
                    onClick={() => setStep('verify')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                    type="button"
                    onClick={handleComplete}
                className="flex-1"
              >
                    Complete Setup
              </Button>
            </div>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial=${ opacity: 0, scale: 0.8 }
                animate=${ opacity: 1, scale: 1 }
                exit=${ opacity: 0, scale: 0.8 }
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  Two-Factor Authentication Enabled!
                </h3>
              <p className="text-sm text-muted-foreground">
                  Your account is now protected with 2FA. You'll be redirected shortly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          </CardContent>
        </Card>
    </div>
  );
}