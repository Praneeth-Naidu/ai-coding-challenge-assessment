import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { CatalogueService } from './services/catalogueService.js';
import type { EnquiryService } from './services/enquiryService.js';
import { errorHandler } from './http/errorHandler.js';
import { createRouter } from './http/routes.js';

type AppDependencies = { catalogue: CatalogueService; enquiries: EnquiryService };
type AppOptions = { corsOrigin?: string; trustProxyHops?: number; enquiryRateLimit?: { windowMs: number; max: number } };

export function createApp(dependencies: AppDependencies, options: AppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  if ((options.trustProxyHops ?? 0) > 0) app.set('trust proxy', options.trustProxyHops);
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '10kb' }));

  app.post('/api/enquiries', rateLimit({
    windowMs: options.enquiryRateLimit?.windowMs ?? 60_000,
    limit: options.enquiryRateLimit?.max ?? 10,
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many enquiries. Please try again shortly.' } }
  }));
  app.use('/api', createRouter(dependencies));
  app.use(errorHandler);
  return app;
}
