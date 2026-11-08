import { readFile } from 'node:fs/promises';

const baseUrl = process.env.LLM_BASE_URL.replace(/\/$/, '');
const model = process.env.LLM_MODEL;
const apiKey = process.env.LLM_API_KEY;

const criteria = await readFile(
  '../../requirements/acceptance-criteria.md',
  'utf8'
);

const prompt = [
  'Read the acceptance criteria below and convert them into testable end-to-end scenarios.',
  'Return ONLY valid JSON with this exact shape: {"scenarios":[{"id":"kebab-case","title":"...","given":["..."],"when":["..."],"then":["..."]}]}.',
  'Use observable user behavior. Do not invent requirements or fixture facts. Keep each THEN clause independently assertable.',
  'ACCEPTANCE CRITERIA:',
  criteria
].join('\n\n');

console.log('Model:', model);
console.log('Prompt characters:', prompt.length);
console.log('Sending request...');

const start = Date.now();

try {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a careful QA analyst. Output only schema-valid JSON; do not add markdown.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }),
    signal: AbortSignal.timeout(180000)
  });

  console.log('HTTP:', response.status);
  console.log('Elapsed:', ((Date.now() - start) / 1000).toFixed(2), 'seconds');

  const body = await response.text();
  console.log('Response:', body.slice(0, 5000));
} catch (error) {
  console.error('Elapsed:', ((Date.now() - start) / 1000).toFixed(2), 'seconds');
  console.error('Error:', error);
}