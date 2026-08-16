import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  hzvValueQueryKey,
  hzvValuesQueryKey,
  invalidateHzvValuesIfNeeded,
  shouldInvalidateHzvValues,
} from './queryKeys';

const VAULT_A = '0x0000000000000000000000000000000000000001';
const VAULT_B = '0x0000000000000000000000000000000000000002';
const MARKET_A = '0x0000000000000000000000000000000000000011';
const MARKET_B = '0x0000000000000000000000000000000000000012';

test('global HZV key is stable for reordered and repeated vault addresses', () => {
  assert.deepEqual(
    hzvValuesQueryKey(97, [VAULT_B, VAULT_A, VAULT_A]),
    hzvValuesQueryKey(97, [VAULT_A, VAULT_B]),
  );
});

test('single-vault HZV key is stable for reordered and repeated markets', () => {
  assert.deepEqual(
    hzvValueQueryKey(97, VAULT_A, [MARKET_B, MARKET_A, MARKET_A]),
    hzvValueQueryKey(97, VAULT_A, [MARKET_A, MARKET_B]),
  );
});

test('HZV values invalidate only for a newer, unhandled input version', () => {
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt: 300,
      queryUpdatedAt: 200,
      lastInvalidatedAt: 0,
    }),
    true,
  );
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt: 200,
      queryUpdatedAt: 300,
      lastInvalidatedAt: 0,
    }),
    false,
  );
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt: 300,
      queryUpdatedAt: 200,
      lastInvalidatedAt: 300,
    }),
    false,
  );
});

test('HZV values wait for a chunked input request to settle', () => {
  const partialUpdates = [100, 200, 300];

  for (const inputsUpdatedAt of partialUpdates) {
    assert.equal(
      shouldInvalidateHzvValues({
        inputsAreFetching: true,
        inputsHaveError: false,
        inputsUpdatedAt,
        queryUpdatedAt: 50,
        lastInvalidatedAt: 0,
      }),
      false,
    );
  }

  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt: partialUpdates.at(-1)!,
      queryUpdatedAt: 50,
      lastInvalidatedAt: 0,
    }),
    true,
  );
});

test('HZV values do not invalidate after an input request settles with an error', () => {
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: true,
      inputsUpdatedAt: 300,
      queryUpdatedAt: 50,
      lastInvalidatedAt: 0,
    }),
    false,
  );
});

test('chunked query cache updates produce one invalidation decision after success', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryKey = ['test', 'chunked-input'] as const;
  let releaseRequest!: () => void;
  let partialWritesComplete!: () => void;
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  const partialWrites = new Promise<void>((resolve) => {
    partialWritesComplete = resolve;
  });

  const request = queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      queryClient.setQueryData(queryKey, { version: 1 });
      queryClient.setQueryData(queryKey, { version: 2 });
      queryClient.setQueryData(queryKey, { version: 3 });
      partialWritesComplete();
      await requestGate;
      return { version: 3 };
    },
  });

  await partialWrites;
  const fetchingState = queryClient.getQueryState(queryKey);
  assert.equal(fetchingState?.fetchStatus, 'fetching');
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: fetchingState?.fetchStatus === 'fetching',
      inputsHaveError: fetchingState?.status === 'error',
      inputsUpdatedAt: fetchingState?.dataUpdatedAt ?? 0,
      queryUpdatedAt: 0,
      lastInvalidatedAt: 0,
    }),
    false,
  );

  releaseRequest();
  await request;
  const settledState = queryClient.getQueryState(queryKey);
  const inputsUpdatedAt = settledState?.dataUpdatedAt ?? 0;
  assert.equal(settledState?.fetchStatus, 'idle');
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: settledState?.status === 'error',
      inputsUpdatedAt,
      queryUpdatedAt: 0,
      lastInvalidatedAt: 0,
    }),
    true,
  );
  assert.equal(
    shouldInvalidateHzvValues({
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt,
      queryUpdatedAt: 0,
      lastInvalidatedAt: inputsUpdatedAt,
    }),
    false,
  );

  queryClient.clear();
});

test('newer settled inputs cause one actual active HZV invalidation', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryKey = ['hz-sdk', 'hzv-values', 97, VAULT_A] as const;
  let fetchCount = 0;
  const observer = new QueryObserver(queryClient, {
    queryKey,
    queryFn: async () => ({ fetchCount: ++fetchCount }),
  });
  const unsubscribe = observer.subscribe(() => undefined);

  await observer.refetch();
  const queryUpdatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt ?? 0;
  const inputsUpdatedAt = queryUpdatedAt + 1;

  assert.equal(
    await invalidateHzvValuesIfNeeded({
      queryClient,
      queryKey,
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt,
      queryUpdatedAt,
    }),
    true,
  );
  assert.equal(fetchCount, 2);

  assert.equal(
    await invalidateHzvValuesIfNeeded({
      queryClient,
      queryKey,
      inputsAreFetching: false,
      inputsHaveError: false,
      inputsUpdatedAt,
      queryUpdatedAt,
    }),
    false,
  );
  assert.equal(fetchCount, 2);

  unsubscribe();
  queryClient.clear();
});

test('failed invalidation releases the input version for a later attempt', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryKey = ['hz-sdk', 'hzv-values', 97, VAULT_A] as const;
  const invalidateQueries = queryClient.invalidateQueries.bind(queryClient);
  let failNextInvalidation = true;
  queryClient.invalidateQueries = (async (...args) => {
    if (failNextInvalidation) {
      failNextInvalidation = false;
      throw new Error('invalidation failed');
    }
    return invalidateQueries(...args);
  }) as QueryClient['invalidateQueries'];

  const options = {
    queryClient,
    queryKey,
    inputsAreFetching: false,
    inputsHaveError: false,
    inputsUpdatedAt: 200,
    queryUpdatedAt: 100,
  };

  assert.equal(await invalidateHzvValuesIfNeeded(options), false);
  assert.equal(await invalidateHzvValuesIfNeeded(options), true);

  queryClient.clear();
});
