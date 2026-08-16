import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCreditAirdropShareMessage,
  buildCreditAirdropShareUrl,
  buildLeaderboardReferralShareUrl,
  buildLeaderboardShareMessage,
  buildLeaderboardShareText,
  buildLeaderboardShareUrl,
  buildShortShareUrl,
  resolveCreditAirdropShareValues,
  resolveLeaderboardShareValues,
} from './referralShare.ts';

const leaderboardValues = {
  totalVolume: '+$0',
  netPnl: '+$0',
  winRate: 'TBD',
  rank: '--',
  degens: '500',
};

const creditAirdropValues = {
  creditAmount: '0',
  hzflAmount: '0',
  pointsAmount: '0',
  seasonName: 'Season 1',
  referredUsers: '0',
  referredVolume: '0',
  isWindowOpen: false,
};

test('builds leaderboard tweet text without embedding a second URL', () => {
  const text = buildLeaderboardShareText('TEST08', leaderboardValues);

  assert.equal(text.includes('https://'), false);
  assert.match(text, /Trade & Earn on any asset with my code: TEST08/);
});

test('builds leaderboard tweet text without a referral code', () => {
  const text = buildLeaderboardShareText('', leaderboardValues);

  assert.equal(text.includes('https://'), false);
  assert.doesNotMatch(text, /my code/);
  assert.match(text, /Talk is cheap/);
});

test('builds base referral share urls on the referral page', () => {
  const url = new URL(
    buildShortShareUrl('https://portal-dev.htzfl.link', 'TEST08'),
  );

  assert.equal(url.pathname, '/referral');
  assert.equal(url.searchParams.get('ref'), 'TEST08');
});

test('builds leaderboard referral share urls without a referral code', () => {
  const origin = 'https://portal-dev.htzfl.link';
  const url = buildLeaderboardReferralShareUrl(origin, leaderboardValues);
  const message = buildLeaderboardShareMessage(origin, '', leaderboardValues);

  assert.equal(new URL(url).pathname, '/referral');
  assert.equal(new URL(url).searchParams.get('type'), 'leaderboard');
  assert.equal(message.endsWith(url), true);
});

test('builds leaderboard share messages with one origin-aware leaderboard URL', () => {
  const origin = 'https://portal-dev.htzfl.link';
  const url = buildLeaderboardShareUrl(origin, 'TEST08', leaderboardValues);
  const message = buildLeaderboardShareMessage(
    origin,
    'TEST08',
    leaderboardValues,
  );

  assert.equal(message.endsWith(url), true);
  assert.equal(new URL(url).pathname, '/referral');
  assert.equal(new URL(url).searchParams.get('ref'), 'TEST08');
  assert.equal(message.match(/https:\/\//g)?.length, 1);
  assert.equal(new URL(url).searchParams.get('type'), 'leaderboard');
});

test('builds credit airdrop share message with the link after the referral code', () => {
  const origin = 'https://portal-dev.htzfl.link';
  const message = buildCreditAirdropShareMessage(
    origin,
    'H22220',
    creditAirdropValues,
  );
  const url = buildCreditAirdropShareUrl(origin, 'H22220', creditAirdropValues);

  assert.match(
    message,
    /Use my code H22220: https:\/\/portal-dev\.htzfl\.link\/referral\?ref=H22220/,
  );
  assert.equal(new URL(url).searchParams.get('type'), 'credit-airdrop');
  assert.equal(message.match(/https:\/\//g)?.length, 1);
});

test('resolves leaderboard and credit share values by explicit type only', () => {
  const leaderboardParams = new URLSearchParams(
    new URL(
      buildLeaderboardShareUrl(
        'https://portal-dev.htzfl.link',
        'TEST08',
        leaderboardValues,
      ),
    ).search,
  );

  assert.equal(resolveCreditAirdropShareValues(leaderboardParams), null);
  assert.deepEqual(
    resolveLeaderboardShareValues(leaderboardParams),
    leaderboardValues,
  );
});
