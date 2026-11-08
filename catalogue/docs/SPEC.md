# Product Catalogue PoC — Specification

> **Source limitation:** The uploaded source is the implementation playbook, not the separate challenge brief referenced by it. This specification formalises the endpoints and behaviours explicitly described in the playbook. `requirements/acceptance-criteria.md` is a derived checklist, not a verbatim source brief.

## API contract

All responses are JSON. Errors use `{ "error": { "code": "...", "message": "..." } }`; validation errors may also include a `details` array.

| Method and path | Input | Success response | Important errors |
|---|---|---|---|
| `GET /api/health` | None | `200 { "ok": true }` | `500 INTERNAL_ERROR` |
| `GET /api/products/featured` | None | `200 { "products": Product[5] }`, in configured order | `500 FEATURED_MISCONFIGURED`, `502 UPSTREAM_UNAVAILABLE` |
| `GET /api/categories` | None | `200 { "categories": Category[] }` | `502 UPSTREAM_UNAVAILABLE` |
| `GET /api/categories/:slug` | Non-empty slug | `200 { "category": Category, "topRated": Product[0..3], "more": Product[] }` | `400 VALIDATION_ERROR`, `404 CATEGORY_NOT_FOUND` |
| `GET /api/products?search=term` | Required, trimmed non-empty `search` query | `200 { "products": Product[] }` | `400 VALIDATION_ERROR` or `SEARCH_TERM_REQUIRED` |
| `GET /api/products/:id` | Positive integer ID | `200 { "product": Product }` | `400 VALIDATION_ERROR`, `404 PRODUCT_NOT_FOUND` |
| `POST /api/enquiries` | `{ productId, name, email, phone?, message, website? }` | `201 { "ok": true }` after email handoff; honeypot returns same response without email | `400 VALIDATION_ERROR`, `404 PRODUCT_NOT_FOUND`, `413 PAYLOAD_TOO_LARGE`, `429 RATE_LIMITED`, `502 EMAIL_FAILED` |

### TypeScript domain types

```ts
export type Product = {
  id: number; title: string; price: number; description: string;
  category: string; image: string; rating: { rate: number; count: number };
};
export type Category = { slug: string; name: string };
export type Enquiry = { productId: number; name: string; email: string; phone?: string; message: string };
export type ProductListResponse = { products: Product[] };
export type CategoryListResponse = { categories: Category[] };
export type CategoryDetailResponse = { category: Category; topRated: Product[]; more: Product[] };
export type ProductDetailResponse = { product: Product };
export type EnquiryResponse = { ok: true };
export type ErrorResponse = { error: { code: string; message: string; details?: Array<{ path: string; message: string }> } };
```

### Validation and business rules

- Product IDs are positive integers; name is 1–100 characters; email must be valid; phone is optional and at most 30 characters; message is 1–1,000 characters.
- The hidden `website` honeypot, when non-empty, receives a success response without sending mail.
- Enquiries are limited to 10 requests per minute per IP by default; request bodies are capped at 10 KB.
- Search is a case-insensitive substring over title, description and category.
- Category ranking is rating descending, then rating count descending. The first three are the top-rated group; the remainder are disjoint.
- Email reply-to is the customer's email. CR/LF is stripped from values used in mail headers. No thank-you UI is shown until the send operation resolves.

## Acceptance-criteria mapping (derived from the playbook)

| Criterion | Endpoint(s) | UI route(s) | Test coverage |
|---|---|---|---|
| Five curated featured products | `GET /api/products/featured` | `/` | `backend/src/http/app.test.ts`; `e2e/tests/hand-written/enquiry.spec.ts` |
| Browse categories | `GET /api/categories` | Header navigation | `CatalogueService` tests; E2E navigation uses links |
| Top three and remaining category products | `GET /api/categories/:slug` | `/category/:slug` | `CatalogueService` tests; contract lists both grid IDs |
| Case-insensitive search; blank rejected | `GET /api/products?search=` | `/search?q=term` | service and API tests; contract search IDs |
| Product detail | `GET /api/products/:id` | `/product/:id` | API not-found test; E2E enters a detail page |
| Enquiry form validation | `POST /api/enquiries` | `/product/:id` | API validation test; E2E invalid-email test |
| Sales email and reply-to | `POST /api/enquiries` | `/product/:id` | enquiry service test; Playwright + Mailpit hand-written flow |
| Success only after email handoff | `POST /api/enquiries` | `/product/:id` | API email-failure test; frontend success/error states |
| Honeypot and rate limit | `POST /api/enquiries` | Hidden form field | API honeypot test; rate limit middleware in app |
| Backend-only product data access | All catalogue endpoints | All routes | `grep`/review; web API client only calls `/api/*` |
| Swappable product/email adapters | N/A | N/A | port-based service unit tests; adapters compile |
| Docker + local Mailpit | All | All | Docker Compose smoke path (requires Docker runtime) |
| AI-generated test drafts validated | N/A | Generated test suite | `tools/testgen` unit tests and `testgen:check` |

## Ambiguities and assumptions

The original challenge brief was not supplied. Therefore exact acceptance wording, original visual design, product selection policy, currency, and any additional user journeys remain unknown. The project applies the explicit assumptions in `DECISIONS.md`; the checked-in demo fixture is synthetic and is not presented as upstream Fake Store data.
