import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import type { Product } from '../domain/product.js';
import type { EmailMessage, EmailSender } from '../ports/emailSender.js';
import type { ProductSource } from '../ports/productSource.js';
import { CatalogueService } from '../services/catalogueService.js';
import { EnquiryService } from '../services/enquiryService.js';

const products: Product[] = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1, title: `Item ${index + 1}`, price: 10 + index, description: `Description ${index + 1}`,
  category: index < 4 ? 'electronics' : 'books', image: '', rating: { rate: 4.9 - index / 10, count: 20 - index }
}));
function makeApp(failEmail = false) {
  const source: ProductSource = {
    listProducts: async () => products,
    getProduct: async (id) => products.find((product) => product.id === id) ?? null,
    listCategories: async () => ['electronics', 'books']
  };
  const sent: EmailMessage[] = [];
  const emailSender: EmailSender = { send: async (message) => {
    if (failEmail) throw new Error('SMTP offline');
    sent.push(message);
  } };
  const catalogue = new CatalogueService(source, [1, 2, 3, 4, 5]);
  const enquiries = new EnquiryService(source, emailSender, 'sales@example.test', 'catalogue@example.test');
  return { app: createApp({ catalogue, enquiries }, { enquiryRateLimit: { windowMs: 60_000, max: 10 } }), sent };
}

const validEnquiry = { productId: 1, name: 'Ada Lovelace', email: 'ada@example.test', phone: '123', message: 'Please contact me.' };

describe('HTTP API', () => {
  it('reports the API health status', async () => {
    const { app } = makeApp();
    await request(app).get('/api/health').expect(200, { ok: true });
  });

  it('returns five featured products', async () => {
    const { app } = makeApp();
    const response = await request(app).get('/api/products/featured').expect(200);
    expect(response.body.products).toHaveLength(5);
  });

  it('returns the category top-rated split', async () => {
    const { app } = makeApp();
    const response = await request(app).get('/api/categories/electronics').expect(200);
    expect(response.body.category.name).toBe('electronics');
    expect(response.body.topRated).toHaveLength(3);
    expect(response.body.more).toHaveLength(1);
  });

  it('searches matches and rejects a blank term', async () => {
    const { app } = makeApp();
    const match = await request(app).get('/api/products?search=ITEM%201').expect(200);
    expect(match.body.products.map((product: Product) => product.id)).toEqual([1]);
    const blank = await request(app).get('/api/products?search=%20%20').expect(400);
    expect(blank.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns a 404 JSON error without a stack trace', async () => {
    const { app } = makeApp();
    const response = await request(app).get('/api/products/999').expect(404);
    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });

  it('accepts a valid enquiry and sends exactly one email', async () => {
    const { app, sent } = makeApp();
    await request(app).post('/api/enquiries').send(validEnquiry).expect(201, { ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe('sales@example.test');
  });

  it('rejects an invalid email', async () => {
    const { app } = makeApp();
    const response = await request(app).post('/api/enquiries').send({ ...validEnquiry, email: 'not-an-email' }).expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('honeypot returns success without sending email', async () => {
    const { app, sent } = makeApp();
    await request(app).post('/api/enquiries').send({ ...validEnquiry, website: 'spam' }).expect(201, { ok: true });
    expect(sent).toHaveLength(0);
  });

  it('returns 502 when email delivery fails', async () => {
    const { app } = makeApp(true);
    const response = await request(app).post('/api/enquiries').send(validEnquiry).expect(502);
    expect(response.body.error.code).toBe('EMAIL_FAILED');
  });

  it('limits enquiry submissions to ten requests per minute per client', async () => {
    const { app, sent } = makeApp();
    for (let index = 0; index < 10; index += 1) {
      await request(app).post('/api/enquiries').send({ ...validEnquiry, website: 'bot' }).expect(201);
    }
    const limited = await request(app).post('/api/enquiries').send({ ...validEnquiry, website: 'bot' }).expect(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
    expect(sent).toHaveLength(0);
  });

  it('rejects a request body larger than 10kb', async () => {
    const { app } = makeApp();
    const response = await request(app).post('/api/enquiries').send({ ...validEnquiry, message: 'x'.repeat(11_000) }).expect(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
