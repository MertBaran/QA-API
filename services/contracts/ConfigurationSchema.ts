import { z } from 'zod';

// Environment mapping
export const ENVIRONMENT_CONFIG_MAP = {
  production: 'config.env.prod',
  development: 'config.env.dev',
  test: 'config.env.test',
  docker: 'config.env.docker',
} as const;

export type EnvironmentType = keyof typeof ENVIRONMENT_CONFIG_MAP;

// Configuration schemas
export const DatabaseConfigSchema = z
  .object({
    /** MongoDB URI - zorunlu: mongodb modunda ana DB, postgresql modunda audit için */
    MONGO_URI: z.string().optional(),
    /** PostgreSQL connection string - postgresql modunda zorunlu */
    DATABASE_URL: z.string().optional(),
    /** Database type. Default: 'mongodb' */
    DATABASE_TYPE: z
      .enum(['mongodb', 'postgresql'])
      .optional()
      .default('mongodb'),
  })
  .superRefine((data, ctx) => {
    const mongoUri =
      data.MONGO_URI && String(data.MONGO_URI).trim()
        ? String(data.MONGO_URI).trim()
        : undefined;
    const dbUrl =
      data.DATABASE_URL && String(data.DATABASE_URL).trim()
        ? String(data.DATABASE_URL).trim()
        : undefined;

    if (data.DATABASE_TYPE === 'mongodb') {
      if (!mongoUri) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MONGO_URI is required when DATABASE_TYPE=mongodb',
          path: ['MONGO_URI'],
        });
      }
    } else if (data.DATABASE_TYPE === 'postgresql') {
      if (!dbUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL is required when DATABASE_TYPE=postgresql',
          path: ['DATABASE_URL'],
        });
      }
      // MONGO_URI opsiyonel: Yoksa NoOpAuditProvider kullanılır, audit log yazılmaz
    }
  });

export const CacheConfigSchema = z.object({
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
});

export const JWTConfigSchema = z.object({
  JWT_SECRET_KEY: z.string().min(1, 'JWT secret key is required'),
  JWT_EXPIRE: z.string().default('10m'),
  JWT_COOKIE: z.string().default('10'),
});

export const SMTPConfigSchema = z.object({
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('465'),
  SMTP_USER: z.string().email().optional(),
  SMTP_APP_PASS: z.string().optional(),
});

export const RabbitMQConfigSchema = z.object({
  RABBITMQ_HOST: z.string().default('localhost'),
  RABBITMQ_PORT: z.string().default('5672'),
  RABBITMQ_USER: z.string().default('guest'),
  RABBITMQ_PASS: z.string().default('guest'),
  RABBITMQ_VHOST: z.string().default('/'),
});

export const NotificationConfigSchema = z.object({
  NOTIFICATION_TECHNOLOGY: z
    .enum(['queue', 'direct', 'hybrid'])
    .default('direct'),
});

export const ElasticsearchConfigSchema = z.object({
  ELASTICSEARCH_ENABLED: z
    .string()
    .transform(val => val === 'true' || val === '1')
    .pipe(z.boolean())
    .default(false),
  ELASTICSEARCH_URL: z.string().url().default('http://localhost:9200'),
  ELASTICSEARCH_USERNAME: z.string().optional(),
  ELASTICSEARCH_PASSWORD: z.string().optional(),
  ELASTICSEARCH_TLS_ENABLED: z
    .string()
    .transform(val => val === 'true' || val === '1')
    .pipe(z.boolean())
    .default(false),
  ELASTICSEARCH_TLS_SKIP_VERIFY: z
    .string()
    .transform(val => val === 'true' || val === '1')
    .pipe(z.boolean())
    .default(false),
  ELASTICSEARCH_REQUEST_TIMEOUT: z.string().default('30000'),
});

// URL validasyonu - Zod .url() localhost'ta bazen hata veriyor, refine kullan
const clientUrlSchema = z
  .string()
  .default('http://localhost:3001')
  .refine(val => {
    if (!val || !val.trim()) return false;
    try {
      new URL(val.trim());
      return true;
    } catch {
      return false;
    }
  }, 'Invalid URL');

export const AppConfigSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['production', 'development', 'test', 'docker']),
  CLIENT_URL: clientUrlSchema,
  GOOGLE_CLIENT_ID: z.string().optional(),
  RESET_PASSWORD_EXPIRE: z.string().default('3600'),
  DOCKERHUB_USERNAME: z.string().optional(),
  DOCKERHUB_TOKEN: z.string().optional(),
});

// Combined configuration schema
export const ConfigurationSchema = AppConfigSchema.merge(DatabaseConfigSchema)
  .merge(CacheConfigSchema)
  .merge(JWTConfigSchema)
  .merge(SMTPConfigSchema)
  .merge(RabbitMQConfigSchema)
  .merge(NotificationConfigSchema)
  .merge(ElasticsearchConfigSchema);

export type Configuration = z.infer<typeof ConfigurationSchema>;

// Validation result type
export interface ValidationResult {
  success: boolean;
  data?: Configuration;
  errors?: string[];
}

// Helper function to convert string numbers to actual numbers
export const parseNumericConfig = (config: Configuration) => ({
  ...config,
  PORT: parseInt(config.PORT, 10),
  REDIS_PORT: parseInt(config.REDIS_PORT, 10),
  JWT_COOKIE: parseInt(config.JWT_COOKIE, 10),
  SMTP_PORT: parseInt(config.SMTP_PORT, 10),
  RESET_PASSWORD_EXPIRE: parseInt(config.RESET_PASSWORD_EXPIRE, 10),
});

// Mask sensitive data for logging
export const maskSensitiveData = (
  config: Configuration
): Partial<Configuration> => {
  const masked = { ...config };

  if (masked.MONGO_URI) {
    masked.MONGO_URI = masked.MONGO_URI.replace(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
      'mongodb+srv://***:***@'
    );
  }

  if (masked.DATABASE_URL) {
    masked.DATABASE_URL = masked.DATABASE_URL.replace(
      /postgres(?:ql)?:\/\/([^:]+):([^@]+)@/,
      'postgresql://***:***@'
    );
  }

  if (masked.REDIS_URL) {
    masked.REDIS_URL = masked.REDIS_URL.replace(
      /rediss?:\/\/[^:]+:[^@]+@/,
      'redis://***:***@'
    );
  }

  if (masked.JWT_SECRET_KEY) {
    masked.JWT_SECRET_KEY = '***';
  }

  if (masked.SMTP_APP_PASS) {
    masked.SMTP_APP_PASS = '***';
  }

  if (masked.DOCKERHUB_TOKEN) {
    masked.DOCKERHUB_TOKEN = '***';
  }

  return masked;
};
