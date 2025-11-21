'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useSignIn, useOAuthSignIn } from '@/lib/hooks/use-auth';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, onForgotPassword, className }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  
  const signIn = useSignIn();
  const oauthSignIn = useOAuthSignIn();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      twoFactorCode: ''
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await signIn.mutateAsync(data);
      
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { url } = await oauthSignIn.mutateAsync({ provider });
      window.location.href = url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth sign in failed';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    onForgotPassword?.();
  };

  return (
    <motion.div
      initial=${ opacity: 0, y: 20 }
      animate=${ opacity: 1, y: 0 }
      transition=${ duration: 0.5 }
      className={`w-full max-w-md mx-auto ${className}`}
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="space-y-2 text-center pb-8">
          <motion.div
            initial=${ scale: 0.8 }
            animate=${ scale: 1 }
            transition=${ delay: 0.2, type: "spring", stiffness: 200 }
            className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial=${ opacity: 0, scale: 0.8 }
                animate=${ opacity: 1, scale: 1 }
                exit=${ opacity: 0, scale: 0.8 }
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  Successfully signed in!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Redirecting you now...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial=${ opacity: 0 }
                animate=${ opacity: 1 }
                exit=${ opacity: 0 }
                className="space-y-6"
              >
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        placeholder="Enter your email address"
                        disabled={isLoading}
                        className="pl-10 h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <AnimatePresence>
                      {form.formState.errors.email && (
                        <motion.p
                          initial=${ opacity: 0, y: -10 }
                          animate=${ opacity: 1, y: 0 }
                          exit=${ opacity: 0, y: -10 }
                          className="text-sm text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {form.formState.errors.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...form.register('password')}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className="pl-10 pr-10 h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {form.formState.errors.password && (
                        <motion.p
                          initial=${ opacity: 0, y: -10 }
                          animate=${ opacity: 1, y: 0 }
                          exit=${ opacity: 0, y: -10 }
                          className="text-sm text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {form.formState.errors.password.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Two Factor Code */}
                  {requiresTwoFactor && (
                    <motion.div
                      initial=${ opacity: 0, height: 0 }
                      animate=${ opacity: 1, height: 'auto' }
                      exit=${ opacity: 0, height: 0 }
                      className="space-y-2"
                    >
                      <Label htmlFor="twoFactorCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Two-Factor Authentication Code
                      </Label>
                      <Input
                        id="twoFactorCode"
                        {...form.register('twoFactorCode')}
                        placeholder="Enter 6-digit code"
                        disabled={isLoading}
                        className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </motion.div>
                  )}

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        {...form.register('rememberMe')}
                        disabled={isLoading}
                        className="border-gray-300"
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-gray-700 dark:text-gray-300">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial=${ opacity: 0, y: -10 }
                        animate=${ opacity: 1, y: 0 }
                        exit=${ opacity: 0, y: -10 }
                      >
                        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-800 dark:text-red-200">
                            {error}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    whileHover=${ scale: 1.02 }
                    whileTap=${ scale: 0.98 }
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Social Auth */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={isLoading}
                      className="h-11"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthSignIn('github')}
                      disabled={isLoading}
                      className="h-11"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </Button>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                  <Link 
                    href="/auth/signup" 
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
