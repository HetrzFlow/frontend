import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { formatLeaderboardRankPercent } from '@/containers/leaderboard/display';

export type MeritsScope = 'all' | string;
export type MeritsSourceId = 'trading' | 'liquidity' | 'referral' | 'swap';

export interface MeritsSeason {
  id: string;
  seasonId: number;
  index: number;
  name: string;
  status: 'active' | 'ended' | 'upcoming';
  variant: 'standard' | 'pre_deposit';
  dateRange: string;
  startAt: number;
  endAt: number;
  enabledSources: MeritsSourceId[];
  totalSettledMerits: string;
}

export interface MeritsCatalog {
  currentSeasonId: string | null;
  seasons: MeritsSeason[];
}

export interface MeritsRank {
  position: number | null;
  topPercent: string | null;
}

export interface MeritsOverview {
  settledMerits: string;
  rank: MeritsRank;
  rewardStatus?: 'settling' | 'settled' | 'formula' | 'ready' | 'credited';
}

export interface MeritsEpoch {
  id: string;
  pool: string;
  startAt: number;
  endAt: number;
  status: 'active' | 'settling';
}

export interface MeritsBreakdownItem {
  source: MeritsSourceId;
  amount: string;
}

export interface MeritsShareData {
  referralCode: string;
  shareLink: string;
}

interface ApiSeason {
  seasonId: number;
  seasonName: string;
  status: string;
  startMs: number;
  endMs: number;
  tracks: string[];
  totalSettledMerits: string;
}

interface ApiEpoch {
  seasonId: number;
  startMs: number;
  endMs: number;
  poolTotal: string;
}

interface ApiUserSummary {
  seasonCumulative: {
    trading: string;
    lp: string;
    referral: string;
    spot: string;
  };
}

interface ApiLpEstimate {
  rewardShare: string;
  boostRewardShare: string;
  estimated10xMerits: string;
  lpPoolTotal: string;
  boostExtraMultiplier: string;
  epochStartSec: number;
  epochEndSec: number;
  asOfSec: number;
}

const SOURCE_MAP: Record<string, MeritsSourceId | undefined> = {
  trading: 'trading',
  lp: 'liquidity',
  referral: 'referral',
  spot: 'swap',
  swap: 'swap',
};

const SOURCE_FIELD: Record<
  MeritsSourceId,
  keyof ApiUserSummary['seasonCumulative']
> = {
  trading: 'trading',
  liquidity: 'lp',
  referral: 'referral',
  swap: 'spot',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

export const EMPTY_MERITS_CATALOG: MeritsCatalog = {
  currentSeasonId: null,
  seasons: [],
};

const normalizeStatus = (status: string): MeritsSeason['status'] => {
  if (status === 'active') return 'active';
  if (status === 'upcoming') return 'upcoming';
  return 'ended';
};

export const toMeritsCatalog = (apiSeasons: ApiSeason[]): MeritsCatalog => {
  const seasons = [...apiSeasons]
    .sort((a, b) => b.startMs - a.startMs)
    .map<MeritsSeason>((season, index) => {
      const enabledSources = Array.from(
        new Set(
          season.tracks
            .map((track) => SOURCE_MAP[track])
            .filter((source): source is MeritsSourceId => Boolean(source)),
        ),
      );

      return {
        id: String(season.seasonId),
        seasonId: season.seasonId,
        index: index + 1,
        name: season.seasonName,
        status: normalizeStatus(season.status),
        // ponytail: tracks are the only current variant signal; use the API
        // variant field when the contract exposes one.
        variant:
          enabledSources.length === 1 && enabledSources[0] === 'liquidity'
            ? 'pre_deposit'
            : 'standard',
        dateRange: `${dateFormatter.format(season.startMs)}–${dateFormatter.format(season.endMs)}`,
        startAt: season.startMs,
        endAt: season.endMs,
        enabledSources,
        totalSettledMerits: season.totalSettledMerits,
      };
    });
  const active = seasons.filter((season) => season.status === 'active');
  const latestPublished = seasons.find(
    (season) => season.status !== 'upcoming',
  );

  return {
    currentSeasonId: active[0]?.id ?? latestPublished?.id ?? null,
    seasons,
  };
};

export const resolveDefaultScope = (catalog: MeritsCatalog): MeritsScope => {
  const published = catalog.seasons.filter(
    (season) => season.status !== 'upcoming',
  );
  const active = published.filter((season) => season.status === 'active');
  if (active.length >= 2) return 'all';
  if (active.length === 1) return active[0]!.id;
  return published[0]?.id ?? 'all';
};

export const getInitialScope = (catalog: MeritsCatalog): MeritsScope =>
  resolveDefaultScope(catalog);

export const toMeritsEpoch = (epoch: ApiEpoch): MeritsEpoch => ({
  id: `${epoch.seasonId}:${epoch.startMs}`,
  pool: epoch.poolTotal,
  startAt: epoch.startMs,
  endAt: epoch.endMs,
  status: 'active',
});

export const getMeritsOverview = (
  settledMerits = '0',
  rank: MeritsRank = { position: null, topPercent: null },
): MeritsOverview => ({ settledMerits, rank });

export const toMeritsBreakdown = (
  summary: ApiUserSummary,
  enabledSources: MeritsSourceId[],
): MeritsBreakdownItem[] =>
  enabledSources.map((source) => ({
    source,
    amount: summary.seasonCumulative[SOURCE_FIELD[source]],
  }));

export const calculateEstimate = (
  estimate: ApiLpEstimate,
  nowMs: number,
): string | null => {
  const duration = estimate.epochEndSec - estimate.epochStartSec;
  const rewardShare = calc(estimate.rewardShare);
  const boostRewardShare = calc(estimate.boostRewardShare);
  if (
    duration <= 0 ||
    rewardShare.lt(0) ||
    rewardShare.gt(1) ||
    boostRewardShare.lt(0) ||
    boostRewardShare.gt(1)
  ) {
    return null;
  }

  const elapsed = Math.max(
    0,
    Math.min(Math.floor(nowMs / 1000), estimate.epochEndSec) - estimate.asOfSec,
  );
  const releaseRate = calc(estimate.lpPoolTotal).div(duration);
  const liveEstimate = calc(estimate.estimated10xMerits)
    .plus(rewardShare.times(releaseRate).times(elapsed))
    .plus(
      boostRewardShare
        .times(estimate.boostExtraMultiplier)
        .times(releaseRate)
        .times(elapsed),
    );

  return truncate(calc.max(liveEstimate, 0), 2);
};

export const getCountdown = (endAt: number, now: number) => {
  const totalSeconds = Math.max(0, Math.floor((endAt - now) / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
};

export const formatMerits = (
  value: string | number,
  maximumFractionDigits = 0,
) => {
  const [integer, decimal] = truncate(value, maximumFractionDigits).split('.');
  const formattedInteger = integer!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
};

export const formatMeritsRank = (position: number | null) =>
  position === null ? '-' : formatMerits(position);

export const getMeritsTopPercent = (
  position: number | null,
  topPercent: string | null,
) => {
  const formatted = topPercent
    ? formatLeaderboardRankPercent(topPercent)
    : position !== null && position <= 100
      ? '1%'
      : null;
  return formatted?.replace(/%$/, '') ?? null;
};

export const getBreakdownPercentages = (items: MeritsBreakdownItem[]) => {
  const total = items.reduce((sum, item) => sum.plus(item.amount), calc(0));
  if (total.isZero()) return items.map(() => 0);
  const raw = items.map((item) => calc(item.amount).div(total).times(100));
  const rounded = raw.map((value) =>
    value.integerValue(ROUND_MODE.DOWN).toNumber(),
  );
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  raw
    .map((value, index) => ({
      index,
      remainder: value.minus(rounded[index]!).toNumber(),
    }))
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(({ index }) => {
      if (remaining > 0) {
        rounded[index]! += 1;
        remaining -= 1;
      }
    });
  return rounded;
};

export const getPublicSeason = (catalog: MeritsCatalog) => {
  const active = catalog.seasons.filter((season) => season.status === 'active');
  if (active.length === 1) return active[0];
  return catalog.seasons.find(
    (season) => season.id === catalog.currentSeasonId,
  );
};
