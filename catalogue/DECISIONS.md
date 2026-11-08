# Decisions and Assumptions

## 1. Scope

The implementation targets the five functional areas in the supplied
challenge brief: home-page featured products, category browsing, search,
product details, and product enquiry.

The objective is a working foundation that can evolve, not a production
commerce platform.

## 2. Technology choices

  -----------------------------------------------------------------------
  Layer                   Choice                  Rationale
  ----------------------- ----------------------- -----------------------
  Client                  React + TypeScript      Matches one of the
                                                  explicitly permitted
                                                  client options and
                                                  supports a typed
                                                  component-based web UI.

  Backend                 Node.js + TypeScript    Matches one of the
                                                  explicitly permitted
                                                  backend options and
                                                  keeps the API
                                                  implementation in the
                                                  same language ecosystem
                                                  as the client.

  Browser automation      Playwright              Exercises the customer
                                                  journeys through the
                                                  running application and
                                                  supports generated
                                                  TypeScript specs.

  Local runtime           Docker Compose          Provides a repeatable
                                                  local startup path for
                                                  the web app, backend,
                                                  and Mailpit.

  Local email capture     Mailpit                 Allows the enquiry
                                                  email path to be
                                                  verified without
                                                  depending on an
                                                  external paid email
                                                  provider.

  Product data            Backend-owned fixture   Provides deterministic
                          source                  data for the proof of
                                                  concept and avoids
                                                  making the browser
                                                  dependent on an
                                                  external product API.
  -----------------------------------------------------------------------

The challenge permits Fake Store API data but prohibits calling it
directly from the client. This implementation uses fixture-backed data
in the current local setup. Any future external product source should be
integrated behind the backend boundary.

## 3. Assumptions made where the criteria are underspecified

-   **Featured products:** the home page displays the five products
    designated as top-rated/featured in the supplied fixture or backend
    data.
-   **Category page:** selecting a category shows its top-rated products
    and additional products from that category. The challenge does not
    prescribe pagination or a specific visual ordering beyond those
    groups.
-   **Search matching:** search is treated as text matching against
    product information. The generated regression test uses the
    deterministic `Orbit` fixture and checks matching result titles
    case-insensitively.
-   **Product details:** selecting a product tile navigates to a
    product-specific details page.
-   **Enquiry:** a successful submission must produce an email visible
    in the local sales inbox and a customer-facing thank-you message.
-   **Local sales inbox:** Mailpit is used as the local inbox for
    development and automated verification; it is not intended to
    represent the production email provider.

If the implementation's precise search fields, category ordering, or
validation rules differ from these assumptions, update this document to
match the final code before submission.

## 4. Requirements simplified or not implemented

The supplied acceptance criteria do not require the following, so they
are outside this proof-of-concept scope:

-   User accounts, authentication, and authorization.
-   Product administration or catalogue-management workflows.
-   Checkout, payment processing, orders, or inventory management.
-   Production email delivery and deliverability monitoring.
-   Production catalogue persistence, merchandising tools, or analytics.
-   Production hosting and deployment configuration.

The product metadata is intentionally treated as sample data, consistent
with the brief. These omissions keep the implementation focused on the
critical customer journeys.

## 5. How the design can grow beyond the proof of concept

-   **Product source:** keep the browser dependent on the backend API.
    Replace the fixture-backed source with a Fake Store API or
    production catalogue integration inside the backend, without
    coupling the React client to that provider.
-   **Email provider:** keep enquiry submission in the backend. Replace
    local Mailpit delivery with a production email provider through
    backend configuration/integration.
-   **Client experience:** evolve the React components and styling
    independently of the backend data source.
-   **Contracts and tests:** maintain the UI contract and acceptance
    criteria as the source for generated regression tests. Add API-level
    contract tests and broader negative/error-path coverage as the API
    evolves.
-   **Delivery pipeline:** run type checks, unit tests, static
    generated-spec validation, and Playwright in CI. Keep credentials in
    CI secrets rather than repository files.

These are extension directions, not claims that production adapters,
persistence, or CI deployment are already implemented.

## 6. AI test-generation decisions

-   Acceptance criteria are parsed into scenario objects before
    individual specs are generated.
-   The UI contract constrains generated selectors and routes.
-   Generated specs are statically validated and retried when validation
    reports errors.
-   Search uses the deterministic `Orbit` fixture.
-   `product-card-title` identifies a title inside a product card;
    `product-title` identifies the product details-page title. Keeping
    these selectors distinct prevents the earlier generated locator
    timeout.
-   The generator removes stale `.spec.ts` files whose names no longer
    correspond to current scenario IDs. The generated directory is
    therefore reserved for generator-owned specs.
-   The `testgen:e2e` command combines generation, static validation,
    and browser execution so the whole path is repeatable.

## 7. What I would do with another day

1.  Review every backend and frontend error path and add API-level tests
    for invalid input, empty results, and provider failures.
2.  Add stronger schema validation for product and enquiry API payloads.
3.  Add accessibility checks and responsive-layout coverage for key
    customer journeys.
4.  Introduce a production-ready product-source adapter and
    email-provider adapter with configuration-driven selection.
5.  Add CI that runs type checks, unit tests, generator validation, and
    E2E tests; store any model credentials as CI secrets.
6.  Add test-generation evaluation cases for malformed output,
    hallucinated selectors, missing assertions, and scenarios with no
    matching fixture data.
7.  Add observability and operational safeguards before any production
    deployment.

