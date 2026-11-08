import { z } from 'zod';

export const searchQuerySchema = z.object({ search: z.string().trim().min(1, 'Enter a search term.') });
export const productIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const categorySlugParamSchema = z.object({ slug: z.string().min(1) });
export const enquiryBodySchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(1).max(1_000),
  website: z.string().optional()
});
