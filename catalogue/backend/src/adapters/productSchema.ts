import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  price: z.number().nonnegative(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({ rate: z.number().min(0).max(5), count: z.number().int().nonnegative() })
});

export const ProductsSchema = z.array(ProductSchema);
