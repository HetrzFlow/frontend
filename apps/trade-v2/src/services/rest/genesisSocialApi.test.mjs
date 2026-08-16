import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const source = readFileSync(
  path.join(path.dirname(currentFilePath), 'genesis.ts'),
  'utf8',
);

test('social binding operations have no runtime mock switch', () => {
  assert.equal(source.includes('NEXT_PUBLIC_GENESIS_SOCIAL_API_ENABLED'), false);
  assert.equal(source.includes('isGenesisSocialApiEnabled'), false);
  assert.equal(source.includes('MOCK_SOCIAL_BINDINGS'), false);
});

test('all four social binding operations call the backend API', () => {
  assert.match(source, /getBscApi<ApiEnvelope<SocialBindingsResponse>>\(\s*'\/social\/bindings'/);
  assert.match(source, /postBscApi<ApiEnvelope<SocialChallengeResponse>>\(\s*'\/social\/challenge'/);
  assert.match(source, /postBscApi<ApiEnvelope<SocialBindInitiateResponse>>\(\s*'\/social\/bind\/initiate'/);
  assert.match(source, /postBscApi<ApiEnvelope<SocialUnbindResponse>>\(\s*'\/social\/unbind'/);
});
