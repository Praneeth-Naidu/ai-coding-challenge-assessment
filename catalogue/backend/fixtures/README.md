# Fixture provenance

`products.json` is **synthetic demo data**, not a downloaded Fake Store API snapshot. The build environment had no DNS/network access to `fakestoreapi.com`. Use `scripts/refresh-fixture.sh` from the repository root when online to retrieve and validate the real upstream data, then review the replacement and update the five curated product IDs and the E2E contract facts.
