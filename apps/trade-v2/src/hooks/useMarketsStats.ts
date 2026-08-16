import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  getAvailableUsdLiquidityForPosition,
  getMinLeverageByMaxCollateralFactor,
  getMaxAllowedLeverageByMinCollateralFactor,
} from '@hertzflow/sdk-v2/utils/markets';
import { BASIS_POINTS_DIVISOR } from '@hertzflow/sdk-v2/utils/numbers';
import { BN, calc } from '@repo/lib/calc';
import {
  CONTRACT_USD_MULTIPLIER,
  useInstStore,
  useMarketConfigs,
  useMarketsConfigs,
  useMarketsValues,
  usePriceStore,
} from '@/common';
import type { Inst } from '@/common/services';
import {
  HYPER_LEVERAGE_MAX,
  HYPER_LEVERAGE_MIN,
  MAX_PROFIT_RATE,
  NORMAL_LEVERAGE_MAX,
} from '@/constants/trade';
import {
  clearMarketScheduleCaches,
  getNextMarketTransition,
  isMarketOpenNow,
} from '@/lib/market/dateConverter';
import type { MarketConfig, MarketInfo } from '@hertzflow/sdk-v2/types/markets';

type MarketMaxLeverageInst = Inst;

const LEVERAGE_STEP = 5;

const roundLeverageDownToStep = (leverage: number) =>
  Math.floor(leverage / LEVERAGE_STEP) * LEVERAGE_STEP;

const roundLeverageUpToStep = (leverage: number) =>
  Math.ceil(leverage / LEVERAGE_STEP) * LEVERAGE_STEP;

// hook to get markets stats
export const useMarketsStats = () => {
  const insts = useInstStore((state) => state.getViewInstsArr());
  const coins = useInstStore((state) => state.getCoins());

  const { data: marketsConfigs } = useMarketsConfigs({
    markets: insts,
    refreshPriority: 'background',
  });
  const { data: marketsValues } = useMarketsValues(undefined, {
    markets: insts,
    refreshPriority: 'background',
  });
  const pricesMap = usePriceStore((state) => state.pricesMap);

  return useMemo(() => {
    return insts.reduce(
      (acc, cur) => {
        const marketConfigs = marketsConfigs?.[cur.marketTokenAddress];
        const marketValues = marketsValues?.[cur.marketTokenAddress];

        const liqLong = getAvailableUsdLiquidityForPosition(
          {
            ...cur,
            ...(marketValues || {}),
            ...(marketConfigs || {}),
          } as unknown as MarketInfo,
          true,
          pricesMap,
          coins,
        );
        const liqShort = getAvailableUsdLiquidityForPosition(
          {
            ...cur,
            ...(marketValues || {}),
            ...(marketConfigs || {}),
          } as unknown as MarketInfo,
          false,
          pricesMap,
          coins,
        );
        acc[cur.marketTokenAddress] = {
          liqLong: calc(liqLong.toString()).div(CONTRACT_USD_MULTIPLIER),
          liqShort: calc(liqShort.toString()).div(CONTRACT_USD_MULTIPLIER),
          oiLong: calc((marketValues?.longInterestUsd ?? 0n).toString()).div(
            CONTRACT_USD_MULTIPLIER,
          ),
          oiShort: calc((marketValues?.shortInterestUsd ?? 0n).toString()).div(
            CONTRACT_USD_MULTIPLIER,
          ),
        };
        return acc;
      },
      {} as Record<
        string,
        { liqLong: BN; liqShort: BN; oiLong: BN; oiShort: BN }
      >,
    );
  }, [marketsConfigs, marketsValues, pricesMap, insts, coins]);
};

// function to check if market is open based on schedule
export const marketIsOpen = (inst?: Inst) => {
  return isMarketOpenNow(inst?.schedule);
};

let marketScheduleTimer: ReturnType<typeof setInterval> | undefined;
const marketScheduleSubscribers = new Set<() => void>();
const marketScheduleTransitionTimers = new Map<
  string,
  { subscribers: number; timer: ReturnType<typeof setTimeout>; time: number }
>();

const emitMarketScheduleChange = () => {
  clearMarketScheduleCaches();
  marketScheduleSubscribers.forEach((callback) => callback());
};

const getMarketScheduleTransitionKey = (schedule?: string) =>
  schedule || '24x7';

const subscribeMarketScheduleTransition = (schedule?: string) => {
  const { isOpen, nextCloseTime, nextOpenTime } =
    getNextMarketTransition(schedule);
  const nextTransitionTime = isOpen ? nextCloseTime : nextOpenTime;

  if (!nextTransitionTime) return;

  const key = getMarketScheduleTransitionKey(schedule);
  const existingTimer = marketScheduleTransitionTimers.get(key);
  if (existingTimer && existingTimer.time === nextTransitionTime) {
    existingTimer.subscribers += 1;

    return () => {
      const timer = marketScheduleTransitionTimers.get(key);
      if (!timer) return;

      timer.subscribers -= 1;
      if (timer.subscribers > 0) return;

      clearTimeout(timer.timer);
      marketScheduleTransitionTimers.delete(key);
    };
  }

  if (existingTimer) {
    clearTimeout(existingTimer.timer);
  }

  const timer = setTimeout(
    () => {
      marketScheduleTransitionTimers.delete(key);
      emitMarketScheduleChange();
    },
    Math.max(nextTransitionTime - Date.now(), 0) + 250,
  );

  marketScheduleTransitionTimers.set(key, {
    subscribers: (existingTimer?.subscribers ?? 0) + 1,
    timer,
    time: nextTransitionTime,
  });

  return () => {
    const timer = marketScheduleTransitionTimers.get(key);
    if (!timer) return;

    timer.subscribers -= 1;
    if (timer.subscribers > 0) return;

    clearTimeout(timer.timer);
    marketScheduleTransitionTimers.delete(key);
  };
};

const subscribeMarketSchedule = (callback: () => void) => {
  marketScheduleSubscribers.add(callback);
  if (!marketScheduleTimer) {
    marketScheduleTimer = setInterval(emitMarketScheduleChange, 60_000);
  }

  return () => {
    marketScheduleSubscribers.delete(callback);
    if (!marketScheduleSubscribers.size && marketScheduleTimer) {
      clearInterval(marketScheduleTimer);
      marketScheduleTimer = undefined;
    }
  };
};

// hook to check if market is open
export const useMarketIsOpen = (inst?: Inst) => {
  const schedule = inst?.schedule;
  const getSnapshot = useCallback(() => isMarketOpenNow(schedule), [schedule]);
  const isOpen = useSyncExternalStore(
    subscribeMarketSchedule,
    getSnapshot,
    getSnapshot,
  );
  const refetch = useCallback(() => {
    emitMarketScheduleChange();
  }, []);

  useEffect(() => {
    return subscribeMarketScheduleTransition(schedule);
  }, [schedule, isOpen]);

  return {
    data: isOpen,
    refetch,
  };
};

const getMarketMaxLeverageFromContract = (config: MarketConfig | undefined) =>
  config?.minCollateralFactor
    ? getMaxAllowedLeverageByMinCollateralFactor(config.minCollateralFactor, {
        minCollateralFactorForLiquidation:
          config.minCollateralFactorForLiquidation,
        positionFeeFactor: config.positionFeeFactorForBalanceWasNotImproved,
      }) / BASIS_POINTS_DIVISOR
    : undefined;

export const getMarketMaxLeverage = (
  inst: MarketMaxLeverageInst | undefined,
  config: MarketConfig | undefined,
) => {
  if (!inst) {
    return NORMAL_LEVERAGE_MAX;
  }

  // API value
  const maxFromApi = inst.max_leverage_normal
    ? roundLeverageDownToStep(Number(inst.max_leverage_normal))
    : undefined;

  const maxFromContract = getMarketMaxLeverageFromContract(config);

  // Take the more restrictive (smaller) value
  if (maxFromApi && maxFromContract)
    return Math.min(maxFromApi, maxFromContract);
  return maxFromApi ?? maxFromContract ?? NORMAL_LEVERAGE_MAX;
};

// hook to get market max leverage for normal mode
// Takes the more restrictive value between API and contract
export const useMarketMaxLeverage = (inst?: MarketMaxLeverageInst) => {
  const { data: marketConfig } = useMarketConfigs(inst);

  return getMarketMaxLeverage(inst, marketConfig);
};

export const useMarketMaxLeverages = (insts: MarketMaxLeverageInst[]) => {
  const { data: marketsConfigs } = useMarketsConfigs({ markets: insts });

  return useMemo<Partial<Record<string, number>>>(() => {
    return insts.reduce(
      (acc, inst) => {
        acc[inst.marketTokenAddress] = getMarketMaxLeverage(
          inst,
          marketsConfigs?.[inst.marketTokenAddress],
        );
        return acc;
      },
      {} as Partial<Record<string, number>>,
    );
  }, [insts, marketsConfigs]);
};

// hook to get hyper leverage range
// Takes the more restrictive bounds between API and contract
export const getHyperLeverageRange = (
  inst: Inst | undefined,
  config: MarketConfig | undefined,
) => {
  if (!inst) {
    return { min: HYPER_LEVERAGE_MIN, max: HYPER_LEVERAGE_MAX };
  }

  // API values
  const minFromApi = inst.min_leverage_hyper
    ? roundLeverageUpToStep(Number(inst.min_leverage_hyper))
    : undefined;
  const maxFromApi = inst.max_leverage_hyper
    ? roundLeverageDownToStep(Number(inst.max_leverage_hyper))
    : undefined;

  // Contract values (maxFactor → minLeverage, minFactor → maxLeverage)
  // Min leverage rounds up, max leverage rounds down to stay within contract limits
  const minFromContract =
    config?.maxZFPCollateralFactor && config.maxZFPCollateralFactor !== 0n
      ? Math.ceil(
          getMinLeverageByMaxCollateralFactor(config.maxZFPCollateralFactor) /
            BASIS_POINTS_DIVISOR,
        )
      : undefined;
  const maxFromContract =
    config?.minZFPCollateralFactor && config.minZFPCollateralFactor !== 0n
      ? Math.floor(
          getMaxAllowedLeverageByMinCollateralFactor(
            config.minZFPCollateralFactor,
            {
              minCollateralFactorForLiquidation:
                config.minZFPCollateralFactorForLiquidation,
              positionFeeFactor: 0n,
            },
          ) / BASIS_POINTS_DIVISOR,
        )
      : undefined;

  // Take the more restrictive bounds: larger min, smaller max
  const min =
    minFromApi && minFromContract
      ? Math.max(minFromApi, minFromContract)
      : (minFromApi ?? minFromContract ?? HYPER_LEVERAGE_MIN);
  const max =
    maxFromApi && maxFromContract
      ? Math.min(maxFromApi, maxFromContract)
      : (maxFromApi ?? maxFromContract ?? HYPER_LEVERAGE_MAX);

  return { min, max };
};

export const useHyperLeverageRange = (inst?: Inst) => {
  const { data: config } = useMarketConfigs(inst);
  return getHyperLeverageRange(inst, config);
};

// hook to get max profit rate from contract config
export function useMaxProfitRate(inst?: Inst): number {
  const { data: config } = useMarketConfigs(inst);

  if (!inst) {
    return MAX_PROFIT_RATE;
  }

  const maxProfitFactor = config?.maxProfitFactor;

  if (!maxProfitFactor || maxProfitFactor === 0n) {
    return MAX_PROFIT_RATE;
  }

  // Convert from contract value (with 30 decimals) to actual rate
  // Use calc for precision-safe conversion, same pattern as other USD values in this file
  const rate = calc(maxProfitFactor.toString())
    .div(CONTRACT_USD_MULTIPLIER)
    .toNumber();

  return rate;
}
