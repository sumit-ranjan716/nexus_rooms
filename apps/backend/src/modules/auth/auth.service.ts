import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { AppEnvironment } from '../../config/env';
import { AppError } from '../../lib/http';
import { prisma } from '../../lib/prisma';
import {
  buildRefreshCookieOptions,
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
  verifyAccessToken,
} from '../../lib/jwt';

const VERIFICATION_TOKEN_EXPIRY_MS = 1000 * 60 * 60;
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 1000 * 60 * 60;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export interface SerializedUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface AuthSessionResult {
  user: SerializedUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  sessionId: string;
}

function serializeUser(user: UserRecord): SerializedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createExpiresAt(durationMs: number): Date {
  return new Date(Date.now() + durationMs);
}

export async function hashPassword(password: string, cost: number): Promise<string> {
  return bcrypt.hash(password, cost);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signupUser(params: {
  env: AppEnvironment;
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: SerializedUser; message: string; verificationRequired: true }> {
  const email = normalizeEmail(params.email);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'CONFLICT');
  }

  const passwordHash = await hashPassword(params.password, params.env.BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: params.displayName.trim(),
    },
  });

  const token = generateOpaqueToken('verify');
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: createExpiresAt(VERIFICATION_TOKEN_EXPIRY_MS),
    },
  });

  return {
    user: serializeUser(user),
    message: 'Verification email sent. Please verify your email before logging in.',
    verificationRequired: true,
  };
}

export async function verifyEmail(params: { token: string }): Promise<{ user: SerializedUser; message: string }> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token: params.token },
    include: { user: true },
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    throw new AppError('Verification token is invalid or expired', 400, 'BAD_REQUEST');
  }

  const user = await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.delete({ where: { token: params.token } });

  return {
    user: serializeUser(user),
    message: 'Email verified successfully',
  };
}

async function createRefreshSession(params: {
  env: AppEnvironment;
  user: UserRecord;
  familyId?: string;
  rotatedFromSessionId?: string;
}): Promise<{ sessionId: string; refreshToken: string; refreshExpiresAt: Date }> {
  const refreshToken = generateOpaqueToken('refresh');
  const refreshExpiresAt = createExpiresAt(REFRESH_TOKEN_TTL_MS);
  const tokenHash = hashOpaqueToken(refreshToken, params.env.REFRESH_TOKEN_SECRET);

  const session = await prisma.refreshSession.create({
    data: {
      userId: params.user.id,
      familyId: params.familyId ?? randomUUID(),
      tokenHash,
      rotatedFromSessionId: params.rotatedFromSessionId,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    sessionId: session.id,
    refreshToken,
    refreshExpiresAt,
  };
}

export async function loginUser(params: {
  env: AppEnvironment;
  email: string;
  password: string;
}): Promise<AuthSessionResult> {
  const email = normalizeEmail(params.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
  }

  if (!user.emailVerified) {
    throw new AppError('Email must be verified before login', 403, 'FORBIDDEN');
  }

  const passwordMatches = await verifyPassword(params.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
  }

  const session = await createRefreshSession({ env: params.env, user });
  const accessToken = await signAccessToken(params.env, {
    userId: user.id,
    email: user.email,
    sessionId: session.sessionId,
    emailVerified: user.emailVerified,
  });

  return {
    user: serializeUser(user),
    accessToken,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
    sessionId: session.sessionId,
  };
}

export async function refreshSession(params: {
  env: AppEnvironment;
  refreshToken: string;
}): Promise<AuthSessionResult> {
  const tokenHash = hashOpaqueToken(params.refreshToken, params.env.REFRESH_TOKEN_SECRET);
  const currentSession = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!currentSession || currentSession.revokedAt || currentSession.expiresAt < new Date()) {
    throw new AppError('Refresh token is invalid or expired', 401, 'UNAUTHORIZED');
  }

  const nextSession = await createRefreshSession({
    env: params.env,
    user: currentSession.user,
    familyId: currentSession.familyId,
    rotatedFromSessionId: currentSession.id,
  });

  await prisma.refreshSession.update({
    where: { id: currentSession.id },
    data: {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    },
  });

  const accessToken = await signAccessToken(params.env, {
    userId: currentSession.user.id,
    email: currentSession.user.email,
    sessionId: nextSession.sessionId,
    emailVerified: currentSession.user.emailVerified,
  });

  return {
    user: serializeUser(currentSession.user),
    accessToken,
    refreshToken: nextSession.refreshToken,
    refreshExpiresAt: nextSession.refreshExpiresAt,
    sessionId: nextSession.sessionId,
  };
}

export async function revokeSession(params: { sessionId: string }): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: { id: params.sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeRefreshToken(params: {
  env: AppEnvironment;
  refreshToken: string;
}): Promise<void> {
  const tokenHash = hashOpaqueToken(params.refreshToken, params.env.REFRESH_TOKEN_SECRET);
  const session = await prisma.refreshSession.findUnique({ where: { tokenHash } });

  if (!session) {
    return;
  }

  await revokeSession({ sessionId: session.id });
}

export async function getCurrentUser(params: {
  env: AppEnvironment;
  authorizationHeader?: string;
}): Promise<{ user: SerializedUser; sessionId: string }> {
  const header = params.authorizationHeader;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Missing bearer token', 401, 'UNAUTHORIZED');
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = await verifyAccessToken(params.env, token);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return {
    user: serializeUser(user),
    sessionId: payload.sessionId,
  };
}

export async function requestPasswordReset(params: {
  email: string;
}): Promise<{ message: string }> {
  const email = normalizeEmail(params.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      message: 'If the account exists, a password reset email has been sent',
    };
  }

  const token = generateOpaqueToken('reset');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: createExpiresAt(PASSWORD_RESET_TOKEN_EXPIRY_MS),
    },
  });

  return {
    message: 'If the account exists, a password reset email has been sent',
  };
}

export async function resetPassword(params: {
  env: AppEnvironment;
  token: string;
  password: string;
}): Promise<{ message: string }> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: params.token },
    include: { user: true },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new AppError('Password reset token is invalid or expired', 400, 'BAD_REQUEST');
  }

  const passwordHash = await hashPassword(params.password, params.env.BCRYPT_COST);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await tx.passwordResetToken.delete({ where: { token: params.token } });

    await tx.refreshSession.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  return {
    message: 'Password reset successfully',
  };
}

export function createRefreshCookie(env: AppEnvironment, refreshToken: string, expiresAt: Date) {
  return {
    name: 'nexus_refresh_token',
    value: refreshToken,
    options: buildRefreshCookieOptions(env, expiresAt),
  };
}