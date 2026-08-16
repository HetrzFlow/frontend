'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  type DefinedInitialDataInfiniteOptions,
  type DefinedInitialDataOptions,
  focusManager,
  hashKey,
  type InfiniteData,
  QueryClient,
  type DefinedUseInfiniteQueryResult,
  type DefinedUseQueryResult,
  type DefaultError,
  type QueryKey,
  type UndefinedInitialDataInfiniteOptions,
  type UndefinedInitialDataOptions,
  useInfiniteQuery as useTanStackInfiniteQuery,
  useQuery as useTanStackQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    },
  },
});

type RefetchIntervalSubscriber = {
  interval: number;
  nextRunAt: number;
  order: number;
  priority: number;
  refetch: () => void;
  refetchInBackground: boolean;
};

type RefetchIntervalEntry = {
  subscribers: Map<symbol, RefetchIntervalSubscriber>;
};

const refetchIntervalEntries = new Map<string, RefetchIntervalEntry>();
const SHARED_REFETCH_TICK_MS = 250;
let nextRefetchIntervalSubscriberOrder = 0;
let refetchIntervalTicker: ReturnType<typeof setInterval> | undefined;

const getRefetchIntervalOwner = (entry: RefetchIntervalEntry) => {
  let nextOwnerConfig: RefetchIntervalSubscriber | undefined;

  entry.subscribers.forEach((subscriber) => {
    if (
      !nextOwnerConfig ||
      subscriber.priority > nextOwnerConfig.priority ||
      (subscriber.priority === nextOwnerConfig.priority &&
        subscriber.interval < nextOwnerConfig.interval) ||
      (subscriber.priority === nextOwnerConfig.priority &&
        subscriber.interval === nextOwnerConfig.interval &&
        subscriber.order < nextOwnerConfig.order)
    ) {
      nextOwnerConfig = subscriber;
    }
  });

  return nextOwnerConfig;
};

const hasActiveRefetchIntervalSubscribers = () =>
  Array.from(refetchIntervalEntries.values()).some(
    (entry) => entry.subscribers.size > 0,
  );

const runSharedRefetchIntervalTick = () => {
  const now = Date.now();

  refetchIntervalEntries.forEach((entry) => {
    const owner = getRefetchIntervalOwner(entry);
    if (!owner || owner.nextRunAt > now) return;

    owner.nextRunAt = now + owner.interval;
    if (owner.refetchInBackground || focusManager.isFocused()) {
      owner.refetch();
    }
  });
};

const syncSharedRefetchIntervalTicker = () => {
  if (!hasActiveRefetchIntervalSubscribers()) {
    if (refetchIntervalTicker) {
      clearInterval(refetchIntervalTicker);
      refetchIntervalTicker = undefined;
    }
    return;
  }

  if (refetchIntervalTicker) return;

  refetchIntervalTicker = setInterval(
    runSharedRefetchIntervalTick,
    SHARED_REFETCH_TICK_MS,
  );
};

const useSharedRefetchInterval = ({
  enabled,
  interval,
  queryKey,
  priority = 0,
  refetch,
  refetchInBackground = false,
}: {
  enabled: boolean;
  interval: number | false;
  queryKey: QueryKey;
  priority?: number;
  refetch: () => void;
  refetchInBackground?: boolean;
}) => {
  const entryKey = useMemo(() => hashKey(queryKey), [queryKey]);
  const subscriberRef = useRef<symbol>(Symbol(entryKey));
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled || typeof interval !== 'number') return;

    const subscriber = subscriberRef.current;
    const entry = refetchIntervalEntries.get(entryKey) ?? {
      subscribers: new Map<symbol, RefetchIntervalSubscriber>(),
    };
    const existing = entry.subscribers.get(subscriber);

    entry.subscribers.set(subscriber, {
      interval,
      nextRunAt: existing?.nextRunAt ?? Date.now() + interval,
      order: existing?.order ?? nextRefetchIntervalSubscriberOrder++,
      priority,
      refetch: () => refetchRef.current(),
      refetchInBackground,
    });
    refetchIntervalEntries.set(entryKey, entry);
    syncSharedRefetchIntervalTicker();

    return () => {
      const current = refetchIntervalEntries.get(entryKey);
      if (!current) return;

      current.subscribers.delete(subscriber);
      if (!current.subscribers.size) {
        refetchIntervalEntries.delete(entryKey);
      }
      syncSharedRefetchIntervalTicker();
    };
  }, [enabled, entryKey, interval, priority, refetchInBackground]);
};

const getPollingPriority = (meta: unknown) =>
  typeof (meta as { pollPriority?: unknown } | undefined)?.pollPriority ===
  'number'
    ? (meta as { pollPriority: number }).pollPriority
    : 0;

export function useQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError>;

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>;

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> {
  const refetchInterval = options.refetchInterval;
  const result = useTanStackQuery(
    typeof refetchInterval === 'number'
      ? {
          ...options,
          refetchInterval: false,
          staleTime: Infinity,
        }
      : options,
    queryClient,
  );

  useSharedRefetchInterval({
    enabled: options.enabled !== false,
    interval: typeof refetchInterval === 'number' ? refetchInterval : false,
    queryKey: options.queryKey,
    priority: getPollingPriority(options.meta),
    refetch: result.refetch,
    refetchInBackground: options.refetchIntervalInBackground,
  });

  return result;
}

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError>;

export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>;

export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError> {
  const refetchInterval = options.refetchInterval;
  const result = useTanStackInfiniteQuery(
    typeof refetchInterval === 'number'
      ? {
          ...options,
          refetchInterval: false,
          staleTime: Infinity,
        }
      : options,
    queryClient,
  );

  useSharedRefetchInterval({
    enabled: options.enabled !== false,
    interval: typeof refetchInterval === 'number' ? refetchInterval : false,
    queryKey: options.queryKey,
    priority: getPollingPriority(options.meta),
    refetch: result.refetch,
    refetchInBackground: options.refetchIntervalInBackground,
  });

  return result;
}

export {
  QueryClientProvider,
  focusManager,
  hashKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

export type {
  DefaultError,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  InfiniteData,
  QueryKey,
  QueryObserverResult,
  RefetchOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
