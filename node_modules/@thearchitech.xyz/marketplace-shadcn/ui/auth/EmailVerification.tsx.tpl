'use client';

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmailVerification() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendVerification = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      // Mock API call - in real app, this would call the verification endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Verification email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    setError('');

    try {
      // Mock verification - in real app, this would call the verification endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (verificationCode === '123456') { // Mock valid code
        setIsVerified(true);
        setSuccess('Email verified successfully!');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <div>
                <h2 className="text-2xl font-bold">Email Verified!</h2>
                <p className="text-muted-foreground">
                  Your email address has been successfully verified.
                </p>
              </div>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold">Verify Your Email</h1>
        <p className="text-muted-foreground">
          We've sent a verification code to your email address
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Verification Code</CardTitle>
          <CardDescription>
            Check your email and enter the 6-digit code we sent you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                variant="link"
                onClick={handleSendVerification}
                disabled={isResending}
                className="text-sm"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Check your spam folder if you don't see the email in your inbox.
        </p>
      </div>
    </div>
  );
}
