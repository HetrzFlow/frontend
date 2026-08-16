import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('uses a 5-minute polling interval for announcement fetches', () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const source = readFileSync(path.join(path.dirname(currentFilePath), 'announcements.ts'), 'utf8');

  assert.equal(source.includes('refetchInterval: 300_000'), true);
  assert.equal(source.includes('refetchInterval: 60_000'), false);
});
