import { expect, test } from '@playwright/test';
import { clearInbox, getMessageText, matchingSalesMessages, waitForMessage } from '../../support/mailpit.js';

const salesInbox = 'sales@example.test';

test.beforeEach(async () => {
  await clearInbox();
});

test('a product enquiry reaches the sales inbox and is acknowledged', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('featured-products').getByTestId('product-tile')).toHaveCount(5);
  await page.getByTestId('product-tile').first().click();
  const productTitle = (await page.getByTestId('product-title').textContent()) ?? '';
  await page.getByTestId('enquire-button').click();
  await page.getByTestId('enquiry-name').fill('Taylor Example');
  await page.getByTestId('enquiry-email').fill('taylor@example.test');
  await page.getByTestId('enquiry-phone').fill('+1 555 0100');
  await page.getByTestId('enquiry-message').fill('Please share more details about this product.');
  await page.getByTestId('enquiry-submit').click();
  await expect(page.getByTestId('enquiry-thank-you')).toBeVisible();

  const message = await waitForMessage(productTitle);
  const matching = await matchingSalesMessages(productTitle, salesInbox);
  expect(matching).toHaveLength(1);
  expect(message.To.some((recipient) => recipient.Address?.toLowerCase() === salesInbox)).toBeTruthy();
  expect(await getMessageText(message.ID)).toContain('taylor@example.test');
});

test('invalid email is rejected in the browser and sends no email', async ({ page }) => {
  await page.goto('/product/1');
  await page.getByTestId('enquire-button').click();
  await page.getByTestId('enquiry-name').fill('Taylor Example');
  await page.getByTestId('enquiry-email').fill('not-an-email');
  await page.getByTestId('enquiry-message').fill('Please contact me.');
  await page.getByTestId('enquiry-submit').click();
  await expect(page.getByTestId('enquiry-email-error')).toBeVisible();
  expect(await matchingSalesMessages('', salesInbox)).toHaveLength(0);
});
