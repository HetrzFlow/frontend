import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('uses next link for market navigation instead of imperative click handler prop', () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const toastFilePath = path.join(path.dirname(currentFilePath), 'NewListingAnnouncementToast.tsx');
  const source = readFileSync(toastFilePath, 'utf8');

  assert.equal(source.includes("import Link from 'next/link'"), true);
  assert.equal(source.includes('onMarketClick:'), false);
  assert.equal(source.includes('onClick={() => onMarketClick(market)}'), false);
  assert.equal(source.includes('<Link'), true);
});
