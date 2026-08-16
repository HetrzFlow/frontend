import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMeritsShareUrl,
  getMeritsShareSearchParams,
  resolveMeritsShareValues,
} from './meritsShare.ts';

test('builds active Merits metadata parameters on the real share link', () => {
  const values = {
    inviteCode: '275ER8',
    merits: '234,000',
    estimate: '1,205',
    rank: 'Top 5%',
  };
  const url = new URL(
    buildMeritsShareUrl('https://hertzflow.xyz/s/HZ7E3F', values),
  );

  assert.equal(url.pathname, '/s/HZ7E3F');
  assert.deepEqual(resolveMeritsShareValues(url.searchParams), values);
});

test('omits the active estimate for an ended Season share', () => {
  const values = {
    inviteCode: '275ER8',
    merits: '234,000',
    estimate: null,
    rank: 'Top 5%',
  };
  const params = getMeritsShareSearchParams(values);

  assert.equal('estimate' in params, false);
  assert.deepEqual(
    resolveMeritsShareValues(new URLSearchParams(params)),
    values,
  );
});

test('preserves a production short-link origin and existing parameters', () => {
  const url = new URL(
    buildMeritsShareUrl(
      'https://hertzflow.xyz/s/HZ7E3F?campaign=season-2',
      {
        inviteCode: '275ER8',
        merits: '234,000',
        estimate: '1,205',
        rank: 'Top 5%',
      },
    ),
  );

  assert.equal(url.origin, 'https://hertzflow.xyz');
  assert.equal(url.pathname, '/s/HZ7E3F');
  assert.equal(url.searchParams.get('campaign'), 'season-2');
  assert.equal(url.searchParams.get('type'), 'merits');
});
