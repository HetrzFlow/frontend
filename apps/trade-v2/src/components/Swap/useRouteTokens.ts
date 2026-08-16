'use client';

import { useQueries } from '@tanstack/react-query';

import { getSwapTokenQueryOptions, type SwapToken } from './useSwapTokens';
import type { ExternalSwapRouteStream } from '@hertzflow/sdk-v2/types/externalSwap';

export type RouteTokenLoadStatus = 'loading' | 'error';

type RouteTokenQueryResult = {
  data?: SwapToken;
  isError: boolean;
};

export const getRouteTokenAddresses = (
  streams: ExternalSwapRouteStream[],
  knownTokens: SwapToken[],
) => {
  const known = new Set(
    knownTokens.map((token) => token.address.toLowerCase()),
  );
  const addresses = new Set<string>();

  for (const stream of streams) {
    for (const hop of stream.hops) {
      for (const address of [hop.tokenIn, hop.tokenOut]) {
        const normalized = address.toLowerCase();
        if (!known.has(normalized)) addresses.add(normalized);
      }
    }
  }

  return Array.from(addresses).sort();
};

export const getRouteTokenState = (
  knownTokens: SwapToken[],
  addresses: string[],
  queryResults: RouteTokenQueryResult[],
) => {
  const tokenByAddress = Object.fromEntries(
    [
      ...knownTokens,
      ...queryResults.flatMap((result) => (result.data ? [result.data] : [])),
    ].map((token) => [token.address.toLowerCase(), token]),
  ) as Record<string, SwapToken>;
  const statusByAddress = Object.fromEntries(
    addresses.flatMap((address, index) =>
      queryResults[index]?.data
        ? []
        : [
            [
              address.toLowerCase(),
              queryResults[index]?.isError ? 'error' : 'loading',
            ],
          ],
    ),
  ) as Record<string, RouteTokenLoadStatus>;

  return { tokenByAddress, statusByAddress };
};

export const getRouteTokenQueries = (addresses: string[], enabled: boolean) =>
  addresses.map((address) => ({
    ...getSwapTokenQueryOptions(address),
    enabled,
    retry: 1,
    staleTime: Infinity,
  }));

export const useRouteTokens = ({
  streams,
  payToken,
  receiveToken,
  enabled,
}: {
  streams: ExternalSwapRouteStream[];
  payToken?: SwapToken;
  receiveToken?: SwapToken;
  enabled: boolean;
}) => {
  const knownTokens = [payToken, receiveToken].filter(
    (token): token is SwapToken => !!token,
  );
  const addresses = getRouteTokenAddresses(streams, knownTokens);
  const queryResults = useQueries({
    queries: getRouteTokenQueries(addresses, enabled && addresses.length > 0),
  });
  const { tokenByAddress, statusByAddress } = getRouteTokenState(
    knownTokens,
    addresses,
    queryResults,
  );

  return {
    tokenByAddress,
    statusByAddress,
    isLoading: Object.values(statusByAddress).some(
      (status) => status === 'loading',
    ),
  };
};
