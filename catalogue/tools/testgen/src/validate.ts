import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type ValidationResult = { ok: boolean; errors: string[] };

export function extractContractIds(contract: string): Set<string> {
  return new Set(
    [...contract.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(
      (match) => match[1] ?? ''
    )
  );
}

export function validateStaticSpec(
  source: string,
  contract: string,
  expectedTestCount?: number,
  scenarioId?: string
): ValidationResult {
  const errors: string[] = [];
  const ids = extractContractIds(contract);

  const expectCount = [...source.matchAll(/\bexpect\s*\(/g)].length;
  const testCount = [...source.matchAll(/\btest\s*\(/g)].length;

  if (expectCount === 0) {
    errors.push('Spec must contain at least one expect() assertion.');
  }

  if (expectCount < testCount) {
    errors.push(
      `Each test() must have at least one expect(); found ${expectCount} expect() calls for ${testCount} tests.`
    );
  }

  if (testCount === 0) {
    errors.push('Spec must contain at least one test() case.');
  }

  if (
    expectedTestCount !== undefined &&
    testCount !== expectedTestCount
  ) {
    errors.push(
      `Expected ${expectedTestCount} test() cases (one per THEN clause), found ${testCount}.`
    );
  }

  if (/waitForTimeout\s*\(/.test(source)) {
    errors.push(
      'waitForTimeout is prohibited; use Playwright auto-waiting or expect.poll.'
    );
  }

  if (/test\.skip\s*\(/.test(source)) {
    errors.push('test.skip is prohibited in generated specs.');
  }

  if (
    /\.(?:locator|getByRole|getByText|getByLabel|getByPlaceholder|getByAltText)\s*\(/.test(
      source
    )
  ) {
    errors.push('Only getByTestId selectors are allowed.');
  }

  const selectorCalls = [
    ...source.matchAll(/getByTestId\s*\(\s*(['"])(.*?)\1\s*\)/g)
  ];

  if (selectorCalls.length === 0) {
    errors.push(
      'Spec must use at least one getByTestId selector from the UI contract.'
    );
  }

  for (const match of selectorCalls) {
    const id = match[2] ?? '';

    if (!ids.has(id)) {
      errors.push(`Unknown test ID: ${id}`);
    }
  }

  if (/getByTestId\s*\(\s*[^'"]/.test(source)) {
    errors.push(
      'getByTestId arguments must be literal strings from the UI contract.'
    );
  }

  // Scenario-specific semantic checks.
  // These checks complement TypeScript compilation and selector validation.

  if (/search/i.test(scenarioId ?? '')) {
    if (!/getByTestId\s*\(\s*['"]search-input['"]\s*\)/.test(source)) {
      errors.push('Search scenario must interact with search-input.');
    }

    if (!/getByTestId\s*\(\s*['"]search-button['"]\s*\)/.test(source)) {
      errors.push('Search scenario must interact with search-button.');
    }

    if (!/\bOrbit\b/i.test(source)) {
      errors.push(
        'Search scenario must use the documented Orbit fixture search term.'
      );
    }

    const assertsNonEmpty =
      /\.not\.toHaveCount\s*\(\s*0\s*\)/.test(source) ||
      /\.toHaveCount\s*\(\s*[1-9]\d*\s*\)/.test(source) ||
      /\.toBeGreaterThan\s*\(\s*0\s*\)/.test(source) ||
      /\.toBeGreaterThanOrEqual\s*\(\s*1\s*\)/.test(source);

    if (!assertsNonEmpty) {
      errors.push(
        'Search scenario must assert that at least one matching result exists.'
      );
    }

    if (!/getByTestId\s*\(\s*['"]product-card-title['"]\s*\)/.test(source)) {
      errors.push('Search scenario must read titles using product-card-title.');
    }

    if (/getByTestId\s*\(\s*['"]product-title['"]\s*\)/.test(source)) {
      errors.push('Search scenario must not use product-title, which is reserved for product details.');
    }

    if (!/toContain(?:Text)?\s*\(/.test(source)) {
      errors.push(
        'Search scenario must verify that returned product text matches the search term.'
      );
    }
  }

  if (/category/i.test(scenarioId ?? '')) {
    if (!/getByTestId\s*\(\s*['"]category-top-rated['"]\s*\)/.test(source)) {
      errors.push(
        'Category scenario must inspect the category-top-rated section.'
      );
    }

    if (!/getByTestId\s*\(\s*['"]category-more['"]\s*\)/.test(source)) {
      errors.push(
        'Category scenario must inspect the category-more section.'
      );
    }

    if (!/toHaveCount\s*\(/.test(source)) {
      errors.push(
        'Category scenario must assert the expected product count.'
      );
    }
  }

  if (/home-page|home-page-featured|top-rated-products-on-home/i.test(scenarioId ?? '')) {
    if (!/getByTestId\s*\(\s*['"]featured-products['"]\s*\)/.test(source)) {
      errors.push(
        'Home page scenario must inspect the featured-products section.'
      );
    }

    if (!/toHaveCount\s*\(\s*5\s*\)/.test(source)) {
      errors.push(
        'Home page scenario must assert exactly five featured products.'
      );
    }
  }

    if (/product-details/i.test(scenarioId ?? '')) {
    for (const id of [
      'product-title',
      'product-price',
      'product-description'
    ]) {
      const selectorPattern = new RegExp(
        String.raw`getByTestId\s*\(\s*['"]${id}['"]\s*\)`
      );

      if (!selectorPattern.test(source)) {
        errors.push(
          `Product details scenario must verify the ${id} element.`
        );
      }
    }
  }

  if (/enquir|email/i.test(scenarioId ?? '')) {
    const requiredPatterns: Array<[string, RegExp]> = [
      [
        'enquiry-phone',
        /getByTestId\s*\(\s*['"]enquiry-phone['"]\s*\)/
      ],
      [
        'enquiry-thank-you',
        /getByTestId\s*\(\s*['"]enquiry-thank-you['"]\s*\)/
      ],
      ['clearInbox helper', /\bclearInbox\s*\(/],
      ['waitForMessage helper', /\bwaitForMessage\s*\(/],
      ['matchingSalesMessages helper', /\bmatchingSalesMessages\s*\(/],
      ['getMessageText helper', /\bgetMessageText\s*\(/],
      ['sales inbox address', /sales@example\.test/i]
    ];

    for (const [description, pattern] of requiredPatterns) {
      if (!pattern.test(source)) {
        errors.push(
          `Enquiry scenario must include ${description}.`
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export async function validateFile(
  filePath: string,
  contractPath: string,
  projectRoot: string,
  expectedTestCount?: number,
  scenarioId?: string
): Promise<ValidationResult> {
  const [source, contract] = await Promise.all([
    readFile(filePath, 'utf8'),
    readFile(contractPath, 'utf8')
  ]);

  const staticResult = validateStaticSpec(
    source,
    contract,
    expectedTestCount,
    scenarioId
  );

  if (!staticResult.ok) {
    return staticResult;
  }

  const relativeFile = (
    filePath.startsWith(projectRoot)
      ? filePath.slice(projectRoot.length + 1)
      : filePath
  ).replaceAll('\\', '/');

  const typescriptCli = resolve(
    projectRoot,
    'e2e/node_modules/typescript/bin/tsc'
  );

  const playwrightCli = resolve(
    projectRoot,
    'e2e/node_modules/@playwright/test/cli.js'
  );

  const commands: Array<{ label: string; args: string[] }> = [
    {
      label: 'TypeScript compile',
      args: [typescriptCli, '--noEmit', '-p', 'e2e']
    },
    {
      label: 'Playwright test discovery',
      args: [
        playwrightCli,
        'test',
        '--config',
        'e2e/playwright.config.ts',
        '--list',
        relativeFile
      ]
    }
  ];

  for (const command of commands) {
    try {
      execFileSync(process.execPath, command.args, {
        cwd: projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (error) {
      const output =
        error && typeof error === 'object' && 'stdout' in error
          ? String(error.stdout ?? '')
          : '';

      const stderr =
        error && typeof error === 'object' && 'stderr' in error
          ? String(error.stderr ?? '')
          : '';

      return {
        ok: false,
        errors: [
          `${command.label} failed:\n${output}\n${stderr}`.trim()
        ]
      };
    }
  }

  return { ok: true, errors: [] };
}

export function tempSpecPath(
  outDir: string,
  scenarioId: string
): string {
  return resolve(outDir, `candidate-${scenarioId}.spec.ts`);
}
