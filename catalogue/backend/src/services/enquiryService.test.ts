import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../domain/product.js';
import type { EmailMessage, EmailSender } from '../ports/emailSender.js';
import type { ProductSource } from '../ports/productSource.js';
import { EnquiryService } from './enquiryService.js';

const product: Product = { id: 1, title: 'Sample product', price: 9, description: 'A sample', category: 'x', image: '', rating: { rate: 4, count: 1 } };
const input = { productId: 1, name: 'Ada', email: 'ada@example.test', phone: '123', message: 'Please contact me.' };
function source(getProduct: ProductSource['getProduct'] = async () => product): ProductSource {
  return { listProducts: async () => [product], getProduct, listCategories: async () => ['x'] };
}

describe('EnquiryService', () => {
  it('sends exactly one email with the sales inbox and customer reply-to', async () => {
    const send = vi.fn(async (_message: EmailMessage) => undefined);
    await new EnquiryService(source(), { send }, 'sales@example.test', 'catalogue@example.test').submit(input);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'sales@example.test', replyTo: input.email, subject: 'Enquiry: Sample product (#1)'
    }));
  });

  it('strips CR/LF from header values', async () => {
    let captured: EmailMessage | undefined;
    const sender: EmailSender = { send: async (message) => { captured = message; } };
    await new EnquiryService(source(), sender, 'sales@example.test', 'catalogue@example.test')
      .submit({ ...input, name: 'Ada\r\nBcc: evil@example.test', email: 'ada@example.test\r\nBcc:evil@example.test' });
    expect(captured?.replyTo).toBe('ada@example.testBcc:evil@example.test');
    expect(captured?.text).toContain('Name: AdaBcc: evil@example.test');
    expect(captured?.subject).not.toMatch(/[\r\n]/);
  });

  it('surfaces email failure as a 502 error', async () => {
    const sender: EmailSender = { send: async () => { throw new Error('smtp unavailable'); } };
    await expect(new EnquiryService(source(), sender, 'sales@example.test', 'catalogue@example.test').submit(input))
      .rejects.toMatchObject({ status: 502, code: 'EMAIL_FAILED' });
  });

  it('returns 404 and does not send when the product is unknown', async () => {
    const send = vi.fn(async (_message: EmailMessage) => undefined);
    const noProduct = source(async () => null);
    await expect(new EnquiryService(noProduct, { send }, 'sales@example.test', 'catalogue@example.test').submit(input))
      .rejects.toMatchObject({ status: 404, code: 'PRODUCT_NOT_FOUND' });
    expect(send).not.toHaveBeenCalled();
  });
});
