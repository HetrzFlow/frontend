import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SWAP_SLIPPAGE,
  usePreferenceStore,
} from './preference';

const resetStore = () => {
  usePreferenceStore.setState({
    slippage: '0.02',
    swapSlippage: DEFAULT_SWAP_SLIPPAGE,
    keepLeverage: false,
    favorites: new Map<string, boolean>(),
    leverageMode: 'normal',
    dismissedAnnouncementRecords: [],
  });
};

test('stores dismissed announcement with expireAt metadata', () => {
  resetStore();

  usePreferenceStore
    .getState()
    .addDismissedAnnouncementRecord('2026-04-21T08:00:00Z', '2026-04-28T08:00:00Z');

  assert.deepEqual(usePreferenceStore.getState().dismissedAnnouncementRecords, [
    {
      createdAt: '2026-04-21T08:00:00Z',
      expireAt: '2026-04-28T08:00:00Z',
    },
  ]);
});

test('keeps swap slippage independent from position slippage', () => {
  resetStore();

  usePreferenceStore.getState().setSwapSlippage('0.0075');

  assert.equal(usePreferenceStore.getState().swapSlippage, '0.0075');
  assert.equal(usePreferenceStore.getState().slippage, '0.02');
});

test('prunes expired dismissed announcements by expireAt', () => {
  resetStore();

  usePreferenceStore.setState({
    dismissedAnnouncementRecords: [
      {
        createdAt: '2026-04-01T08:00:00Z',
        expireAt: '2026-04-10T08:00:00Z',
      },
      {
        createdAt: '2026-04-21T08:00:00Z',
        expireAt: '2026-04-28T08:00:00Z',
      },
    ],
  });

  usePreferenceStore
    .getState()
    .pruneDismissedAnnouncementRecords(new Date('2026-04-21T12:00:00Z').getTime());

  assert.deepEqual(usePreferenceStore.getState().dismissedAnnouncementRecords, [
    {
      createdAt: '2026-04-21T08:00:00Z',
      expireAt: '2026-04-28T08:00:00Z',
    },
  ]);
});

test('checks dismissal status by createdAt after pruning', () => {
  resetStore();

  usePreferenceStore.setState({
    dismissedAnnouncementRecords: [
      {
        createdAt: '2026-04-01T08:00:00Z',
        expireAt: '2026-04-10T08:00:00Z',
      },
      {
        createdAt: '2026-04-21T08:00:00Z',
        expireAt: '2026-04-28T08:00:00Z',
      },
    ],
  });

  usePreferenceStore
    .getState()
    .pruneDismissedAnnouncementRecords(new Date('2026-04-21T12:00:00Z').getTime());

  assert.equal(
    usePreferenceStore.getState().hasDismissedAnnouncementRecord('2026-04-01T08:00:00Z'),
    false,
  );
  assert.equal(
    usePreferenceStore.getState().hasDismissedAnnouncementRecord('2026-04-21T08:00:00Z'),
    true,
  );
});
