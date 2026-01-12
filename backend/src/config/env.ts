import { z } from 'zod';

/**
 * Environment variables schema validation
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  PORT: z.string().default('3000').transform(Number),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RSS_CACHE_TTL_MINUTES: z.string().default('10').transform(Number).refine(
    (val) => val >= 5 && val <= 15,
    'RSS_CACHE_TTL_MINUTES must be between 5 and 15'
  ),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}
