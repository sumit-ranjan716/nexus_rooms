import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const signupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(120),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const authSessionSchema = z.object({
  user: userSchema,
  accessToken: z.string().min(1),
});

export const signupResponseSchema = z.object({
  user: userSchema,
  message: z.string(),
  verificationRequired: z.literal(true),
});

export const authMessageSchema = z.object({
  message: z.string(),
});

export const currentUserResponseSchema = z.object({
  user: userSchema,
  session: z.object({
    sessionId: z.string().uuid(),
    expiresAt: z.string(),
  }),
});

export const authResponseSchemas = {
  signup: signupResponseSchema,
  session: authSessionSchema,
  message: authMessageSchema,
  currentUser: currentUserResponseSchema,
} as const;

export const authRequestSchemas = {
  signup: signupRequestSchema,
  login: loginRequestSchema,
  verifyEmail: verifyEmailRequestSchema,
  forgotPassword: forgotPasswordRequestSchema,
  resetPassword: resetPasswordRequestSchema,
} as const;