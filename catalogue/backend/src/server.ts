import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createApp } from './app.js';
import { CachedProductSource } from './adapters/cachedProductSource.js';
import { ConsoleEmailSender } from './adapters/consoleEmailSender.js';
import { FakeStoreProductSource } from './adapters/fakeStoreProductSource.js';
import { FixtureProductSource } from './adapters/fixtureProductSource.js';
import { SmtpEmailSender } from './adapters/smtpEmailSender.js';
import { loadConfig } from './config.js';
import { CatalogueService } from './services/catalogueService.js';
import { EnquiryService } from './services/enquiryService.js';

const FeaturedConfigSchema = z.object({ ids: z.array(z.number().int().positive()).length(5) });

async function start(): Promise<void> {
  const config = loadConfig();
  const productSource = config.PRODUCT_SOURCE === 'fixture'
    ? new FixtureProductSource()
    : new CachedProductSource(new FakeStoreProductSource(config.FAKESTORE_BASE_URL), config.CACHE_TTL_SECONDS);
  const featuredPath = fileURLToPath(new URL('../config/featured.json', import.meta.url));
  const featuredConfig = FeaturedConfigSchema.parse(JSON.parse(await readFile(featuredPath, 'utf8')) as unknown);
  const catalogue = new CatalogueService(productSource, featuredConfig.ids);
  const emailSender = config.SMTP_HOST === 'console' ? new ConsoleEmailSender() : new SmtpEmailSender(config.SMTP_HOST, config.SMTP_PORT);
  const enquiries = new EnquiryService(productSource, emailSender, config.SALES_INBOX_EMAIL, config.MAIL_FROM);

  // Validate the curated list against the selected source before accepting traffic.
  await catalogue.featured();
  const app = createApp({ catalogue, enquiries }, { corsOrigin: config.CORS_ORIGIN, trustProxyHops: config.TRUST_PROXY_HOPS });
  app.listen(config.PORT, () => {
    process.stdout.write(`Catalogue API listening on port ${config.PORT} (source: ${config.PRODUCT_SOURCE})\n`);
  });
}

start().catch((error: unknown) => {
  process.stderr.write(`Failed to start catalogue API: ${error instanceof Error ? error.message : 'unknown error'}\n`);
  process.exitCode = 1;
});
