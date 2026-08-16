import { useEffect, useMemo, useState } from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { formatUnits } from 'viem';
import type {
  GenesisOverview,
  GenesisMeritsEpoch,
  GenesisMeritsSeason,
  GenesisVaultConfig,
} from '@/services/rest/genesis';

const rawUsdToNumber = (value: string | undefined) => {
  if (value === undefined) return undefined;
  try {
    return Number(formatUnits(BigInt(value), USD_DECIMALS));
  } catch {
    return undefined;
  }
};

export const sharesRawToUsd = ({
  sharesRaw,
  supply,
  tvl,
}: {
  sharesRaw?: string;
  supply?: string;
  tvl?: string;
}) => {
  if (sharesRaw === undefined || supply === undefined || tvl === undefined) {
    return undefined;
  }

  try {
    const supplyRaw = BigInt(supply);
    if (supplyRaw === 0n) return undefined;

    const usdRaw = (BigInt(sharesRaw) * BigInt(tvl)) / supplyRaw;
    return formatUnits(usdRaw, USD_DECIMALS);
  } catch {
    return undefined;
  }
};

export const getAffectedUnmaturedUsd = ({
  withdrawShares,
  unmaturedShares,
  unmaturedUsd,
}: {
  withdrawShares: number;
  unmaturedShares: number;
  unmaturedUsd: number;
}) => {
  if (
    !Number.isFinite(withdrawShares) ||
    !Number.isFinite(unmaturedShares) ||
    !Number.isFinite(unmaturedUsd) ||
    withdrawShares <= 0 ||
    unmaturedShares <= 0 ||
    unmaturedUsd <= 0
  ) {
    return 0;
  }

  const affectedShares = Math.min(withdrawShares, unmaturedShares);
  const lpPrice = unmaturedUsd / unmaturedShares;
  return affectedShares * lpPrice;
};

export const getGenesisRewardsLockedAt = ({
  unmaturedUsd,
  apr,
  durationDays,
  startMs,
  endMs,
  nowMs,
}: {
  unmaturedUsd: number;
  apr: number;
  durationDays: number;
  startMs: number;
  endMs: number;
  nowMs: number;
}) => {
  const target = unmaturedUsd * (apr / 100 / 365) * durationDays;
  const activityDurationMs = endMs - startMs;
  const progress =
    activityDurationMs > 0
      ? Math.min(1, Math.max(0, (nowMs - startMs) / activityDurationMs))
      : 1;

  return target * progress;
};

export const getGenesisMeritsLockedAt = ({
  settledMerits,
  epoch,
  epochTotalMerit,
  epochStartMs,
  epochEndMs,
  nowMs,
}: {
  settledMerits?: string;
  epoch?: GenesisMeritsEpoch | null;
  epochTotalMerit?: string;
  epochStartMs?: number;
  epochEndMs?: number;
  nowMs: number;
}) => {
  const settled = Number(settledMerits ?? '0');
  const settledMeritsValue =
    Number.isFinite(settled) && settled >= 0 ? settled : 0;
  const legacyEpoch =
    !epoch &&
    epochTotalMerit !== undefined &&
    epochStartMs !== undefined &&
    epochEndMs !== undefined
      ? {
          startMs: epochStartMs,
          endMs: epochEndMs,
          poolTotal: epochTotalMerit,
        }
      : epoch;
  if (!legacyEpoch) return settledMeritsValue;

  const poolTotal = Number(legacyEpoch.poolTotal);
  if (!Number.isFinite(poolTotal) || poolTotal < 0) return settledMeritsValue;
  const epochDurationMs = legacyEpoch.endMs - legacyEpoch.startMs;
  const progress =
    epochDurationMs > 0
      ? Math.min(
          1,
          Math.max(0, (nowMs - legacyEpoch.startMs) / epochDurationMs),
        )
      : 1;

  return settledMeritsValue + poolTotal * progress;
};

export const useGenesisRealtimeLockedIn = (
  config: GenesisVaultConfig | undefined,
  overview: GenesisOverview | undefined,
  meritsSeason?: GenesisMeritsSeason,
  meritsEpoch?: GenesisMeritsEpoch | null,
) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!config || !overview) return;

    const endMs = Math.max(
      meritsSeason?.endMs ?? 0,
      meritsEpoch?.endMs ?? 0,
      config.epochEndMs ?? 0,
    );
    const updateNow = () => {
      const nextNowMs = Date.now();
      setNowMs(nextNowMs);
      return nextNowMs;
    };

    if (updateNow() >= endMs && endMs > 0) return;

    const timer = window.setInterval(() => {
      if (updateNow() >= endMs && endMs > 0) {
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    config,
    meritsEpoch?.endMs,
    meritsSeason?.endMs,
    overview,
  ]);

  return useMemo(() => {
    if (!config || !overview) return undefined;

    const unmaturedUsd = rawUsdToNumber(overview.unmaturedDepositsUsdRaw) ?? 0;
    const rewardsLocked = meritsSeason
      ? getGenesisRewardsLockedAt({
          unmaturedUsd,
          apr: config.apr,
          durationDays: meritsSeason.durationDays,
          startMs: meritsSeason.startMs,
          endMs: meritsSeason.endMs,
          nowMs,
        })
      : 0;

    const meritsLocked = meritsSeason
      ? getGenesisMeritsLockedAt({
          settledMerits: meritsSeason.totalSettledMerits,
          epoch: meritsEpoch,
          nowMs,
        })
      : getGenesisMeritsLockedAt({
          settledMerits: '0',
          epoch:
            config.epochTotalMerit &&
            config.epochStartMs !== undefined &&
            config.epochEndMs !== undefined
              ? {
                  seasonId: 0,
                  startMs: config.epochStartMs,
                  endMs: config.epochEndMs,
                  durationDays: 0,
                  poolTotal: config.epochTotalMerit,
                }
              : null,
          nowMs,
        });

    return {
      rewardsLocked: String(Math.max(0, rewardsLocked)),
      meritsLocked: String(Math.max(0, meritsLocked)),
    };
  }, [config, meritsEpoch, meritsSeason, nowMs, overview]);
};

export const mergeGenesisOverviewIntoConfig = (
  config: GenesisVaultConfig | undefined,
  overview: GenesisOverview | undefined,
  realtimeLockedIn?: {
    rewardsLocked: string;
    meritsLocked: string;
  },
) => {
  if (!config || !overview) return config;

  return {
    ...config,
    earlyBirds: overview.earlyBirds,
    rewardsLocked: realtimeLockedIn?.rewardsLocked ?? config.rewardsLocked,
    meritsLocked: realtimeLockedIn?.meritsLocked ?? config.meritsLocked,
  };
};

export const mergeGenesisSeasonIntoConfig = (
  config: GenesisVaultConfig | undefined,
  season?: GenesisMeritsSeason,
  nowMs = Date.now(),
) => {
  if (!config || !season) return config;
  const phase: GenesisVaultConfig['phase'] =
    nowMs < season.startMs
      ? 'not_started'
      : nowMs >= season.endMs
        ? 'ended'
        : 'full';
  const countdownSec =
    phase === 'not_started'
      ? Math.max(0, Math.ceil((season.startMs - nowMs) / 1000))
      : phase === 'full'
        ? Math.max(0, Math.ceil((season.endMs - nowMs) / 1000))
        : null;

  return {
    ...config,
    seasonName: season.seasonName,
    phase,
    startMs: season.startMs,
    endMs: season.endMs,
    countdownSec,
  };
};
