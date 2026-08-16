'use client';

import { useCurrentAccountAddress } from '@/common';
import { useSwapHistoryQuery } from '@/queries/bsc/swap';

export const useSwapHistory = (enabled = true) => {
  const account = useCurrentAccountAddress();
  const query = useSwapHistoryQuery(account ?? '', enabled);
  const records = query.data?.pages.flatMap((page) => page.records) ?? [];

  return {
    account,
    records,
    isInitialLoading:
      !!account && query.isFetching && query.data === undefined,
    isInitialError:
      !!account &&
      query.isError &&
      !query.isFetching &&
      query.data === undefined,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
};
