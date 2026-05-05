import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppEnvironment } from '../../config/env';
import { AppError, buildRequestMeta, normalizeError, sendSuccess } from '../../lib/http';
import { authRequestSchemas, authResponseSchemas } from './auth.schemas';
import {
  createRefreshCookie,
  getCurrentUser,
  loginUser,
  refreshSession,
  requestPasswordReset,
  resetPassword,
  revokeRefreshToken,
  signupUser,
  verifyEmail,
} from './auth.service';

interface AuthRouteOptions {
  env: AppEnvironment;
}

function clearRefreshCookie(reply: FastifyReply, env: AppEnvironment) {
  reply.clearCookie('nexus_refresh_token', {
    path: '/api/v1/auth',
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
  });
}

function getRefreshToken(request: FastifyRequest): string {
  const token = request.cookies?.nexus_refresh_token;
  if (!token) {
    throw new AppError('Refresh token is missing', 401, 'UNAUTHORIZED');
  }

  return token;
}

export async function registerAuthRoutes(app: FastifyInstance, options: AuthRouteOptions): Promise<void> {
  app.post('/api/v1/auth/signup', async (request, reply) => {
    const body = authRequestSchemas.signup.parse(request.body);
    const response = await signupUser({
      env: options.env,
      email: body.email,
      password: body.password,
      displayName: body.displayName,
    });

    return sendSuccess(reply, authResponseSchemas.signup.parse(response), 201, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/auth/verify-email', async (request, reply) => {
    const body = authRequestSchemas.verifyEmail.parse(request.body);
    const response = await verifyEmail({ token: body.token });

    return sendSuccess(reply, authResponseSchemas.message.parse(response), 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = authRequestSchemas.login.parse(request.body);
    const session = await loginUser({
      env: options.env,
      email: body.email,
      password: body.password,
    });

    const refreshCookie = createRefreshCookie(options.env, session.refreshToken, session.refreshExpiresAt);
    reply.setCookie(refreshCookie.name, refreshCookie.value, refreshCookie.options);

    return sendSuccess(
      reply,
      authResponseSchemas.session.parse({
        user: session.user,
        accessToken: session.accessToken,
      }),
      200,
      buildRequestMeta(request, 'v1')
    );
  });

  app.post('/api/v1/auth/refresh', async (request, reply) => {
    const refreshToken = getRefreshToken(request);
    const session = await refreshSession({ env: options.env, refreshToken });

    const refreshCookie = createRefreshCookie(options.env, session.refreshToken, session.refreshExpiresAt);
    reply.setCookie(refreshCookie.name, refreshCookie.value, refreshCookie.options);

    return sendSuccess(
      reply,
      authResponseSchemas.session.parse({
        user: session.user,
        accessToken: session.accessToken,
      }),
      200,
      buildRequestMeta(request, 'v1')
    );
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    const refreshToken = request.cookies?.nexus_refresh_token;
    if (refreshToken) {
      try {
        await revokeRefreshToken({ env: options.env, refreshToken });
      } catch (error) {
        request.log.warn({ error: normalizeError(error) }, 'logout revocation skipped');
      }
    }

    clearRefreshCookie(reply, options.env);

    return sendSuccess(reply, authResponseSchemas.message.parse({ message: 'Logged out successfully' }), 200, buildRequestMeta(request, 'v1'));
  });

  app.get('/api/v1/auth/me', async (request, reply) => {
    const response = await getCurrentUser({
      env: options.env,
      authorizationHeader: request.headers.authorization,
    });

    return sendSuccess(
      reply,
      authResponseSchemas.currentUser.parse({
        user: response.user,
        session: {
          sessionId: response.sessionId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        },
      }),
      200,
      buildRequestMeta(request, 'v1')
    );
  });

  app.post('/api/v1/auth/forgot-password', async (request, reply) => {
    const body = authRequestSchemas.forgotPassword.parse(request.body);
    const response = await requestPasswordReset({ email: body.email });

    return sendSuccess(reply, authResponseSchemas.message.parse(response), 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/auth/reset-password', async (request, reply) => {
    const body = authRequestSchemas.resetPassword.parse(request.body);
    const response = await resetPassword({
      env: options.env,
      token: body.token,
      password: body.password,
    });

    return sendSuccess(reply, authResponseSchemas.message.parse(response), 200, buildRequestMeta(request, 'v1'));
  });
}