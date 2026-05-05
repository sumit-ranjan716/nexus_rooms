import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
    SESSION_MAX_AGE: z.coerce.number().int().positive().default(2_592_000_000),
    APP_URL: z.string().url('APP_URL must be a valid URL'),
    API_URL: z.string().url().optional(),
    JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
    JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
    REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
    AWS_REGION: z.string().min(1).optional(),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_BUCKET_NAME: z.string().min(1).optional(),
    S3_UPLOADS_PREFIX: z.string().min(1).default('rooms/'),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production') {
      const requiredFields: Array<keyof typeof value> = [
        'APP_URL',
        'JWT_PRIVATE_KEY',
        'JWT_PUBLIC_KEY',
        'REFRESH_TOKEN_SECRET',
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME',
      ];

      for (const field of requiredFields) {
        if (!value[field]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field} is required in production`,
            path: [field],
          });
        }
      }
    }
  });

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function loadEnvironment(): AppEnvironment {
  return environmentSchema.parse(process.env);
}
