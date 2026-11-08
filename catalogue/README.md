# Product Catalogue

A small, extensible product-catalogue proof of concept built for the
**AI-Native Engineer** code challenge. Customers can browse featured
products, navigate categories, search, view product details, and submit
product enquiries.

## What is included

-   React + TypeScript web client.
-   Node.js + TypeScript backend.
-   Backend-owned product data access. The browser talks to the backend;
    it does not call the Fake Store API directly.
-   Fixture-backed product data for deterministic local development and
    tests.
-   Local email capture through Mailpit for enquiry-flow verification.
-   Playwright end-to-end tests.
-   A TypeScript test generator that turns acceptance criteria into
    Playwright specs and validates generated output before it is
    accepted.

## Architecture

``` text
Browser
  |
  v
React + TypeScript (http://localhost:8080)
  |
  | HTTP requests
  v
Node.js + TypeScript API (http://localhost:4000)
  |                         |
  | product data            | enquiry email
  v                         v
Fixture-backed source     Mailpit (http://localhost:8025)
```

The backend is the boundary for product-data access and enquiry
delivery. This keeps the client independent of the underlying data and
email providers. The current proof of concept uses fixtures and a local
email-capture service; those can be replaced behind the backend boundary
as the product evolves.

## Run locally

### Prerequisites

-   Docker Desktop with the Docker Engine running.
-   Docker Compose v2.
-   Node.js and npm for running the test generator and Playwright tests.

### Start the application

From the repository root (CATALOUGE):

``` bash
docker compose up --build
```

The first build may take longer than subsequent starts. Once the
services are healthy, open:

  Service           URL                            Purpose
  ----------------- ------------------------------ ---------------------------------
  Web application   http://localhost:8080          Product catalogue
  Backend health    http://localhost:4000/health   Backend health check
  Mailpit           http://localhost:8025          Inspect captured enquiry emails

To run the containers in the background:

``` bash
docker compose up -d --build
```

To stop the stack:

``` bash
docker compose down
```

If Docker commands report that the engine is unavailable, start Docker
Desktop and wait for **Engine running**. On Windows, if Docker Desktop
is stuck starting, `wsl --shutdown` from an elevated PowerShell followed
by reopening Docker Desktop resolved the engine-startup issue during
development.

## Run the end-to-end tests

Install the E2E dependencies once:

``` bash
cd e2e
npm install
npx playwright install chromium
```


## AI test generation

The generator lives in `tools/testgen`. It reads:

-   `requirements/acceptance-criteria.md` --- scenarios derived from the
    challenge acceptance criteria.
-   `e2e/contract/ui-contract.md` --- documented routes and UI test IDs.
-   `e2e/tests/hand-written/enquiry.spec.ts` --- an example test used as
    generation context.

Install generator dependencies from root folder catalogue:

``` bash
cd tools/testgen
npm install
```

The end-to-end generation command uses Gemini configuration from
`tools/testgen/.env.gemini`. Create API key from google AI studio
Steps:-
Open Google AI Studio(https://aistudio.google.com/api-keys) .
Sign in with your Google account.
Create an API key.
Copy the key.
Insert it in LLM_API_KEY in .env.gemini



``` dotenv
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.1-flash-lite
LLM_API_KEY=YOUR_API_KEY
LLM_TEMPERATURE=0.1
MAX_RETRIES=2
CRITERIA_PATH=requirements/acceptance-criteria.md
CONTRACT_PATH=e2e/contract/ui-contract.md
OUT_DIR=e2e/tests/generated
```

Run the complete workflow from `tools/testgen`:

``` bash
npm run testgen:e2e
```

This command runs, in order:

1.  LLM scenario parsing and Playwright spec generation.
2.  Automatic removal of obsolete `*.spec.ts` files in the
    generated-spec directory.
3.  Static validation of all generated specs.
4.  Playwright execution of `tests/generated`.

The command stops on the first failed stage and returns a non-zero exit
code. The generator writes a `REPORT.md` alongside the generated specs.

Other useful generator commands, from `tools/testgen`:

``` bash
# Generate specs only (uses the process environment)
npm run testgen

# Validate the current generated specs without calling the LLM
npm run testgen:check

# TypeScript check and generator unit tests
npm run typecheck
npm test

# Print prompts without calling the LLM
node --env-file=.env.gemini --import tsx src/run.ts --dry-run
```

`testgen:e2e` is configured to load `.env.gemini`. The application does not require a Gemini API key; the
key is needed only when regenerating the tests with this command.

A local Ollama configuration is also present in the development setup
(`.env`, using `qwen2.5-coder:7b`). The checked-in command above is
intentionally wired to the Gemini configuration used for the verified
regeneration run. Do not commit real API keys in either environment
file.

## Test coverage

The acceptance-criteria suite covers:

  ---------------------------------------------------------------------
  Capability           Expected behaviour          Generated test cases
  -------------------- -------------------- ---------------------------
  Home page            Displays the five                              1
                       featured/top-rated   
                       products             

  Category page        Displays top-rated                             2
                       and additional       
                       products for a       
                       category             

  Search               Displays products                              1
                       matching the entered 
                       search term          

  Product details      Opens the selected                             1
                       product's details    
                       page                 

  Enquiry              Sends an email to                              2
                       the sales inbox and  
                       shows a thank-you    
                       message              

  **Total**            **Five scenarios**                         **7**
  ---------------------------------------------------------------------

The search scenario uses the deterministic `Orbit` fixture.
Search-result titles are identified by `product-card-title`;
`product-title` is reserved for the product details page.

## Configuration and secrets

-   Keep `.env`, `.env.gemini`, and any other environment files
    containing credentials out of version control.
-   Commit only safe example configuration files, never real keys or
    tokens.
-   No paid service is required to start and interact with the catalogue
    locally. Gemini is an optional development-time dependency for
    regenerating the AI-authored tests; existing generated tests can be
    executed without it.

## Known proof-of-concept boundaries

-   Product data is fixture-backed rather than connected to a production
    catalogue.
-   Mailpit captures email locally; it is not a production
    email-delivery provider.
-   Authentication, administration, payments, inventory management, and
    production deployment are outside the supplied acceptance criteria.
-   Generated tests are reviewed and validated, but LLM output should
    not be treated as authoritative without inspection.

## Verified development baseline

-   Test-generator unit tests: 13 passed.
-   Generated-spec static validation: five specs passed.
-   Generated Playwright suite: seven tests passed.

These results describe the development run at that point in time; rerun
the commands above against the submitted commit to verify the final
state.
