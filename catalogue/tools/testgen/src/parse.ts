import { z } from 'zod';
import type { ChatFunction } from './llm.js';

export const ScenarioSchema = z.object({
  scenarios: z.array(z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    given: z.array(z.string().min(1)),
    when: z.array(z.string().min(1)),
    then: z.array(z.string().min(1)).min(1)
  })).min(1)
});
export type Scenario = z.infer<typeof ScenarioSchema>['scenarios'][number];

export function buildParsePrompt(criteria: string, validationError?: string): string {
  return [
    'Read the acceptance criteria below and convert them into testable end-to-end scenarios.',
    'Return ONLY valid JSON with this exact shape: {"scenarios":[{"id":"kebab-case","title":"...","given":["..."],"when":["..."],"then":["..."]}]}.',
    'Use observable user behavior. Do not invent requirements or fixture facts. Keep each THEN clause independently assertable.',
    validationError ? `Your previous output failed validation: ${validationError}. Correct it.` : '',
    'ACCEPTANCE CRITERIA:', criteria
  ].filter(Boolean).join('\n\n');
}

export async function parseCriteria(criteria: string, chat: ChatFunction, maxRetries: number): Promise<Scenario[]> {
  let validationError = '';
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const content = await chat([
      { role: 'system', content: 'You are a careful QA analyst. Output only schema-valid JSON; do not add markdown.' },
      { role: 'user', content: buildParsePrompt(criteria, validationError) }
    ], { json: true });
    try {
      const parsed = ScenarioSchema.parse(JSON.parse(content) as unknown);
      const ids = parsed.scenarios.map((scenario) => scenario.id);
      if (new Set(ids).size !== ids.length) throw new Error('Scenario IDs must be unique.');
      return parsed.scenarios;
    } catch (error) {
      validationError = error instanceof Error ? error.message : 'Unknown JSON/schema error';
    }
  }
  throw new Error(`Could not parse acceptance criteria after ${maxRetries} attempts: ${validationError}`);
}
