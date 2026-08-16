import type { Market } from '@hertzflow/sdk-v2/types/markets';

export type MarketsConfigsRefreshPriority = 'active' | 'background';

type MarketsConfigsDemand = {
  addresses: string[];
  priority: MarketsConfigsRefreshPriority;
};

const marketsConfigsDemands = new Map<
  string,
  Map<symbol, MarketsConfigsDemand>
>();
const marketsConfigsDemandVersions = new Map<string, number>();
const completedMarketsConfigsDemandVersions = new Map<string, number>();
type DemandRefetchState = {
  refetch: () => Promise<boolean>;
  running: boolean;
  timer?: ReturnType<typeof setTimeout>;
};
const demandRefetchStates = new Map<string, DemandRefetchState>();

export const setMarketsConfigsDemand = (
  scopeKey: string,
  subscriber: symbol,
  demand: MarketsConfigsDemand,
) => {
  const subscribers = marketsConfigsDemands.get(scopeKey) ?? new Map();
  subscribers.set(subscriber, demand);
  marketsConfigsDemands.set(scopeKey, subscribers);
  if (demand.priority === 'active') {
    marketsConfigsDemandVersions.set(
      scopeKey,
      (marketsConfigsDemandVersions.get(scopeKey) ?? 0) + 1,
    );
  }
};

export const removeMarketsConfigsDemand = (
  scopeKey: string,
  subscriber: symbol,
) => {
  const subscribers = marketsConfigsDemands.get(scopeKey);
  if (!subscribers) return;

  subscribers.delete(subscriber);
  if (!subscribers.size) {
    marketsConfigsDemands.delete(scopeKey);
  }
};

export const getActiveMarketsConfigsDemand = (scopeKey: string) => {
  const addresses = new Set<string>();

  marketsConfigsDemands.get(scopeKey)?.forEach((demand) => {
    if (demand.priority !== 'active') return;
    demand.addresses.forEach((address) => addresses.add(address.toLowerCase()));
  });

  return addresses;
};

export const getMarketsConfigsDemandVersion = (scopeKey: string) =>
  marketsConfigsDemandVersions.get(scopeKey) ?? 0;

export const markMarketsConfigsDemandVersionCompleted = (
  scopeKey: string,
  version: number,
) => {
  completedMarketsConfigsDemandVersions.set(
    scopeKey,
    Math.max(completedMarketsConfigsDemandVersions.get(scopeKey) ?? 0, version),
  );
};

export const getCompletedMarketsConfigsDemandVersion = (scopeKey: string) =>
  completedMarketsConfigsDemandVersions.get(scopeKey) ?? 0;

const runMarketsConfigsDemandRefetch = async (scopeKey: string) => {
  const state = demandRefetchStates.get(scopeKey);
  if (!state || state.running) return;

  state.timer = undefined;
  state.running = true;
  try {
    do {
      const succeeded = await state.refetch();
      if (!succeeded) return;
    } while (
      getCompletedMarketsConfigsDemandVersion(scopeKey) <
      getMarketsConfigsDemandVersion(scopeKey)
    );
  } finally {
    demandRefetchStates.delete(scopeKey);
  }
};

export const scheduleMarketsConfigsDemandRefetch = (
  scopeKey: string,
  refetch: () => Promise<boolean>,
) => {
  const existing = demandRefetchStates.get(scopeKey);
  if (existing) {
    existing.refetch = refetch;
    return;
  }

  const state: DemandRefetchState = { refetch, running: false };
  const timer = setTimeout(() => {
    void runMarketsConfigsDemandRefetch(scopeKey);
  }, 0);
  state.timer = timer;
  demandRefetchStates.set(scopeKey, state);
};

export const areMarketsConfigsDemandsCovered = (
  demandedMarketAddresses: ReadonlySet<string>,
  availableMarketAddresses: ReadonlySet<string>,
  successfulMarketAddresses: ReadonlySet<string>,
) => {
  for (const address of demandedMarketAddresses) {
    const normalizedAddress = address.toLowerCase();
    // Demands outside the query's market universe are intentionally ignored.
    if (!availableMarketAddresses.has(normalizedAddress)) continue;
    if (!successfulMarketAddresses.has(normalizedAddress)) return false;
  }

  return true;
};

export const shouldRefreshAllMarketsConfigs = ({
  fullSnapshotLoaded,
  lastFullSnapshotAt,
  now,
  backgroundRefreshInterval,
}: {
  fullSnapshotLoaded: boolean;
  lastFullSnapshotAt: number;
  now: number;
  backgroundRefreshInterval: number;
}) =>
  !fullSnapshotLoaded || now - lastFullSnapshotAt >= backgroundRefreshInterval;

export const shouldAttemptFullMarketsRefresh = ({
  lastFullSnapshotAttemptAt,
  now,
  backgroundRefreshInterval,
}: {
  lastFullSnapshotAttemptAt: number;
  now: number;
  backgroundRefreshInterval: number;
}) =>
  lastFullSnapshotAttemptAt === 0 ||
  now - lastFullSnapshotAttemptAt >= backgroundRefreshInterval;

export const selectMarketsConfigsRequestInsts = <
  T extends Pick<Market, 'marketTokenAddress'>,
>(
  marketInsts: T[],
  activeMarketAddresses: ReadonlySet<string>,
  refreshAllMarkets: boolean,
) => {
  if (activeMarketAddresses.size > 0) {
    return marketInsts.filter((inst) =>
      activeMarketAddresses.has(inst.marketTokenAddress.toLowerCase()),
    );
  }

  return refreshAllMarkets ? marketInsts : [];
};
