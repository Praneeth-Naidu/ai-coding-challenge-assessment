# UI contract for Playwright and the test generator

The generator may use **only** the test IDs listed below. Product facts come from the explicitly labelled demo fixture at `backend/fixtures/products.json`; replace these facts after refreshing the fixture from the live Fake Store API.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home page with exactly five curated featured products |
| `/category/:slug` | Top three and remaining products for one category |
| `/search?q=term` | Search results; a blank query does not call the API |
| `/product/:id` | Product details and enquiry form |

## Test IDs

| Test ID | Where |
|---|---|
| `featured-products` | Container of home featured grid |
| `product-tile` | Every product tile (also the navigation link) |
| `product-card-title` | Product title inside each product tile |
| `category-link` | Each category navigation link |
| `category-top-rated` | Container of category's top-rated grid |
| `category-more` | Container of remaining products in category |
| `search-input` | Search input |
| `search-button` | Search submit button |
| `no-results` | Empty search state or blank-query message |
| `retry-button` | Retry action in a page error state |
| `search-results` | Search results grid |
| `product-title` | Product detail title |
| `product-price` | Product detail price |
| `product-description` | Product detail description |
| `enquire-button` | Product detail enquiry toggle |
| `enquiry-name` | Enquiry name field |
| `enquiry-email` | Enquiry email field |
| `enquiry-email-error` | Invalid email validation text |
| `enquiry-phone` | Optional phone field |
| `enquiry-message` | Enquiry message field |
| `enquiry-submit` | Enquiry submit button |
| `enquiry-thank-you` | Successful email handoff state |
| `enquiry-error` | Retryable backend/email error state |

## Demo fixture facts (synthetic; not Fake Store facts)

## Category fixture expectations

Products are ordered by rating descending, then rating count descending.

### Electronics

- Top-rated: ID 1 (Orbit Wireless Headphones), ID 4 (Precision Wireless Mouse), ID 6 (Compact Bluetooth Speaker).
- Remaining: ID 9 (Studio USB-C Hub).
- Expected top-rated count: 3.
- Expected remaining count: 1.

### Men's clothing

- Top-rated: ID 2 (Everyday Canvas Backpack), ID 5 (Cotton Everyday Shirt), ID 8 (Classic Leather Wallet).
- Expected top-rated count: 3.
- Expected remaining count: 0.

### Home & living

- Top-rated: ID 3 (Minimal Ceramic Desk Lamp), ID 7 (Linen Cushion Cover).
- Expected top-rated count: 2.
- Expected remaining count: 0.

The fixture is designed for deterministic offline development. `scripts/refresh-fixture.sh` replaces it with a schema-checked live Fake Store snapshot; regenerate this section's fixture facts and the curated IDs after doing so.
