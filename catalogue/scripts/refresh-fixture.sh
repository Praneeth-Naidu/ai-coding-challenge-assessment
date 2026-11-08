#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
TARGET="$SCRIPT_DIR/../backend/fixtures/products.json"
TEMP_FILE="${TARGET}.tmp"
URL="${FAKESTORE_BASE_URL:-https://fakestoreapi.com}"

cleanup() { rm -f "$TEMP_FILE"; }
trap cleanup EXIT INT TERM

curl --fail --silent --show-error --location --max-time 15 "$URL/products" -o "$TEMP_FILE"
node --input-type=module - "$TEMP_FILE" <<'NODE'
import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (!Array.isArray(data) || data.length < 5) throw new Error('Expected at least five products.');
for (const product of data) {
  const valid = Number.isInteger(product.id) && typeof product.title === 'string'
    && typeof product.price === 'number' && typeof product.description === 'string'
    && typeof product.category === 'string' && typeof product.image === 'string'
    && typeof product.rating?.rate === 'number' && Number.isInteger(product.rating?.count);
  if (!valid) throw new Error(`Invalid product record: ${JSON.stringify(product)}`);
}
process.stdout.write(`Validated ${data.length} products from the upstream API.\n`);
NODE
mv "$TEMP_FILE" "$TARGET"
printf 'Updated %s. Review it and update backend/config/featured.json and e2e/contract/ui-contract.md.\n' "$TARGET"
