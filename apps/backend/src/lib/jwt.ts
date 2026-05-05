import { createHmac, randomBytes } from 'node:crypto';
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';
import type { AppEnvironment } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  emailVerified: boolean;
}

export function generateOpaqueToken(prefix = 'refresh'): string {
  return `${prefix}_${randomBytes(32).toString('base64url')}`;
}

export function hashOpaqueToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function buildRefreshCookieOptions(env: AppEnvironment, expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth',
    expires: expiresAt,
  };
}

export async function signAccessToken(
  env: AppEnvironment,
  payload: AccessTokenPayload
): Promise<string> {
  const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');

  return new SignJWT({
    email: payload.email,
    sessionId: payload.sessionId,
    emailVerified: payload.emailVerified,
    tokenType: 'access',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setIssuer('nexus-rooms')
    .setAudience(env.APP_URL)
    .setExpirationTime('15m')
    .sign(privateKey);
}

export async function verifyAccessToken(
  env: AppEnvironment,
  token: string
): Promise<AccessTokenPayload> {
  const publicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'nexus-rooms',
    audience: env.APP_URL,
  });

  return {
    userId: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
    sessionId: String(payload.sessionId ?? ''),
    emailVerified: Boolean(payload.emailVerified),
  };
}