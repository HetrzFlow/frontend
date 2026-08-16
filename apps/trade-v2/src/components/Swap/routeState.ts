import type { ExternalSwapRouteStream } from '@hertzflow/sdk-v2/types/externalSwap';

export type ExternalSwapRouteStatus =
  | 'idle'
  | 'finding'
  | 'ready'
  | 'no-route'
  | 'error';

export const isExternalSwapNoRouteError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'NO_ROUTE';

export const getExternalSwapRouteStatus = ({
  hasInput,
  canFetch,
  isDebouncing,
  isFetching,
  hasQuote,
  error,
  isFrozen,
}: {
  hasInput: boolean;
  canFetch: boolean;
  isDebouncing: boolean;
  isFetching: boolean;
  hasQuote: boolean;
  error?: unknown;
  isFrozen: boolean;
}): ExternalSwapRouteStatus => {
  if (isFrozen && hasQuote) return 'ready';
  if (!hasInput || (!isDebouncing && !canFetch)) return 'idle';
  if (isDebouncing) return 'finding';
  if (isFetching) return 'finding';
  if (isExternalSwapNoRouteError(error)) return 'no-route';
  if (error) return 'error';
  if (hasQuote) return 'ready';
  return 'finding';
};

export const getExternalSwapRouteSummary = (
  routeStreams: ExternalSwapRouteStream[],
) => {
  const mainProviderCode = routeStreams[0]?.hops[0]?.providerCode;
  if (!mainProviderCode) return;

  return {
    mainProviderCode,
    streamCount: routeStreams.length,
    extraStreamCount: Math.max(0, routeStreams.length - 1),
    canExpand: routeStreams.length > 1,
  };
};

export const shouldLoadRouteTokens = ({
  open,
  routeKey,
  idleRouteKey,
}: {
  open: boolean;
  routeKey: string;
  idleRouteKey?: string;
}) => open || (!!routeKey && idleRouteKey === routeKey);
