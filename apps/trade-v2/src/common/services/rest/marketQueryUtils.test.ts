import assert from 'node:assert/strict';
import test from 'node:test';
import {
  areMarketsConfigsDemandsCovered,
  getActiveMarketsConfigsDemand,
  getCompletedMarketsConfigsDemandVersion,
  getMarketsConfigsDemandVersion,
  markMarketsConfigsDemandVersionCompleted,
  removeMarketsConfigsDemand,
  scheduleMarketsConfigsDemandRefetch,
  selectMarketsConfigsRequestInsts,
  setMarketsConfigsDemand,
  shouldAttemptFullMarketsRefresh,
  shouldRefreshAllMarketsConfigs,
} from './marketQueryUtils';

const markets = [
  { marketTokenAddress: '0xAAA' },
  { marketTokenAddress: '0xBBB' },
  { marketTokenAddress: '0xCCC' },
];

test('active market demand takes precedence over a full refresh', () => {
  assert.deepEqual(
    selectMarketsConfigsRequestInsts(markets, new Set(['0xbbb']), true),
    [markets[1]],
  );
});

test('requests every market for a full refresh without active demand', () => {
  assert.deepEqual(
    selectMarketsConfigsRequestInsts(markets, new Set(), true),
    markets,
  );
});

test('requests only active markets between full refreshes', () => {
  assert.deepEqual(
    selectMarketsConfigsRequestInsts(
      markets,
      new Set(['0xbbb', '0xccc']),
      false,
    ),
    [markets[1], markets[2]],
  );
});

test('does not make a scoped request when no active markets are registered', () => {
  assert.deepEqual(
    selectMarketsConfigsRequestInsts(markets, new Set(), false),
    [],
  );
});

test('combines active demands and ignores background demands', () => {
  const scopeKey = 'test-scope';
  const first = Symbol('first');
  const second = Symbol('second');
  const background = Symbol('background');

  setMarketsConfigsDemand(scopeKey, first, {
    addresses: ['0xAAA', '0xBBB'],
    priority: 'active',
  });
  setMarketsConfigsDemand(scopeKey, second, {
    addresses: ['0xbbb', '0xCCC'],
    priority: 'active',
  });
  setMarketsConfigsDemand(scopeKey, background, {
    addresses: ['0xDDD'],
    priority: 'background',
  });

  assert.deepEqual([...getActiveMarketsConfigsDemand(scopeKey)].sort(), [
    '0xaaa',
    '0xbbb',
    '0xccc',
  ]);

  removeMarketsConfigsDemand(scopeKey, first);
  removeMarketsConfigsDemand(scopeKey, second);
  removeMarketsConfigsDemand(scopeKey, background);
});

test('refreshes all configs initially and after the background interval', () => {
  const backgroundRefreshInterval = 300_000;

  assert.equal(
    shouldRefreshAllMarketsConfigs({
      fullSnapshotLoaded: false,
      lastFullSnapshotAt: 0,
      now: 100,
      backgroundRefreshInterval,
    }),
    true,
  );
  assert.equal(
    shouldRefreshAllMarketsConfigs({
      fullSnapshotLoaded: true,
      lastFullSnapshotAt: 100,
      now: 200,
      backgroundRefreshInterval,
    }),
    false,
  );
  assert.equal(
    shouldRefreshAllMarketsConfigs({
      fullSnapshotLoaded: true,
      lastFullSnapshotAt: 100,
      now: 300_100,
      backgroundRefreshInterval,
    }),
    true,
  );
});

test('attempts a full values refresh initially and after the background interval', () => {
  const backgroundRefreshInterval = 60_000;

  assert.equal(
    shouldAttemptFullMarketsRefresh({
      lastFullSnapshotAttemptAt: 0,
      now: 100,
      backgroundRefreshInterval,
    }),
    true,
  );
  assert.equal(
    shouldAttemptFullMarketsRefresh({
      lastFullSnapshotAttemptAt: 100,
      now: 20_100,
      backgroundRefreshInterval,
    }),
    false,
  );
  assert.equal(
    shouldAttemptFullMarketsRefresh({
      lastFullSnapshotAttemptAt: 100,
      now: 60_100,
      backgroundRefreshInterval,
    }),
    true,
  );
});

test('reruns when an in-flight request did not include the latest demand', async () => {
  const scopeKey = 'rerun-scope';
  const subscriber = Symbol('subscriber');
  let refetchCount = 0;

  setMarketsConfigsDemand(scopeKey, subscriber, {
    addresses: ['0xAAA'],
    priority: 'active',
  });

  scheduleMarketsConfigsDemandRefetch(scopeKey, async () => {
    refetchCount += 1;
    if (refetchCount > 1) {
      markMarketsConfigsDemandVersionCompleted(
        scopeKey,
        getMarketsConfigsDemandVersion(scopeKey),
      );
    }
    return true;
  });

  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(refetchCount, 2);
  removeMarketsConfigsDemand(scopeKey, subscriber);
});

test('does not retry-loop when an active configs refetch fails', async () => {
  const scopeKey = 'failed-refetch-scope';
  const subscriber = Symbol('subscriber');
  let refetchCount = 0;

  setMarketsConfigsDemand(scopeKey, subscriber, {
    addresses: ['0xAAA'],
    priority: 'active',
  });

  scheduleMarketsConfigsDemandRefetch(scopeKey, async () => {
    refetchCount += 1;
    return false;
  });

  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(refetchCount, 1);
  assert.equal(
    getCompletedMarketsConfigsDemandVersion(scopeKey) <
      getMarketsConfigsDemandVersion(scopeKey),
    true,
  );
  removeMarketsConfigsDemand(scopeKey, subscriber);
});

test('only completes demands whose market chunks succeeded', () => {
  const available = new Set(['0xaaa', '0xbbb']);

  assert.equal(
    areMarketsConfigsDemandsCovered(
      new Set(['0xAAA']),
      available,
      new Set(['0xaaa']),
    ),
    true,
  );
  assert.equal(
    areMarketsConfigsDemandsCovered(
      new Set(['0xAAA', '0xBBB']),
      available,
      new Set(['0xaaa']),
    ),
    false,
  );
  assert.equal(
    areMarketsConfigsDemandsCovered(
      new Set(['0xOUTSIDE']),
      available,
      new Set(),
    ),
    true,
  );
});
