/**
 * Auth Schemas - Zod Validation
 * 
 * ARCHITECTURE: Single Source of Truth
 * - Schemas defined in tech-stack
 * - Backend imports for server-side validation
 * - Frontend imports for client-side validation
 */

import { z } from 'zod';

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const SignOutSchema = z.object({
  everywhere: z.boolean().optional(), // Sign out from all devices
});

// ============================================================================
// PASSWORD MANAGEMENT SCHEMAS
// ============================================================================

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ConfirmPasswordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================================================
// PROFILE MANAGEMENT SCHEMAS
// ============================================================================

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
});

// ============================================================================
// EMAIL VERIFICATION SCHEMAS
// ============================================================================

export const SendVerificationEmailSchema = z.object({
  email: z.string().email('Invalid email address').optional(), // Optional, defaults to current user
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ============================================================================
// TWO-FACTOR AUTH SCHEMAS
// ============================================================================

export const EnableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required for security'),
});

export const DisableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required for security'),
  code: z.string().length(6, 'Verification code must be 6 digits').optional(),
});

export const VerifyTwoFactorSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================================================
// OAUTH SCHEMAS
// ============================================================================

export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const ConnectAccountSchema = z.object({
  provider: z.enum(['google', 'github', 'facebook', 'twitter', 'microsoft', 'apple']),
  accessToken: z.string().optional(),
});

export const DisconnectAccountSchema = z.object({
  provider: z.enum(['google', 'github', 'facebook', 'twitter', 'microsoft', 'apple']),
  accountId: z.string(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof ConfirmPasswordResetSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type EnableTwoFactorInput = z.infer<typeof EnableTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof DisableTwoFactorSchema>;
export type VerifyTwoFactorInput = z.infer<typeof VerifyTwoFactorSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type User = z.infer<typeof UserSchema>;
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;
export type ConnectAccountInput = z.infer<typeof ConnectAccountSchema>;
export type DisconnectAccountInput = z.infer<typeof DisconnectAccountSchema>;

