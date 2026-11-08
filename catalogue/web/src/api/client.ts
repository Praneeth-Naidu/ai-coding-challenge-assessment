import type { Category, CategoryResponse, EnquiryBody, Product } from './types.js';

type ErrorPayload = { error?: { code?: string; message?: string } };

export class ApiError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    response = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'The catalogue service could not be reached. Please try again.', 0);
  }

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload as ErrorPayload;
    throw new ApiError(
      error.error?.code ?? 'REQUEST_FAILED',
      error.error?.message ?? 'The request could not be completed.',
      response.status
    );
  }
  return payload as T;
}

export async function getFeatured(): Promise<Product[]> {
  return (await request<{ products: Product[] }>('/products/featured')).products;
}

export async function getCategories(): Promise<Category[]> {
  return (await request<{ categories: Category[] }>('/categories')).categories;
}

export function getCategory(slug: string): Promise<CategoryResponse> {
  return request<CategoryResponse>(`/categories/${encodeURIComponent(slug)}`);
}

export async function searchProducts(term: string): Promise<Product[]> {
  return (await request<{ products: Product[] }>(`/products?search=${encodeURIComponent(term)}`)).products;
}

export async function getProduct(id: number): Promise<Product> {
  return (await request<{ product: Product }>(`/products/${id}`)).product;
}

export function submitEnquiry(body: EnquiryBody): Promise<{ ok: true }> {
  return request<{ ok: true }>('/enquiries', { method: 'POST', body: JSON.stringify(body) });
}
