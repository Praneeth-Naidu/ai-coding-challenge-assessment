import { Router } from 'express';
import type { CatalogueService } from '../services/catalogueService.js';
import type { EnquiryService } from '../services/enquiryService.js';
import { categorySlugParamSchema, enquiryBodySchema, productIdParamSchema, searchQuerySchema } from './schemas.js';

type RouteDependencies = { catalogue: CatalogueService; enquiries: EnquiryService };
type AsyncRoute = (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>;
const asyncRoute = (handler: AsyncRoute) => (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): void => {
  void handler(req, res, next).catch(next);
};

export function createRouter({ catalogue, enquiries }: RouteDependencies): Router {
  const router = Router();

  router.get('/health', (_req, res) => res.status(200).json({ ok: true }));
  router.get('/products/featured', asyncRoute(async (_req, res) => {
    res.json({ products: await catalogue.featured() });
  }));
  router.get('/categories', asyncRoute(async (_req, res) => {
    res.json({ categories: await catalogue.categories() });
  }));
  router.get('/categories/:slug', asyncRoute(async (req, res) => {
    const { slug } = categorySlugParamSchema.parse(req.params);
    res.json(await catalogue.category(slug));
  }));
  router.get('/products', asyncRoute(async (req, res) => {
    const { search } = searchQuerySchema.parse(req.query);
    res.json({ products: await catalogue.search(search) });
  }));
  router.get('/products/:id', asyncRoute(async (req, res) => {
    const { id } = productIdParamSchema.parse(req.params);
    res.json({ product: await catalogue.product(id) });
  }));
  router.post('/enquiries', asyncRoute(async (req, res) => {
    const input = enquiryBodySchema.parse(req.body);
    if (input.website && input.website.trim().length > 0) {
      res.status(201).json({ ok: true });
      return;
    }
    await enquiries.submit({
      productId: input.productId,
      name: input.name,
      email: input.email,
      ...(input.phone === undefined ? {} : { phone: input.phone }),
      message: input.message
    });
    res.status(201).json({ ok: true });
  }));

  return router;
}

