import Fastify from 'fastify';
import { z } from 'zod';
import { loadEnvironment } from './config/env';
import { AppError, buildRequestMeta, normalizeError, sendError, sendSuccess } from './lib/http';

const env = loadEnvironment();
const API_VERSION = 'v1';

const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number().nonnegative().optional(),
});

const testQuerySchema = z.object({
  message: z.string().trim().min(1).max(120).optional(),
});

async function start(): Promise<void> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'production'
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            },
          }),
    },
    requestIdHeader: 'x-request-id',
  });

  const requestStartTimes = new WeakMap<object, number>();

  app.addHook('onRequest', async (request) => {
    requestStartTimes.set(request, Date.now());
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
      },
      'request started'
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = requestStartTimes.get(request);
    const durationMs = startedAt ? Date.now() - startedAt : undefined;

    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs,
      },
      'request completed'
    );
  });

  app.setErrorHandler((error, request, reply) => {
    const appError = normalizeError(error);

    request.log.error(
      {
        requestId: request.id,
        err: error,
        statusCode: appError.statusCode,
        code: appError.code,
      },
      'request failed'
    );

    sendError(reply, appError, request.id);
  });

  app.setNotFoundHandler((request, reply) => {
    const error = new AppError('Route not found', 404, 'NOT_FOUND');

    request.log.warn(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
      },
      'route not found'
    );

    sendError(reply, error, request.id);
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    const payload = healthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      uptime: process.uptime(),
    });

    return sendSuccess(reply, payload, 200, buildRequestMeta(request, API_VERSION));
  });

  // API version endpoint
  app.get('/api/v1/health', async (request, reply) => {
    const payload = healthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      uptime: process.uptime(),
    });

    return sendSuccess(reply, payload, 200, buildRequestMeta(request, API_VERSION));
  });

  // Basic routes for testing
  app.get('/api/v1/test', async (request, reply) => {
    const query = testQuerySchema.parse(request.query);
    const payload = {
      message: query.message || 'Backend is running!',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    };

    return sendSuccess(reply, payload, 200, buildRequestMeta(request, API_VERSION));
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      {
        host: env.HOST,
        port: env.PORT,
        logLevel: env.LOG_LEVEL,
        nodeEnv: env.NODE_ENV,
      },
      'server listening'
    );
  } catch (err) {
    app.log.error({ err }, 'failed to start server');
    process.exit(1);
  }
}

start();
