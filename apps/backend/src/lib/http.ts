import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError, z } from 'zod';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiResponseMeta {
  requestId?: string;
  timestamp?: string;
  version?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
    timestamp: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;

  public readonly code: ApiErrorCode;

  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ApiErrorCode, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const apiMetaSchema = z.object({
  requestId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  version: z.string().optional(),
});

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponseMeta
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta: apiMetaSchema.parse(meta) } : {}),
  };
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  _statusCode: number,
  details?: unknown,
  requestId?: string
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
    },
  };
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: ApiResponseMeta
): FastifyReply {
  return reply.code(statusCode).send(createSuccessResponse(data, meta));
}

export function sendError(
  reply: FastifyReply,
  error: AppError,
  requestId?: string
): FastifyReply {
  return reply.code(error.statusCode).send(
    createErrorResponse(error.code, error.message, error.statusCode, error.details, requestId)
  );
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError('Request validation failed', 400, 'VALIDATION_ERROR', error.flatten());
  }

  if (error instanceof Error && 'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number') {
    const statusCode = (error as { statusCode: number }).statusCode;
    const code: ApiErrorCode =
      statusCode === 400
        ? 'BAD_REQUEST'
        : statusCode === 401
          ? 'UNAUTHORIZED'
          : statusCode === 403
            ? 'FORBIDDEN'
            : statusCode === 404
              ? 'NOT_FOUND'
              : statusCode === 409
                ? 'CONFLICT'
                : 'INTERNAL_SERVER_ERROR';

    return new AppError(error.message, statusCode, code);
  }

  return new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
}

export function buildRequestMeta(request: FastifyRequest, version: string): ApiResponseMeta {
  return {
    requestId: request.id,
    timestamp: new Date().toISOString(),
    version,
  };
}
