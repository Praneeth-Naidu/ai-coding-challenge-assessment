import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const ConfigSchema = z.object({
  LLM_BASE_URL: z.string().url().default('http://localhost:11434/v1'),
  LLM_MODEL: z.string().min(1).optional(),
  LLM_API_KEY: z.string().default('local'),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.1),
  MAX_RETRIES: z.coerce.number().int().min(1).max(5).default(3),
  CRITERIA_PATH: z.string().default('requirements/acceptance-criteria.md'),
  CONTRACT_PATH: z.string().default('e2e/contract/ui-contract.md'),
  OUT_DIR: z.string().default('e2e/tests/generated')
});

export type TestgenConfig = {
  baseUrl: string; model: string; apiKey: string; temperature: number; maxRetries: number;
  criteriaPath: string; contractPath: string; outDir: string; projectRoot: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env, requireModel = true): TestgenConfig {
  const parsed = ConfigSchema.parse(env);
  if (requireModel && !parsed.LLM_MODEL) throw new Error('LLM_MODEL is required. Set it to the exact tag shown by `ollama list`.');
  return {
    baseUrl: parsed.LLM_BASE_URL,
    model: parsed.LLM_MODEL ?? '',
    apiKey: parsed.LLM_API_KEY,
    temperature: parsed.LLM_TEMPERATURE,
    maxRetries: parsed.MAX_RETRIES,
    criteriaPath: resolve(projectRoot, parsed.CRITERIA_PATH),
    contractPath: resolve(projectRoot, parsed.CONTRACT_PATH),
    outDir: resolve(projectRoot, parsed.OUT_DIR),
    projectRoot
  };
}
