# Agent Instructions

These instructions apply to AI coding agents and contributors working in
this repository.

## Project intent

Maintain a small, extensible product-catalogue proof of concept.
Prioritise the supplied acceptance criteria, clear boundaries,
reproducible local setup, and tests over speculative features.

## Architecture boundaries

-   The client is React + TypeScript.
-   The backend is Node.js + TypeScript.
-   The browser must obtain product data through the backend. Do not add
    direct browser-to-Fake-Store-API calls.
-   Keep product-source and email-provider concerns behind the backend
    boundary.
-   The current local implementation uses fixture-backed product data
    and Mailpit for email capture. Do not describe either as a
    production integration.
-   Preserve the Docker Compose local workflow and AWS-compatible
    infrastructure constraint if infrastructure changes are introduced.

## Acceptance criteria and contracts

Before changing user-visible behaviour, read:

-   `requirements/acceptance-criteria.md`
-   `e2e/contract/ui-contract.md`
-   Relevant frontend/backend implementation and existing tests.

Treat the UI contract as the source of truth for routes and test IDs. If
a selector changes, update the component, UI contract, generator
prompt/validation as appropriate, and tests together.

Important selector distinction:

-   `product-card-title`: title inside a product tile/search result.
-   `product-title`: title on the product details page.
-   `product-tile`: product tile.
-   `search-input` and `search-button`: search controls.

The `Orbit` product fixture is the documented deterministic search
fixture. Search tests should assert that at least one result exists and
verify every returned card title matches `Orbit` case-insensitively.

## AI-generated test policy

-   Do not hand-edit files in `e2e/tests/generated/` as the permanent
    fix. Correct the acceptance criteria, UI contract, prompt,
    generator, or validator, then regenerate.
-   Review every generated spec. LLM output can contain incorrect
    selectors, routes, fixture terms, or incomplete assertions.
-   Keep static semantic validation strict enough to reject known
    failure patterns.
-   Maintain positive and negative validator unit tests for important
    semantic rules.
-   The generator owns `*.spec.ts` files in `e2e/tests/generated/`. Do
    not put hand-written specs in that directory: automatic stale-file
    cleanup removes specs whose filenames do not match the current
    scenario IDs.
-   Keep hand-written examples under `e2e/tests/hand-written/`.
-   Do not weaken validation just to make a generated test pass. Fix the
    generated test or its source contract.

## Required verification

For changes to the generator:

``` bash
cd tools/testgen
npm run typecheck
npm test
```

For a full generation and E2E run, start the application first,
configure the local `.env.gemini` file without committing its key, and
run:

``` bash
cd tools/testgen
npm run testgen:e2e
```

For application-only E2E verification using already-generated specs:

``` bash
cd e2e
npx playwright test tests/generated --config playwright.config.ts
```

Do not claim tests passed unless they were run and the output confirms
the result.

## Safety and repository hygiene

-   Never commit API keys, passwords, access tokens, personal data, or
    populated local environment files.
-   Do not paste secrets into chat, logs, test fixtures, documentation,
    or pull requests.
-   Keep documentation aligned with the actual scripts and ports. If a
    command or endpoint changes, update the README.
-   Prefer small, focused changes and explain any assumption that is not
    explicit in the acceptance criteria.
-   Avoid adding dependencies unless they materially improve the
    solution.
-   Do not claim production readiness for this proof of concept.
