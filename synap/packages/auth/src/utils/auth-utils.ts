// Authentication utility functions

import { AuthError, User, AuthSession, SocialProvider } from './auth-types';

// Token utilities
export const generateToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateSecureToken = (): string => {
  return generateToken(64);
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateToken(8).toUpperCase());
  }
  return codes;
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

export const validatePassword = (password: string, config: {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Email utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const generateEmailVerificationToken = (): string => {
  return generateSecureToken();
};

export const generatePasswordResetToken = (): string => {
  return generateSecureToken();
};

// Session utilities
export const createSession = (user: User, expiresIn: number = 24 * 60 * 60 * 1000): AuthSession => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn);

  return {
    user,
    accessToken: generateSecureToken(),
    refreshToken: generateSecureToken(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };
};

export const isSessionValid = (session: AuthSession): boolean => {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  return expiresAt > now;
};

export const refreshSession = (session: AuthSession, expiresIn: number = 24 * 60 * 60 * 1000): AuthSession => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn);

  return {
    ...session,
    accessToken: generateSecureToken(),
    refreshToken: generateSecureToken(),
    expiresAt: expiresAt.toISOString(),
  };
};

// Two-factor authentication utilities
export const generateTwoFactorSecret = (): string => {
  return generateToken(32);
};

export const generateTwoFactorQRCode = (secret: string, email: string, issuer: string = 'Your App'): string => {
  const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
};

export const verifyTwoFactorCode = (secret: string, code: string): boolean => {
  // This is a simplified implementation
  // In a real app, you'd use a proper TOTP library
  const now = Math.floor(Date.now() / 1000 / 30);
  const expectedCode = generateTOTPCode(secret, now);
  return code === expectedCode;
};

const generateTOTPCode = (secret: string, time: number): string => {
  // Simplified TOTP implementation
  // In production, use a proper library like 'otplib'
  const hash = btoa(secret + time);
  const code = parseInt(hash.slice(-6), 16) % 1000000;
  return code.toString().padStart(6, '0');
};

// Social authentication utilities
export const getSocialProviderConfig = (provider: string): SocialProvider | null => {
  const providers: SocialProvider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: 'google',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUrl: '/auth/callback/google',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: 'github',
      enabled: !!process.env.GITHUB_CLIENT_ID,
      clientId: process.env.GITHUB_CLIENT_ID,
      redirectUrl: '/auth/callback/github',
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: 'microsoft',
      enabled: !!process.env.MICROSOFT_CLIENT_ID,
      clientId: process.env.MICROSOFT_CLIENT_ID,
      redirectUrl: '/auth/callback/microsoft',
    },
  ];

  return providers.find(p => p.id === provider) || null;
};

export const generateSocialAuthUrl = (provider: string, state: string): string => {
  const config = getSocialProviderConfig(provider);
  if (!config) {
    throw new Error(`Provider ${provider} not configured`);
  }

  const baseUrls = {
    google: 'https://accounts.google.com/oauth/authorize',
    github: 'https://github.com/login/oauth/authorize',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  };

  const baseUrl = baseUrls[provider as keyof typeof baseUrls];
  if (!baseUrl) {
    throw new Error(`Provider ${provider} not supported`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}${config.redirectUrl}`,
    response_type: 'code',
    scope: getSocialProviderScope(provider),
    state,
  });

  return `${baseUrl}?${params.toString()}`;
};

const getSocialProviderScope = (provider: string): string => {
  const scopes = {
    google: 'openid email profile',
    github: 'user:email',
    microsoft: 'openid email profile',
  };

  return scopes[provider as keyof typeof scopes] || 'openid email profile';
};

// Security utilities
export const generateCSRFToken = (): string => {
  return generateSecureToken();
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const detectSuspiciousActivity = (user: User, request: {
  ipAddress: string;
  userAgent: string;
  location?: string;
}): boolean => {
  // Simple suspicious activity detection
  // In production, you'd use more sophisticated methods
  
  // Check for unusual IP patterns
  if (user.lastLoginAt) {
    const lastLogin = new Date(user.lastLoginAt);
    const now = new Date();
    const timeDiff = now.getTime() - lastLogin.getTime();
    
    // If login is very recent (less than 1 minute), it might be suspicious
    if (timeDiff < 60000) {
      return true;
    }
  }

  // Check for unusual user agent patterns
  if (request.userAgent.includes('bot') || request.userAgent.includes('crawler')) {
    return true;
  }

  return false;
};

// Error utilities
export const createAuthError = (code: string, message: string, field?: string): AuthError => {
  return {
    code,
    message,
    field,
  };
};

export const handleAuthError = (error: any): AuthError => {
  if (error.code && error.message) {
    return error as AuthError;
  }

  // Handle common error types
  if (error.name === 'ValidationError') {
    return createAuthError('VALIDATION_ERROR', 'Invalid input data', error.field);
  }

  if (error.name === 'UnauthorizedError') {
    return createAuthError('UNAUTHORIZED', 'Authentication required');
  }

  if (error.name === 'ForbiddenError') {
    return createAuthError('FORBIDDEN', 'Access denied');
  }

  if (error.name === 'NotFoundError') {
    return createAuthError('NOT_FOUND', 'Resource not found');
  }

  if (error.name === 'ConflictError') {
    return createAuthError('CONFLICT', 'Resource already exists');
  }

  if (error.name === 'RateLimitError') {
    return createAuthError('RATE_LIMIT', 'Too many requests');
  }

  // Default error
  return createAuthError('INTERNAL_ERROR', 'An unexpected error occurred');
};

// Validation utilities
export const validateSignInData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || data.password.length < 1) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateSignUpData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!data.agreedToTerms) {
    errors.push('You must agree to the terms and conditions');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Storage utilities
export const setAuthStorage = (key: string, value: any): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set auth storage:', error);
    }
  }
};

export const getAuthStorage = (key: string): any => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to get auth storage:', error);
      return null;
    }
  }
  return null;
};

export const removeAuthStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove auth storage:', error);
    }
  }
};

export const clearAuthStorage = (): void => {
  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('auth_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }
  }
};
