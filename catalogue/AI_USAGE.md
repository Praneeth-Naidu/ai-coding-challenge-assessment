# AI Usage Notes

## Purpose

AI tools were used to accelerate planning, implementation, test
generation, debugging, and documentation for the AI-Native Engineer
product-catalogue challenge. AI output was treated as a draft: generated
code and tests were checked against the acceptance criteria, UI
contract, and executable test results.

## Tools and models

  -----------------------------------------------------------------------
  Tool                                Use
  ----------------------------------- -----------------------------------
  Claude Sonnet 5.5                   Planning and Architechture generation,
                                      Tool Selection                                 
  
  ChatGPT (GPT-6)                     Implementation guidance,
                                      debugging analysis, validator
                                      design, and documentation drafting.

  Gemini 3.1 Flash Lite               Parsing acceptance criteria and
                                      generating the final Playwright
                                      scenario specs. The successful
                                      generation report showed all five
                                      scenarios passing validation.

  Ollama with `qwen2.5-coder:7b`      Local-model configuration available
                                      in the development setup. The
                                      verified final regeneration run
                                      used Gemini 3.1 Flash Lite.

  Playwright                          Executed generated browser tests;
                                      used as the runtime feedback loop
                                      rather than trusting generated code
                                      by inspection alone.

  Docker Desktop / Docker Compose     Ran the local web, backend, and
                                      Mailpit services.
  -----------------------------------------------------------------------

## Plan and source material

The primary plan/specification was the supplied **Code Challenge:
AI-Native Engineer** brief. Its five functional areas were translated
into `requirements/acceptance-criteria.md`:

1.  Home page featured products.
2.  Category browsing.
3.  Search.
4.  Product details.
5.  Product enquiry.

The generator also uses `e2e/contract/ui-contract.md` to constrain
routes and test IDs, and a hand-written enquiry test as an example of
the expected Playwright style.

## Key prompts and AI-assisted decisions

1.  **Generate tests from acceptance criteria and a UI contract.** The
    generator was instructed to create Playwright tests from parsed
    scenarios, use only documented routes and selectors, and validate
    generated output before writing final specs.
2.  **Constrain search to a deterministic fixture.** The search scenario
    was explicitly directed to use `Orbit`, because the fixture data
    contains a known matching product. The generated test must prove
    that results exist and that every returned title contains the term,
    case-insensitively.
3.  **Correct the search-result title selector.** The model initially
    used `product-title` inside a product tile. Runtime evidence showed
    that this selector belonged to the product details page, not the
    card. The card received the distinct `product-card-title` test ID;
    the UI contract and prompt were updated accordingly.
4.  **Add semantic validation and regression tests.** Static validation
    was extended to require `product-card-title`, reject `product-title`
    in search scenarios, and require positive result and matching-text
    assertions. Unit tests cover both acceptance of the correct selector
    and rejection of the incorrect selector.
5.  **Make regeneration repeatable.** Scenario IDs changed between
    generation runs, leaving old generated specs behind. The generator
    was updated to remove obsolete generated `*.spec.ts` files based on
    the current scenario IDs, and `testgen:e2e` was added to run
    generation, static validation, and Playwright sequentially.

## Where AI got something wrong and how it was caught

### Incorrect search selector

A generated search test attempted to locate `product-title` within the
first `product-tile`. The browser test timed out because the card markup
did not contain that test ID; `product-title` was present on the product
details page. The failure was caught by running Playwright, not by
assuming the generated test was correct.

**Correction:** added `product-card-title` to the product card,
documented it in `ui-contract.md`, clarified the prompt, and tightened
the static validator. A positive unit test verifies the correct selector
is accepted; a negative unit test verifies the details-page selector is
rejected in a search test.

### Stale generated files

A later generation run produced new scenario filenames but did not
remove files generated from the earlier scenario IDs. Static validation
therefore reported nine files instead of the five current scenarios.

**Correction:** added scenario-aware cleanup to `src/run.ts`. The
cleanup removes obsolete `.spec.ts` files from the generated directory
while preserving current scenario specs and non-spec files such as
`REPORT.md`. A temporary stale spec was used to exercise the cleanup as
part of the combined workflow.

### Environment issue during verification

Docker Desktop's engine was initially unavailable, preventing container
rebuild/start commands. The engine was brought back up before
continuing. This was an environment issue rather than an
application-code defect.

## Human review and verification

The generated search spec was inspected to confirm that it:

-   Uses the `Orbit` fixture.
-   Interacts with the documented search controls.
-   Checks the search URL.
-   Asserts at least one visible result exists.
-   Iterates over all results and checks each `product-card-title`.

The verified run reported:

-   13/13 test-generator unit tests passing.
-   5/5 generated specs passing static validation.
-   7/7 generated Playwright tests passing.

The final combined command is:

``` bash
cd tools/testgen
npm run testgen:e2e
```

AI-generated output remains subject to review. Passing tests demonstrate
the current acceptance-criteria path; they do not prove production
readiness or cover requirements outside the supplied brief.

## Time spent

Record the actual time before submission. Do not estimate or claim the
challenge's suggested 2--3 hour time-box unless it reflects the time
actually spent.

  Activity                                 Actual time
  ---------------------------------------- ------------------------------
  Planning and assumptions                 `30 Min`
  Application and backend implementation   `30 Min`
  Test generation and automation           `30 Min`
  Debugging and verification               `2 Hours`
  Documentation and final review           `30 Min`
  **Total**                                **4 Hours**
