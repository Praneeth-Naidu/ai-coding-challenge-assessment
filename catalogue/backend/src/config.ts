import { z } from 'zod';

const EnvironmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  PRODUCT_SOURCE: z.enum(['fakestore', 'fixture']).default('fakestore'),
  FAKESTORE_BASE_URL: z.string().url().default('https://fakestoreapi.com'),
  CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SALES_INBOX_EMAIL: z.string().email().default('sales@example.test'),
  MAIL_FROM: z.string().email().default('catalogue@example.test'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0)
});

export type AppConfig = z.infer<typeof EnvironmentSchema>;

/** The only module in the backend that reads process.env. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvironmentSchema.parse(env);
}
