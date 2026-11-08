
import { readFile } from 'node:fs/promises';
import type { ChatFunction } from './llm.js';
import type { Scenario } from './parse.js';

export type GenerateContext = {
  contractPath: string;
  examplePath: string;
};

export async function buildScenarioPrompt(
  scenario: Scenario,
  context: GenerateContext
): Promise<string> {
  const contract = await readFile(context.contractPath, 'utf8');

  const isEmailScenario =
    /enquir|email|sales inbox/i.test(
      `${scenario.id} ${scenario.title} ${scenario.then.join(' ')}`
    );
  const isSearchScenario =
    /search/i.test(`${scenario.id} ${scenario.title}`);

  // Only provide the email example for email-related scenarios.
  const example = isEmailScenario
    ? await readFile(context.examplePath, 'utf8')
    : '';

  const rules = [
    'You are generating Playwright tests for a product catalogue application.',
    'Generate exactly the requested scenario. Do not add unrelated functionality.',
    '',
    'STRICT RULES:',
    '- Import { test, expect } from "@playwright/test".',
    '- Use ONLY page.getByTestId(...) for UI selectors.',
    '- Every test ID must exist in the UI contract.',
    '- Use only routes and fixture facts explicitly listed in the contract.',
    '- Generate EXACTLY one test() block for each THEN clause.',
    `- Expected test() count: ${scenario.then.length}.`,
    '- Do not create additional tests, setup tests or unrelated test cases.',
    '- Every test must contain at least one meaningful expect() assertion.',
    '- Never invent selectors, helper functions, imports, APIs or fixture data.',
    '- Never use waitForTimeout, test.skip, CSS selectors or page.locator.',
    '- Do not invent shopping-cart, checkout, login or registration functionality.',
    '- Keep tests deterministic and user-observable.',
    '- Output ONLY TypeScript source code without Markdown fences.'
  ];

  const sections = [
    rules.join('\n'),
    `SCENARIO TO IMPLEMENT:\n${JSON.stringify(scenario, null, 2)}`,
    `UI CONTRACT AND ALLOWED TEST IDS:\n${contract}`
  ];

  if (isEmailScenario) {
  const isSearchScenario =
    /search/i.test(`${scenario.id} ${scenario.title}`);
    sections.push(
      [
        'EMAIL TEST INSTRUCTIONS:',
        '- This scenario involves product enquiries and email delivery.',
        '- Reuse the existing helpers from "../../support/mailpit.js".',
	'- Fill ALL four enquiry fields: enquiry-name, enquiry-email, enquiry-phone and enquiry-message.',
        '- Use a valid phone value such as "+1 555 0100".',
        '- Do not omit the phone field, even if it appears optional.',
        '- The email delivery test must verify the message reaches sales@example.test.',
        '- Verify the email body contains the submitted customer email and enquiry message.',
        '- Available helpers: clearInbox, getMessageText, matchingSalesMessages, waitForMessage.',
        '- Import MailpitSummary as a type if you need the recipient type.',
        '- Do not invent or redefine helper functions.',
        '- Use test.beforeEach(async () => { await clearInbox(); }) before email delivery tests.',
        '- Use waitForMessage(productTitle) to wait for the email.',
        '- Use matchingSalesMessages(productTitle, salesInbox) to verify the recipient.',
        '- Use getMessageText(message.ID) to inspect the email body.',
        '- salesInbox must be sales@example.test.',
        '- For recipient callbacks, use the type MailpitSummary["To"][number].',
        '- Verify the enquiry-thank-you element after successful submission.',
        '- Do not use arbitrary sleeps or waitForTimeout.',
        '',
        'IMPORTANT:',
'- The hand-written example contains an additional negative validation test.',
'- Do NOT copy that negative test into this scenario.',
'- Generate exactly two tests corresponding to the two THEN clauses.',
'- Both tests may share the same successful enquiry workflow.',
'- Do not create an invalid-email test.',
        'HAND-WRITTEN EMAIL TEST EXAMPLE:',
        example
      ].join('\n')
    );
  }

  if (isSearchScenario) {
    sections.push(
      [
        'SEARCH TEST INSTRUCTIONS:',
        '- Use the exact documented fixture search term "Orbit".',
        '- Navigate to the home page before searching.',
        '- Fill search-input with "Orbit" and click search-button.',
        '- Assert that search results contain at least one product.',
        '- Do not rely only on a loop over results; an empty result list must fail the test.',
        '- Read each title using getByTestId("product-card-title") inside its product-tile; do not use product-title for search results.',
        '- Verify every returned product title contains "Orbit" using a case-insensitive comparison.',
        '- Use only the documented search route and test IDs.',
        '- Do not use "Headphones" or any other search term.'
      ].join('\n')
    );
  }

  return sections.join('\n\n');
}

export async function generateScenarioSpec(
  scenario: Scenario,
  context: GenerateContext,
  chat: ChatFunction,
  correction?: string
): Promise<string> {
  const prompt = await buildScenarioPrompt(scenario, context);

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are an expert QA automation engineer. ' +
        'Generate valid, deterministic Playwright TypeScript tests. ' +
        'Follow every instruction and do not invent application functionality.'
    },
    {
      role: 'user' as const,
      content: correction
        ? `${prompt}\n\nPREVIOUS VALIDATION ERRORS:\n${correction}\n\nCorrect every error. Follow the original scenario and contract exactly.`
        : prompt
    }
  ];

  return chat(messages);
}

export type ValidationAttempt<T> = {
  value: T;
  errors: string[];
};

export type RetryResult<T> =
  | { ok: true; value: T; attempts: number; errors: [] }
  | { ok: false; attempts: number; errors: string[] };

/** Retry only validation failures, feeding the last error list into the next generation prompt. */
export async function generateWithValidationRetries<T>(
  maxRetries: number,
  attempt: (feedback?: string) => Promise<ValidationAttempt<T>>
): Promise<RetryResult<T>> {
  let feedback: string | undefined;
  let lastErrors: string[] = [];

  for (let index = 1; index <= maxRetries; index += 1) {
    const result = await attempt(feedback);

    if (result.errors.length === 0) {
      return {
        ok: true,
        value: result.value,
        attempts: index,
        errors: []
      };
    }

    lastErrors = result.errors;
    feedback = lastErrors.join('\n');
  }

  return {
    ok: false,
    attempts: maxRetries,
    errors: lastErrors
  };
}
