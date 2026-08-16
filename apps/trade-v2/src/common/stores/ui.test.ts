import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('app ui store lives in common/stores and old trade ui store is removed', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const commonUiStorePath = path.join(currentDir, 'ui.ts');
  const oldTradeUiStorePath = path.join(currentDir, '..', '..', 'stores', 'trade', 'ui.ts');

  assert.equal(existsSync(commonUiStorePath), true);
  assert.equal(existsSync(oldTradeUiStorePath), false);
});
