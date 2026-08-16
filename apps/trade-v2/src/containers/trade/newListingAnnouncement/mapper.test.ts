import assert from 'node:assert/strict';
import test from 'node:test';
import type { Inst } from '@/common';
import { CATEGORY } from '@/services/rest/pools';
import { mapVisibleAnnouncements, type AnnouncementApiItem } from './mapper';

const makeInst = (overrides: Pick<Inst, 'name' | 'symbol' | 'icon'>): Inst =>
  ({
    id: overrides.symbol,
    category: CATEGORY.equities,
    is_closed: false,
    marketTokenAddress: '0x0',
    indexTokenAddress: '0x0',
    longTokenAddress: '0x0',
    shortTokenAddress: '0x0',
    isSameCollaterals: false,
    isSpotOnly: false,
    isView: false,
    data: '',
    schedule: '',
    ...overrides,
  }) as Inst;

test('sorts active announcements by created_at descending', () => {
  const now = new Date('2026-04-20T12:00:00Z').getTime();

  const result = mapVisibleAnnouncements({
    announcements: [
      {
        created_at: '2026-04-19T08:00:00Z',
        expire_at: '2026-04-21T08:00:00Z',
        markets: [{ address: '0x1' }],
      },
      {
        created_at: '2026-04-20T08:00:00Z',
        expire_at: '2026-04-21T08:00:00Z',
        markets: [{ address: '0x2' }],
      },
    ],
    dismissedCreatedAts: [],
    instMap: {
      '0x1': makeInst({
        name: 'GOOGLE',
        symbol: 'GOOGLE/USD',
        icon: '/google.png',
      }),
      '0x2': makeInst({
        name: 'AMZN',
        symbol: 'AMZN/USD',
        icon: '/amzn.png',
      }),
    },
    now,
  });

  assert.deepEqual(
    result.map((item) => item.createdAt),
    ['2026-04-20T08:00:00Z', '2026-04-19T08:00:00Z'],
  );
});

test('filters expired and dismissed announcements', () => {
  const result = mapVisibleAnnouncements({
    announcements: [
      {
        created_at: '2026-04-20T08:00:00Z',
        expire_at: '2026-04-19T08:00:00Z',
        markets: [{ address: '0x1' }],
      },
      {
        created_at: '2026-04-20T09:00:00Z',
        expire_at: '2026-04-21T09:00:00Z',
        markets: [{ address: '0x2' }],
      },
    ],
    dismissedCreatedAts: ['2026-04-20T09:00:00Z'],
    instMap: {
      '0x1': makeInst({
        name: 'GOOGLE',
        symbol: 'GOOGLE/USD',
        icon: '/google.png',
      }),
      '0x2': makeInst({
        name: 'AMZN',
        symbol: 'AMZN/USD',
        icon: '/amzn.png',
      }),
    },
    now: new Date('2026-04-20T12:00:00Z').getTime(),
  });

  assert.deepEqual(result, []);
});

test('skips malformed announcements and unresolved addresses', () => {
  const result = mapVisibleAnnouncements({
    announcements: [
      {
        created_at: 'not-a-date',
        expire_at: '2026-04-21T09:00:00Z',
        markets: [{ address: '0x1' }],
      },
      {
        created_at: '2026-04-20T08:00:00Z',
        expire_at: 'bad-expire-at',
        markets: [{ address: '0x1' }],
      },
      {
        created_at: '2026-04-20T08:30:00Z',
        expire_at: '2026-04-21T09:00:00Z',
        markets: 'bad-markets',
      },
      {
        created_at: '2026-04-20T09:00:00Z',
        expire_at: '2026-04-21T09:00:00Z',
        markets: [{ address: '0x404' }],
      },
      {
        created_at: '2026-04-20T10:00:00Z',
        expire_at: '2026-04-21T09:00:00Z',
        markets: [{ address: '0x1' }, { address: '' }],
      },
    ] as unknown as AnnouncementApiItem[],
    dismissedCreatedAts: [],
    instMap: {
      '0x1': makeInst({
        name: 'GOOGLE',
        symbol: 'GOOGLE/USD',
        icon: '/google.png',
      }),
    },
    now: new Date('2026-04-20T12:00:00Z').getTime(),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.createdAt, '2026-04-20T10:00:00Z');
  assert.equal(result[0]?.visibleMarkets.length, 1);
});

test('keeps four visible markets and computes overflow count', () => {
  const result = mapVisibleAnnouncements({
    announcements: [
      {
        created_at: '2026-04-20T08:00:00Z',
        expire_at: '2026-04-21T09:00:00Z',
        markets: [
          { address: '0x1' },
          { address: '0x2' },
          { address: '0x3' },
          { address: '0x4' },
          { address: '0x5' },
        ],
      },
    ],
    dismissedCreatedAts: [],
    instMap: {
      '0x1': makeInst({ name: 'A', symbol: 'A/USD', icon: '' }),
      '0x2': makeInst({ name: 'B', symbol: 'B/USD', icon: '' }),
      '0x3': makeInst({ name: 'C', symbol: 'C/USD', icon: '' }),
      '0x4': makeInst({ name: 'D', symbol: 'D/USD', icon: '' }),
      '0x5': makeInst({ name: 'E', symbol: 'E/USD', icon: '' }),
    },
    now: new Date('2026-04-20T12:00:00Z').getTime(),
  });

  assert.equal(result[0]?.visibleMarkets.length, 4);
  assert.equal(result[0]?.overflowCount, 1);
});

test('maps backend contract sample payload into visible markets', () => {
  const result = mapVisibleAnnouncements({
    announcements: [
      {
        created_at: '2026-04-17T08:00:00Z',
        expire_at: '2030-03-17T17:46:40Z',
        markets: [{ address: '0x1111111111111111111111111111111111111111' }],
      },
    ],
    dismissedCreatedAts: [],
    instMap: {
      '0x1111111111111111111111111111111111111111': makeInst({
        name: 'GOOGLE',
        symbol: 'GOOGLE/USD',
        icon: '/google.png',
      }),
    },
    now: new Date('2026-04-20T12:00:00Z').getTime(),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.createdAt, '2026-04-17T08:00:00Z');
  assert.equal(result[0]?.expireAt, '2030-03-17T17:46:40Z');
  assert.equal(
    result[0]?.visibleMarkets[0]?.address,
    '0x1111111111111111111111111111111111111111',
  );
});
