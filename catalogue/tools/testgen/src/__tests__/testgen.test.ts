import { describe, expect, it, vi } from 'vitest';
import { stripModelFormatting, type ChatFunction } from '../llm.js';
import { generateWithValidationRetries } from '../generate.js';
import { parseCriteria } from '../parse.js';
import { validateStaticSpec } from '../validate.js';

//const contract = '| Test ID | Where |\n|---|---|\n| `product-title` | title |\n| `search-input` | input |';
const contract = [
  '| Test ID | Where |',
  '|---|---|',
  '| `product-title` | title |',
  '| `product-tile` | product tile |',
  '| `product-card-title` | product title inside card |',
  '| `search-input` | input |',
  '| `search-button` | button |'
].join('\n');
describe('local LLM test generator helpers', () => {
  it('strips think tags and markdown fences', () => {
    expect(stripModelFormatting('<think>reasoning</think>\n```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('retries parsing when the model first returns invalid JSON', async () => {
    const chat = vi.fn<ChatFunction>()
      .mockResolvedValueOnce('not json')
      .mockResolvedValueOnce(JSON.stringify({ scenarios: [{ id: 'product-title-visible', title: 'Title is visible', given: ['a product exists'], when: ['the detail page opens'], then: ['the title is visible'] }] }));
    const scenarios = await parseCriteria('The product title is displayed.', chat, 3);
    expect(scenarios).toHaveLength(1);
    expect(chat).toHaveBeenCalledTimes(2);
    expect(chat.mock.calls[1]?.[0][1]?.content).toContain('failed validation');
  });

  it('rejects a generated spec that uses a test ID absent from the contract', () => {
    const result = validateStaticSpec('test("x", async ({ page }) => { await expect(page.getByTestId("unknown-id")).toBeVisible(); });', contract);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('Unknown test ID: unknown-id');
  });

  it('rejects a generated spec without an assertion', () => {
    const result = validateStaticSpec('test("x", async ({ page }) => { await page.getByTestId("product-title").click(); });', contract);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('expect()');
  });

  it('rejects prohibited waits and CSS locator APIs', () => {
    const result = validateStaticSpec('test("x", async ({ page }) => { await page.waitForTimeout(100); await page.locator("h1"); await page.getByTestId("product-title").click(); expect(true).toBeTruthy(); });', contract);
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('fails after the configured parse retry count', async () => {
    const chat = vi.fn<ChatFunction>().mockResolvedValue('no json');
    await expect(parseCriteria('A criterion.', chat, 2)).rejects.toThrow('after 2 attempts');
    expect(chat).toHaveBeenCalledTimes(2);
  });
  it('stops after MAX_RETRIES when generated specs keep failing validation', async () => {
    const attempt = vi.fn(async () => ({ value: 'draft', errors: ['missing expect()'] }));
    const result = await generateWithValidationRetries(3, attempt);
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(3);
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('rejects search tests that do not use the documented fixture term', () => {
    const source = `
      test("Search for products", async ({ page }) => {
        await page.goto("/");
        await page.getByTestId("search-input").fill("Headphones");
        await page.getByTestId("search-button").click();
        const results = page.getByTestId("product-tile");
        await expect(results).toHaveCount(1);
        await expect(results.first()).toContainText("Headphones");
      });
    `;

    const result = validateStaticSpec(source, contract, 1, 'search-for-products');

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('Orbit');
  });

  it('rejects search tests that do not assert non-empty results', () => {
    const source = `
      test("Search for products", async ({ page }) => {
        await page.goto("/");
        await page.getByTestId("search-input").fill("Orbit");
        await page.getByTestId("search-button").click();
        const results = page.getByTestId("product-tile");
        for (let i = 0; i < await results.count(); i++) {
          await expect(results.nth(i)).toContainText("Orbit");
        }
      });
    `;

    const result = validateStaticSpec(source, contract, 1, 'search-for-products');

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('at least one matching result');
  });

  it('rejects category tests that do not inspect both product sections', () => {
    const source = `
      test("View products by category", async ({ page }) => {
        await page.goto("/category/electronics");
        await expect(page.getByTestId("category-top-rated").getByTestId("product-tile")).toHaveCount(3);
      });
    `;

    const result = validateStaticSpec(source, contract, 1, 'view-products-by-category');

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('category-more');
  });

  it('rejects enquiry tests missing Mailpit verification', () => {
    const source = `
      import { test, expect } from "@playwright/test";
      test("Submit enquiry", async ({ page }) => {
        await page.goto("/product/1");
        await page.getByTestId("enquire-button").click();
        await page.getByTestId("enquiry-name").fill("John Doe");
        await page.getByTestId("enquiry-email").fill("john@example.test");
        await page.getByTestId("enquiry-phone").fill("+1 555 0100");
        await page.getByTestId("enquiry-message").fill("Interested");
        await page.getByTestId("enquiry-submit").click();
        await expect(page.getByTestId("enquiry-thank-you")).toBeVisible();
      });
    `;

    const result = validateStaticSpec(source, contract, 1, 'submit-product-enquiry');

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('waitForMessage');
  });
  it('rejects search tests that use the product detail title selector', () => {
    const source = `
      test("Search for products", async ({ page }) => {
        await page.goto("/");
        await page.getByTestId("search-input").fill("Orbit");
        await page.getByTestId("search-button").click();
        const results = page.getByTestId("product-tile");
        await expect(results).not.toHaveCount(0);
        await expect(results.first().getByTestId("product-title")).toContainText("Orbit");
      });
    `;

    const result = validateStaticSpec(source, contract, 1, 'search-for-products');

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('must not use product-title');
  });


  it('accepts a search test with the documented fixture and positive assertions', () => {
    const source = `
      test("Search for products", async ({ page }) => {
        await page.goto("/");
        await page.getByTestId("search-input").fill("Orbit");
        await page.getByTestId("search-button").click();
        const results = page.getByTestId("product-tile");
        await expect(results).not.toHaveCount(0);
        await expect(results.first().getByTestId("product-card-title")).toContainText("Orbit");
      });
    `;

    const result = validateStaticSpec(source, contract, 1, 'search-for-products');

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });


});
