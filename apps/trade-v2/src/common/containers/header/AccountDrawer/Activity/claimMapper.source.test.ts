import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('claim entity name resolves inst.name by market address and only uses symbol as fallback', () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const source = readFileSync(
    path.join(path.dirname(currentFilePath), 'claimMapper.ts'),
    'utf8',
  );

  assert.equal(
    source.includes('getInstByMarketAddress(context.insts, detail.market)?.name ||'),
    true,
  );
  assert.equal(source.includes('detail.market_symbol ||'), true);
});
