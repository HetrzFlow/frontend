import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('schedules dismissed announcement pruning every 5 minutes', () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const source = readFileSync(path.join(path.dirname(currentFilePath), 'NewListingAnnouncementHost.tsx'), 'utf8');

  assert.equal(source.includes('setInterval(() => {'), true);
  assert.equal(source.includes('pruneDismissedAnnouncementRecords();'), true);
  assert.equal(source.includes('300_000'), true);
});
